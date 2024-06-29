import { memoryDb } from "../db";
import { logger } from "../logger";

let eventInProgress = false
let calculateApgInProgress = false
export const calculateApg = async ({
  mepasJSON,
  melabJSON,
}: {
  mepasJSON: [string, number][];
  melabJSON: [string, number][];
}) => {
  if (calculateApgInProgress) {
    return
  }

  calculateApgInProgress = true
  const date = mepasJSON[mepasJSON.length - 1][0];
  const mepas = Math.round(mepasJSON[mepasJSON.length - 1][1]);
  const melab = Math.round(melabJSON[melabJSON.length - 1][1]);

  const alertType =
    mepas > 35000 && mepas / melab < 2
      ? 1
      : mepas > 100000 && mepas / melab > 2
      ? 2
      : 0;

  await memoryDb.update(async (data) => {
    data.mepas = mepas;
    data.melab = melab;
    data.date = date;
    data.alertType = alertType;
  });

  if ((alertType === 1 || alertType === 2) && !eventInProgress) {
    eventInProgress = true;
    try {
      const form = new FormData();
      const text =
        2 === alertType
          ? `Nilai RSAM **${Math.round(
              mepas
            )}**\nTerjadi Gempa VT Kuat \n**${date}**`
          : `Nilai RSAM **${Math.round(
              mepas
            )}**\nWaspadai APG > 1KM \n**${date}**`;

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
    } catch (error) {
      logger.log("faild to send photo notification to telegram: ", error);
    }
  }

  if (mepas <= 40000) {
    eventInProgress = false;
  }

  calculateApgInProgress = false
};
