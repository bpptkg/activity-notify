import { memoryDb } from "./db";

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
  const mepas = Math.round(mepasJSON[mepasJSON.length - 1][1]);
  const melab = Math.round(melabJSON[melabJSON.length - 1][1]);
  const date = mepasJSON[mepasJSON.length - 1][0];

  if (Number.isNaN(mepas)) {
    return;
  }

  const alertType =
    mepas > 5000 && mepas / melab < 2
      ? 1
      : mepas > 50000 && mepas / melab > 2
      ? 2
      : 0;

  memoryDb.update(async (data) => {
    data.mepas = mepas;
    data.melab = melab;
    data.date = date;
    data.alertType = alertType;
  });

  if (alertType === 1 || alertType === 2) {
    const message =
      2 === alertType
        ? `Nilai RSAM **${mepas}**\nTerjadi Gempa VT Kuat \n**${date}**`
        : `Nilai RSAM **${mepas}**\nWaspadai APG > 1KM \n**${date}**`;

    try {
      await fetch(
        `https://api.telegram.org/bot6715715865:AAEchBtNy2GlrX-o3ACJQnbTjvv476jBwjY/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: "-1002026839953",
            text: message,
            parse_mode: "Markdown"
          }),
        }
      );

      const photoResponse = await fetch(`http://192.168.0.47:10001/cctvs/capture/JUR`)
      const photo = await photoResponse.blob()

      const form = new FormData();
      form.append("photo", photo);

      const res= await fetch(
        `https://api.telegram.org/bot6715715865:AAEchBtNy2GlrX-o3ACJQnbTjvv476jBwjY/sendPhoto?chat_id=-1002026839953`,
        {
          method: "POST",
          body: form,
        }
      );
    } catch (error) {
      console.log("faild to send notification to telegram");
      console.log(error);
    }
  }
};
