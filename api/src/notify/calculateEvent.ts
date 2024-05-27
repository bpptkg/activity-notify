import dayjs from "dayjs";
import { eventsDb } from "../db";
import { findMedian } from "../utils";
import { JSONFilePreset } from "lowdb/node";
import path from "path";
import { sendCctv } from "./sendCctv";
import FormData from "form-data";
import { plotStream } from "./plotStream";
import axios from "axios";

let eventInProgress = 0;
let highRsam = 0;
let isRf = false;
let event: {date: string, median: number, data: number[], ratio: number, high?: number} | null = null;
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
      const duration = Math.round((Date.now() - eventInProgress) / 1000)
      if ((event!.median > 2500 && duration > 10) || (event!.median <= 2500 && duration > 25)) {
        await eventsDb.update((events) => {
          events.unshift(event);
        });
  
        try {
          const form = new FormData();
          const caption = `Terjadi gempa:\nWaktu: ${dayjs(eventInProgress).format(
            "YYYY-MM-DD HH:mm:ss"
          )} WIB\nRSAM: ${Math.round(highRsam)}\nDurasi: ${Math.round(
            (Date.now() - eventInProgress) / 1000
          )} detik\nRatio: ${event?.ratio}`;
          form.append("chat_id", "-1002026839953");
          form.append(isRf ? "caption" : "text", caption);
          form.append("parse_mode", "Markdown");
  
          if (isRf) {
            await plotStream(date, form);
          }
  
          const { data } = await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/${
            isRf ? "sendPhoto" : "sendMessage"
          }`, form)
          console.log("sent notification to telegram: ", data);
  
          if (isRf) {
            setTimeout(() => {
              sendCctv()
            }, 3000);
          }
        } catch (error) {
          console.log("faild to send photo notification to telegram: ", error);
        }
      }

      highRsam = 0;
      eventInProgress = 0;
      isRf = false;
    }
  } else {
    if (medianLastData > 1000) {
      eventInProgress = Date.now();
      highRsam = medianLastData;
      const ratio = mepas / melab
      isRf = ratio <= 2;
      event = {
        date,
        median: medianLastData,
        data: lastData,
        ratio,
      }
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
