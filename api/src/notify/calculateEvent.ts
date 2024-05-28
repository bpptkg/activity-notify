import dayjs from "dayjs";
import { eventsDb } from "../db";
import { findMedian } from "../utils";
import { sendCctv } from "./sendCctv";
import { sendEvent } from "./sendEvent";
import { sendPlot } from "./sendPlot";

let sendingMessageInProgress = false;
let imageIsSent = false;
let eventInProgress = false;
let date = "";
let highMepasRsam = 0;
let highMelabRsam = 0;
export const calculateEvent = async ({
  mepasJSON,
  melabJSON,
}: {
  mepasJSON: [string, number][];
  melabJSON: [string, number][];
}) => {
  if (sendingMessageInProgress) {
    return;
  }

  const lastMepasData = mepasJSON.map((x) => x[1]).slice(-3);
  const medianLastMepasData = Math.round(findMedian(lastMepasData));
  const lastMelabData = melabJSON.map((x) => x[1]).slice(-3);
  const medianLastMelabData = Math.round(findMedian(lastMelabData));

  if (eventInProgress) {
    if (highMepasRsam < medianLastMepasData) {
      highMepasRsam = medianLastMepasData;
    }
    if (highMelabRsam < medianLastMelabData) {
      highMelabRsam = medianLastMelabData;
    }

    const ratio =
      Math.round((highMepasRsam / highMelabRsam) * Math.pow(10, 2)) /
      Math.pow(10, 2);
    const time = dayjs(date).format("YYYY-MM-DD HH:mm:ss");
    const duration = Math.round((Date.now() - dayjs(date).valueOf()) / 1000);

    if (medianLastMepasData <= 750) {
      const mepasRsam = Math.round(highMepasRsam);

      if (
        (highMepasRsam > 2500 && duration > 10) ||
        (highMepasRsam <= 2500 && duration > 25)
      ) {
        sendingMessageInProgress = true;
        try {
          await eventsDb.update((events) => {
            events.unshift({
              date,
              median: highMepasRsam,
              ratio,
            });
          });
          await sendEvent(ratio, duration, time, mepasRsam);
          if (!imageIsSent) {
            await sendPlot(date);
            await sendCctv();
          }
        } catch (error) {
          console.error(error);
        }
      }

      sendingMessageInProgress = false;
      imageIsSent = false;
      eventInProgress = false;
      date = "";
      highMepasRsam = 0;
      highMelabRsam = 0;
    } else {
      if (duration > 35 && !imageIsSent) {
        imageIsSent = true;
        try {
          await sendPlot(date);
          await sendCctv();
        } catch (error) {
          imageIsSent = false;
        }
      }
    }
  } else {
    if (medianLastMepasData > 1000) {
      eventInProgress = true;
      highMepasRsam = medianLastMepasData;
      highMelabRsam = medianLastMelabData;
      date = mepasJSON[mepasJSON.length - 1][0];
    }
  }
};
