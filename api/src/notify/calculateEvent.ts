import dayjs from "dayjs";
import { eventsDb } from "../db";
import { findMedian } from "../utils";
import { JSONFilePreset } from "lowdb/node";
import path from "path";

let eventInProgress = 0;
let highRsam = 0;
let isRf = false;
export const calculateEvent = async ({
  mepasJSON,
  melabJSON,
}: {
  mepasJSON: [string, number][];
  melabJSON: [string, number][];
}) => {
  const lastData = mepasJSON.map((x) => x[1]).slice(-3);
  const medianLastData = findMedian(lastData);
  const date = mepasJSON[mepasJSON.length - 1][0];
  const mepas = Math.round(mepasJSON[mepasJSON.length - 1][1]);
  const melab = Math.round(melabJSON[melabJSON.length - 1][1]);

  if (eventInProgress) {
    if (highRsam < medianLastData) {
      highRsam = medianLastData;
    }

    if (medianLastData <= 750) {
      try {
        const form = new FormData();
        const caption = `Terjadi gempa:\nWaktu: ${dayjs(eventInProgress).format(
          "YYYY-MM-DD HH:mm:ss"
        )} WIB\nRSAM: ${Math.round(highRsam)}\nDurasi: ${Math.round(
          (Date.now() - eventInProgress) / 1000
        )} detik`;
        form.append("chat_id", "-1002026839953");
        form.append(isRf ? "caption" : "text", caption);
        form.append("parse_mode", "Markdown");

        if (isRf) {
          const photoResponse = await fetch(
            `http://192.168.0.74:1984/api/frame.jpeg?src=main_JUR`
          );
          const photo = await photoResponse.blob();
          form.append("photo", photo);
        }

        const response = await fetch(
          `https://api.telegram.org/bot6715715865:AAEchBtNy2GlrX-o3ACJQnbTjvv476jBwjY/${
            isRf ? "sendPhoto" : "sendMessage"
          }`,
          {
            method: "POST",
            body: form,
          }
        );
        console.log("sent notification to telegram: ", await response.json());
      } catch (error) {
        console.log("faild to send photo notification to telegram: ", error);
      }

      highRsam = 0;
      eventInProgress = 0;
      isRf = false;
    }
  } else {
    if (medianLastData > 1000) {
      eventInProgress = Date.now();
      highRsam = medianLastData;
      isRf = mepas / melab <= 2;
      await eventsDb.update((events) => {
        events.unshift({
          date,
          median: medianLastData,
          data: lastData,
        });
      });
    }
  }

  try {
    const logsDb = await JSONFilePreset<any[]>(
      path.resolve(
        process.cwd(),
        `./data/logs-${dayjs().format("YYYY-MM-DD-HH-mm")}.json`
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
  } catch (error) {
    console.error(error);
  }
};