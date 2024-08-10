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
  try {
    const [mepasRawVal, melabRawVal, meimoRawVal] = await Promise.all(
      ["MEPAS_HHZ_VG_00", "MELAB_HHZ_VG_00","MEIMO_HHZ_VG_00"].map(async (code) => {
        const response = await fetch(
          `http://192.168.0.45:16030/rsam/?code=${code}&t1=-0.0006&rsamP=1&tz=Asia/Jakarta&csv=1`
        );
        return response.text();
      })
    );

    const mepasJSON = csvToJSON(mepasRawVal);
    const melabJSON = csvToJSON(melabRawVal);
    const meimoJSON = csvToJSON(meimoRawVal);

    mepasJSON.pop()
    melabJSON.pop()
    meimoJSON.pop()
    
    if (!mepasJSON.length || !melabJSON.length || !meimoJSON.length || Number.isNaN(mepasJSON[mepasJSON.length - 1][1])) {
      return;
    }

    await Promise.all([
      await calculateApg({
        mepasJSON,
        melabJSON,
        meimoJSON
      }),
      await calculateEvent({
        mepasJSON,
        melabJSON,
      }),
    ]);

    const logsDb = await JSONFilePreset<any[]>(
      path.resolve(
        process.cwd(),
        `./data/logs-${dayjs().format("YYYY-MM-DD-HH")}.json`
      ),
      []
    );

    await logsDb.update((logs) => {
      logs.unshift({
        mepas: mepasJSON[mepasJSON.length - 1],
        melab: melabJSON[melabJSON.length - 1],
      });
    });
  } catch (error: any) {
    logger.error(error.toString());
  }
};
