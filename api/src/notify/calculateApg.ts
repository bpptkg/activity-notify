import { JSONFilePreset } from "lowdb/node";
import { memoryDb, stateDb } from "../db";
import { logger } from "../logger";
import path from "path";
import dayjs from "dayjs";

let eventInProgress = false
export const calculateApg = async ({
  mepasJSON,
  melabJSON,
  meimoJSON
}: {
  mepasJSON: [string, number][];
  melabJSON: [string, number][];
  meimoJSON: [string, number][]
}) => {
  if (stateDb.data.calculateApgInProgress) {
    return
  }
  await stateDb.update((data) => {
    data.calculateApgInProgress = true
  });

  const date = mepasJSON[mepasJSON.length - 1][0];
  const mepas = Math.round(mepasJSON[mepasJSON.length - 1][1]);
  const melab = Math.round(melabJSON[melabJSON.length - 1][1]);
  const meimo = Math.round(meimoJSON[meimoJSON.length - 1][1]);

  const ratio = Math.round(mepas / melab * 100) / 100;

  const alertType = 
    mepas > 35000 && (ratio < 2) && meimo < 10000
        ? 1
        : mepas > 100000 && (ratio > 2) && meimo < 10000
          ? 2
          : 0;

  try {
    await memoryDb.update(async (data) => {
      data.mepas = mepas;
      data.melab = melab;
      data.meimo = meimo;
      data.date = date;
      data.alertType = alertType;
    });
  } catch (error) {
    logger.error("faild to send photo notification to telegram: ", error);
  }

  if ((alertType === 1 || alertType === 2) && !eventInProgress) {
    eventInProgress = true;
    try {
      const form = new FormData();
      const text = 2 === alertType
            ? `Nilai RSAM **${Math.round(
              mepas
            )}**\nTerjadi Gempa VT Kuat \nRasio: ${ratio} \n**${date}**`
            : `Nilai RSAM **${Math.round(
              mepas
            )}**\nWaspadai APG > 1KM \nRasio: ${ratio} \n**${date}**`;

      form.append("chat_id", "-1002026839953");
      form.append("text", text);
      form.append("parse_mode", "Markdown");

      await fetch(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          body: form,
        }
      );

      const logsDb = await JSONFilePreset<any[]>(
        path.resolve(
          process.cwd(),
          `./data/events-apg-vt-${dayjs().format("YYYY-MM")}.json`
        ),
        []
      );

      await logsDb.update((logs) => {
        logs.unshift({
          mepas: mepasJSON[mepasJSON.length - 1],
          melab: melabJSON[melabJSON.length - 1],
          meimo: meimoJSON[meimoJSON.length - 1],
          ratio
        });
      });
    } catch (error) {
      logger.error("faild to send photo notification to telegram: ", error);
    }
  }

  if (mepas <= 40000) {
    setTimeout(async () => {
      await stateDb.update((data) => {
        data.calculateApgInProgress = false
      });
    }, 10 * 1000);
  }

  await stateDb.update((data) => {
    data.calculateApgInProgress = false
  });
};
