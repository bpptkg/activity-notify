import { JSONFilePreset } from "lowdb/node";
import { eventsDb } from "./db";
import { findMedian } from "./utils";
import path from "path";
import dayjs from "dayjs";

const csvToJSON = (csv: string): [string, number][] =>
  csv
    .split("\n")
    .filter(Boolean)
    .map((x) => {
      const row = x.split(",");
      return [row[0], Math.abs(Number(row[1]))];
    });

let eventInProgress = 0;
let highRsam = 0;
let loadingSendTelegram = false;
export const getRsamDataAlt = async () => {
  const [mepasRawVal] = await Promise.all(
    ["MEPAS_HHZ_VG_00"].map(async (code) => {
      const response = await fetch(
        `http://192.168.0.45:16030/rsam/?code=${code}&t1=-0.0005&rsamP=1&tz=Asia/Jakarta&csv=1&ds=1`
      );
      return response.text();
    })
  );

  const mepasJSON = csvToJSON(mepasRawVal);
  const mepas = mepasJSON[mepasJSON.length - 1][1];
  const date = mepasJSON[mepasJSON.length - 1][0];

  if (Number.isNaN(mepas)) {
    return;
  }

  const lastData = mepasJSON.map((x) => x[1]).slice(-3);
  const medianLastData = findMedian(lastData);

  if (eventInProgress) {
    if (highRsam < medianLastData) {
      highRsam = medianLastData;
    }

    if (medianLastData <= 500) {
      if (!loadingSendTelegram) {
        try {
          const message = `Terjadi gempa:\nWaktu: ${dayjs(
            eventInProgress
          ).format("YYYY-MM-DD HH:mm:ss")} WIB\nRSAM: ${highRsam}\nDurasi: ${
            Math.round(Date.now() - eventInProgress) / 1000
          } detik`;

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
                parse_mode: "Markdown",
              }),
            }
          );
        } catch (error) {
          console.log("faild to send notification to telegram: ", error);
        }

        try {
          const photoResponse = await fetch(
            `http://192.168.0.74:1984/api/frame.jpeg?src=main_JUR`
          );
          const photo = await photoResponse.blob();

          const form = new FormData();
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

      highRsam = 0;
      eventInProgress = 0;
    }
  } else {
    if (medianLastData > 1000) {
      eventInProgress = Date.now();
      highRsam = medianLastData;
      await eventsDb.update((events) => {
        events.unshift({
          date,
          median: medianLastData,
          data: lastData,
        });
      });
    }
  }

  const logsDb = await JSONFilePreset<any[]>(
    path.resolve(
      process.cwd(),
      `./data/logs-${new Date().toISOString().slice(0, 10)}.json`
    ),
    []
  );
  await logsDb.update((logs) => {
    logs.unshift({
      date,
      median: medianLastData,
      data: lastData,
      status: eventInProgress ? true : false,
    });
  });
};
