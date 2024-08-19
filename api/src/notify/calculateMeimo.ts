import { logger } from "../logger";

let eventInProgress = false;
let calculateMeimoInProgress = false;
export const calculateMeimo = async ({
  meimoJSON,
}: {
  meimoJSON: [string, number][];
}) => {
  if (calculateMeimoInProgress) {
    return;
  }

  calculateMeimoInProgress = true;
  const date = meimoJSON[meimoJSON.length - 1][0];
  const meimo = Math.round(meimoJSON[meimoJSON.length - 1][1]);

  const alertType = meimo > 10000 ? 1 : 0;

  if (alertType === 1 && !eventInProgress) {
    eventInProgress = true;
    try {
      const form = new FormData();
      const text = `Nilai RSAM MEIMO **${Math.round(
        meimo
      )}**\nTerjadi Gempa Tektonik \n**${date}**`;

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
      logger.error("faild to send photo notification to telegram: ", error);
    }
  }

  if (meimo <= 1000) {
    eventInProgress = false;
  }

  calculateMeimoInProgress = false;
};
