import dayjs from "dayjs";
import { eventsDb } from "../db";
import { findMedian } from "../utils";
import { JSONFilePreset } from "lowdb/node";
import path from "path";
import { sendCctv } from "./sendCctv";
import { sendEvent } from "./sendEvent";
import { sendPlot } from "./sendPlot";

let eventInProgress = false;
let imageIsSent = false;
let startTime = 0;
let highMepasRsam = 0;
let ratio = 0;
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
    return;
  }

  const lastMepasData = mepasJSON.map((x) => x[1]).slice(-3);
  const medianLastMepasData = findMedian(lastMepasData);
  const date = mepasJSON[mepasJSON.length - 1][0];
  const mepas = Math.round(mepasJSON[mepasJSON.length - 1][1]);
  const melab = Math.round(melabJSON[melabJSON.length - 1][1]);

  if (startTime) {
    if (highMepasRsam < medianLastMepasData) {
      highMepasRsam = medianLastMepasData;
      Math.round((mepas / melab) * Math.pow(10, 2)) / Math.pow(10, 2)
    }

    const time = dayjs(startTime).format("YYYY-MM-DD HH:mm:ss");
    const duration = Math.round((Date.now() - startTime) / 1000);
    if (medianLastMepasData <= 750) {
      const rsam = Math.round(highMepasRsam);

      if (
        (event!.median > 2500 && duration > 10) ||
        (event!.median <= 2500 && duration > 25)
      ) {
        eventInProgress = true;
        try {
          await eventsDb.update((events) => {
            events.unshift(event);
          });
          await sendEvent(event!, duration, time, rsam);
          if (!imageIsSent) {
            await sendPlot(event!.date);
            await sendCctv();
          }
        } catch (error) {
          console.error(error);
        }
        eventInProgress = false;
      }

      highMepasRsam = 0;
      startTime = 0;
    } else {
      if (duration > 35 && !imageIsSent) {
        imageIsSent = true;
        try {
          await sendPlot(event!.date);
          await sendCctv();
        } catch (error) {
          imageIsSent = false;
        }
      }
    }
  } else {
    if (medianLastMepasData > 1000) {
      eventInProgress = true;
      startTime = Date.now();
      highMepasRsam = medianLastMepasData;
      ratio =
        Math.round((mepas / melab) * Math.pow(10, 2)) / Math.pow(10, 2);
      event = {
        date,
        median: medianLastMepasData,
        data: lastMepasData,
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
        median: medianLastMepasData,
        data: lastMepasData,
      });
    });
  } catch (error) {
    console.error(error);
  }
};
