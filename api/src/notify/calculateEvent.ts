import dayjs from "dayjs";
import { eventsDb } from "../db";
import { findMedian } from "../utils";
import { JSONFilePreset } from "lowdb/node";
import path from "path";
import { sendCctv } from "./sendCctv";
import FormData from "form-data";
import { plotStream } from "./plotStream";
import axios from "axios";

let eventInProgress = false;
let startTime = 0;
let highRsam = 0;
let isRf = false;
let event: {
  date: string;
  median: number;
  data: number[];
  ratio: number;
  high?: number;
} | null = null;
export const calculateEvent = async ({
  mepasJSON,
  melabJSON,
}: {
  mepasJSON: [string, number][];
  melabJSON: [string, number][];
}) => {
  if (eventInProgress) {
    return
  }

  const lastData = mepasJSON.map((x) => x[1]).slice(-3);
  const medianLastData = findMedian(lastData);
  const date = mepasJSON[mepasJSON.length - 1][0];
  const mepas = Math.round(mepasJSON[mepasJSON.length - 1][1]);
  const melab = Math.round(melabJSON[melabJSON.length - 1][1]);

  if (startTime) {
    if (highRsam < medianLastData) {
      highRsam = medianLastData;
    }

    if (medianLastData <= 750) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      const time = dayjs(startTime).format("YYYY-MM-DD HH:mm:ss");
      const rsam = Math.round(highRsam);

      if (
        (event!.median > 2500 && duration > 10) ||
        (event!.median <= 2500 && duration > 25)
      ) {
        eventInProgress = true
        try {
          await eventsDb.update((events) => {
            events.unshift(event);
          });

          const form = new FormData();
          const caption = `Terjadi gempa:\nWaktu: ${time} WIB\nRSAM: ${rsam}\nDurasi: ${duration} detik\nRatio: ${event?.ratio}`;
          form.append("chat_id", "-1002026839953");
          form.append("caption", caption);
          form.append("parse_mode", "Markdown");
          await plotStream(event!.date, form);

          const { data } = await axios.post(
            `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendPhoto`,
            form
          );
          console.log("sent notification to telegram: ", data);

          if (isRf) {
            setTimeout(() => {
              sendCctv();
            }, 2000);
          }
        } catch (error) {
          console.log("faild to send photo notification to telegram: ", error);
        }
        eventInProgress = false
      }

      highRsam = 0;
      startTime = 0;
      isRf = false;
    }
  } else {
    if (medianLastData > 1000) {
      eventInProgress = true;
      startTime = Date.now();
      highRsam = medianLastData;
      const ratio =
        Math.round((mepas / melab) * Math.pow(10, 2)) / Math.pow(10, 2);
      isRf = ratio <= 2;
      event = {
        date,
        median: medianLastData,
        data: lastData,
        ratio,
      };
    }
  }

  try {
    const logsDb = await JSONFilePreset<any[]>(
      path.resolve(
        process.cwd(),
        `./data/logs-${dayjs().format("YYYY-MM-DD-HH")}.json`
      ),
      []
    );

    await logsDb.update((logs) => {
      logs.unshift({
        date,
        median: medianLastData,
        data: lastData,
      });
    });
  } catch (error) {
    console.error(error);
  }
};
