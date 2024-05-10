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
let eventStart = "";
let eventEnd = "";
let eventMedianStart = 0;
let eventRsamStart = 0;

export const getRsamData = async () => {
  const [mepasRawVal, melabRawVal] = await Promise.all(
    ["MEPAS_HHZ_VG_00", "MELAB_HHZ_VG_00"].map(async (code) => {
      const response = await fetch(
        `http://192.168.0.45:16030/rsam/?code=${code}&t1=-0.0006&rsamP=10&tz=Asia/Jakarta&csv=1`
      );
      return response.text();
    })
  );

  const mepasJSON = csvToJSON(mepasRawVal);
  const melabJSON = csvToJSON(melabRawVal);
  const mepas = mepasJSON[mepasJSON.length - 1][1];
  const melab = melabJSON[melabJSON.length - 1][1];
  const date = mepasJSON[mepasJSON.length - 1][0];

  memoryDb.update((data) => {
    data.mepas = Math.round(mepas);
    data.melab = Math.round(melab);
    data.date = date;
    data.alertType =
      mepas > 5000 && mepas / melab < 2
        ? 1
        : mepas > 50000 && mepas / melab > 2
        ? 2
        : 0;
  });
  const median = findMedian(mepasJSON.map((x) => x[1]));

  console.log({ eventInProgress, mepas, median: median * 10 });

  if (!eventInProgress && mepas > median * 10) {
    eventStart = date;
    eventMedianStart = median;
    eventRsamStart = mepas;

    eventInProgress = true;
  } else if (eventInProgress && mepas <= median * 10) {
    eventEnd = date;

    await eventsDb.update((events) => {
      events.push({
        start: eventStart,
        end: eventEnd,
        median: eventMedianStart,
        rsam: eventRsamStart,
      });
    });
    eventInProgress = false;
  }
};
