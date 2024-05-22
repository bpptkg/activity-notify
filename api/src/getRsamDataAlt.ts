import { JSONFilePreset } from "lowdb/node";
import { eventsDb } from "./db";
import { findMedian } from "./utils";
import path from "path";

const csvToJSON = (csv: string): [string, number][] =>
  csv
    .split("\n")
    .filter(Boolean)
    .map((x) => {
      const row = x.split(",");
      return [row[0], Math.abs(Number(row[1]))];
    });

let eventInProgress = false;
export const getRsamDataAlt = async () => {
  const [mepasRawVal] = await Promise.all(
    ["MEPAS_HHZ_VG_00"].map(async (code) => {
      const response = await fetch(
        `http://192.168.0.45:16030/rsam/?code=${code}&t1=-0.0005&rsamP=1&tz=Asia/Jakarta&csv=1&ds=1`
      );
      return response.text();
    })
  );

  const mepasJSON = csvToJSON(mepasRawVal);
  const mepas = mepasJSON[mepasJSON.length - 1][1];
  const date = mepasJSON[mepasJSON.length - 1][0];

  if (Number.isNaN(mepas)) {
    return
  }

  const lastData = mepasJSON.map((x) => x[1]).slice(-3);
  const medianLastData = findMedian(lastData);

  if (medianLastData <= 500) {
    eventInProgress = false;
  }

  if (!eventInProgress && medianLastData > 1000) {
    eventInProgress = true;

    await eventsDb.update((events) => {
      events.unshift({
        date,
        median: medianLastData,
        data: lastData,
      });
    });
  }

  const logsDb = await JSONFilePreset<any[]>(path.resolve(process.cwd(), `./data/logs-${new Date().toISOString().slice(0, 10)}.json`), [])
  await logsDb.update((logs) => {
    logs.unshift({
      date,
      median: medianLastData,
      data: lastData,
      status: eventInProgress ? true : false,
    });
  });
};
