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
  
  if (mepas > median * 10 ) {
    await eventsDb.update((db) => db.unshift({
      median,
      lastRsam: mepas,
      data: mepasJSON,
    }))
  }
};
