import { JSONFilePreset } from "lowdb/node";
import { calculateApg } from "./notify/calculateApg";
import { calculateEvent } from "./notify/calculateEvent";
import path from "path";
import dayjs from "dayjs";
import { logger } from "./logger";

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
        `http://192.168.0.45:16030/rsam/?code=${code}&t1=-0.0006&rsamP=1&tz=Asia/Jakarta&csv=1`
      );
      return response.text();
    })
  );

  const mepasJSON = csvToJSON(mepasRawVal);
  const melabJSON = csvToJSON(melabRawVal);

  mepasJSON.pop()
  melabJSON.pop()

  if (Number.isNaN(mepasJSON[mepasJSON.length - 1][1])) {
    return;
  }

  await Promise.all([
    await calculateApg({
      mepasJSON,
      melabJSON,
    }),
    await calculateEvent({
      mepasJSON,
      melabJSON,
    }),
  ]);

  try {
    const logsDb = await JSONFilePreset<any[]>(
      path.resolve(
        process.cwd(),
        `./data/logs-${dayjs().format("YYYY-MM-DD-HH")}.json`
      ),
      []
    );

    await logsDb.update((logs) => {
      logs.unshift({
        mepasJSON,
        melabJSON
      });
    });
  } catch (error) {
    logger.error(error);
  }
};
