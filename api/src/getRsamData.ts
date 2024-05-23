import { memoryDb } from "./db";

const csvToJSON = (csv: string): [string, number][] =>
  csv
    .split("\n")
    .filter(Boolean)
    .map((x) => {
      const row = x.split(",");
      return [row[0], Math.abs(Number(row[1]))];
    });

let loadingSendTelegram = false;
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
  const mepas = Math.round(mepasJSON[mepasJSON.length - 1][1]);
  const melab = Math.round(melabJSON[melabJSON.length - 1][1]);
  const date = mepasJSON[mepasJSON.length - 1][0];

  if (Number.isNaN(mepas)) {
    return;
  }

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

  if ((alertType === 1 || alertType === 2) && !loadingSendTelegram) {
    loadingSendTelegram = true;
    try {
      const form = new FormData();
      const caption =
        2 === alertType
          ? `Nilai RSAM **${Math.round(mepas)}**\nTerjadi Gempa VT Kuat \n**${date}**`
          : `Nilai RSAM **${Math.round(mepas)}**\nWaspadai APG > 1KM \n**${date}**`;

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

    loadingSendTelegram = false;
  }
};
