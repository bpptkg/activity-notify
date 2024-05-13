import { eventsDb, memoryDb } from "./db";
import { findMedian } from "./utils";

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
        `http://192.168.0.45:16030/rsam/?code=${code}&t1=-0.0005&rsamP=1&tz=Asia/Jakarta&csv=1`
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

  const last30Data = mepasJSON.map((x) => x[1]).slice(-30);
  const medianLast30Data = findMedian(last30Data);

  const last2Data = last30Data.slice(-2);
  const avgLast2Data = last2Data.reduce((a, b) => a + b, 0) / last2Data.length;

  const value = avgLast2Data / medianLast30Data

  if (value <= 1) {
    eventInProgress = false;
  }

  if (!eventInProgress && value > 2) {
    eventInProgress = true;

    await eventsDb.update((events) => {
      events.unshift({
        date,
        value,
        data: mepasJSON.map((x) => [x[0], x[1]]),
      });
    });
  }
};
