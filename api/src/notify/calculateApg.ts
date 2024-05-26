import { memoryDb } from "../db";

let eventInProgress = false
export const calculateApg = async ({
  mepasJSON,
  melabJSON,
}: {
  mepasJSON: [string, number][];
  melabJSON: [string, number][];
}) => {
  const date = mepasJSON[mepasJSON.length - 1][0];
  const mepas = Math.round(mepasJSON[mepasJSON.length - 1][1]);
  const melab = Math.round(melabJSON[melabJSON.length - 1][1]);

  const alertType =
    mepas > 40000 && mepas / melab < 2
      ? 1
      : mepas > 40000 && mepas / melab > 2
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
      const caption =
        2 === alertType
          ? `Nilai RSAM **${Math.round(
              mepas
            )}**\nTerjadi Gempa VT Kuat \n**${date}**`
          : `Nilai RSAM **${Math.round(
              mepas
            )}**\nWaspadai APG > 1KM \n**${date}**`;

      form.append("chat_id", "-1002026839953");
      form.append("caption", caption);
      form.append("parse_mode", "Markdown");

      const photoResponse = await fetch(
        `http://192.168.0.74:1984/api/frame.jpeg?src=main_JUR`
      );
      const photo = await photoResponse.blob();
      form.append("photo", photo);

      await fetch(
        `https://api.telegram.org/bot6715715865:AAEchBtNy2GlrX-o3ACJQnbTjvv476jBwjY/sendPhoto?chat_id=-1002026839953`,
        {
          method: "POST",
          body: form,
        }
      );
    } catch (error) {
      console.log("faild to send photo notification to telegram: ", error);
    }
  }

  if (mepas <= 40000) {
    eventInProgress = false;
  }
};
