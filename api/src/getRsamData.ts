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
  const mepas = mepasJSON[mepasJSON.length - 1][1];
  const melab = melabJSON[melabJSON.length - 1][1];
  const date = mepasJSON[mepasJSON.length - 1][0];

  if (Number.isNaN(mepas)) {
    return;
  }

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

    if (data.alertType === 1 || data.alertType === 2) {
      const message = 1
        ? `Nilai RSAM ${mepas} <br> Waspadai APG > 1KM <br> <span style="font-size:12px;font-weight:normal">${date}</span>`
        : `Nilai RSAM ${mepas} <br>Terjadi Gempa VT Kuat <br> <span style="font-size:12px;font-weight:normal">${date}</span>`;

      fetch(
        `https://api.telegram.org/bot6715715865:AAEchBtNy2GlrX-o3ACJQnbTjvv476jBwjY/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: "-1002026839953",
            text: message,
          }),
        }
      ).then(() => {
        console.log("notification send to telegram");
      }).catch((err) => {
        console.log("faild to send notification to telegram");
        console.log(err);
      });
    }
  });
};
