import dayjs from "dayjs";
import { eventsDb, incrementDb } from "../db";
import { findMedian } from "../utils";
import { sendCctv } from "./sendCctv";
import { sendEvent } from "./sendEvent";
import { sendPlot } from "./sendPlot";
import { logger } from "../logger";
import { sendVideoFromGallery } from "./sendVideo";

let sendingMessageInProgress = false;
let imageIsSent = false;
let eventInProgress = false;
let date = "";
let highMepasRsam = 0;
let highMelabRsam = 0;
let ratio = 0;
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
    const time = dayjs(date).format("YYYY-MM-DD HH:mm:ss");
    const duration = Math.round((Date.now() - dayjs(date).valueOf()) / 1000);

    if (highMepasRsam < medianLastMepasData) {
      highMepasRsam = medianLastMepasData;
    }
    if (highMelabRsam < medianLastMelabData) {
      highMelabRsam = medianLastMelabData;
    }

    if (duration <= 30) {
      ratio =
        Math.round((highMepasRsam / highMelabRsam) * Math.pow(10, 2)) /
        Math.pow(10, 2);
    }

    if (medianLastMepasData <= 750) {
      const mepasRsam = Math.round(highMepasRsam);

      if (!imageIsSent) {
        await incrementDb.update((data) => {
          data.i = data.i + 1;
        })
      }
      const id = incrementDb.data.i
      const link = `#${id}\n[Stream Update](https://proxy.cendana15.com/notify/resend-stream?start=${dayjs(date).format("YYYYMMDDHHmmss")}&index=${id})`

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
          await sendEvent(ratio, duration, time, mepasRsam, `#${id}`);
          if (!imageIsSent) {

            await sendPlot(date, `#${id}\n${link}`);
            if (ratio <= 2) {
              await sendCctv(`#${id}`);
            }
          }

          if (ratio <= 2) {
            fetch(`http://192.168.0.47:20004/record_cctvs?start=${dayjs(date).format("YYYYMMDDHHmm")}&event=Gempa`).finally(() => {
              console.log('Generate Videos API Called!');
            })
            await sendVideoFromGallery(date, duration)
          }
        } catch (error) {
          logger.error(error);
        }
      }

      sendingMessageInProgress = false;
      imageIsSent = false;
      eventInProgress = false;
      date = "";
      highMepasRsam = 0;
      highMelabRsam = 0;
      ratio = 0;
    } else {
      if (duration > 35 && !imageIsSent) {
        imageIsSent = true;
        try {
          await incrementDb.update((data) => {
            data.i = data.i + 1;
          })
          const id = incrementDb.data.i
          const link = `#${id}\n[Stream Update](https://proxy.cendana15.com/notify/resend-stream?start=${dayjs(date).format("YYYYMMDDHHmmss")}&index=${id})`

          await sendPlot(date, `#${id}\n${link}`);
          if (ratio <= 2) {
            await sendCctv(`#${id}`);
          }
        } catch (error) {
          imageIsSent = false;
        }
      }
    }
  } else {
    if (medianLastMepasData > 3000) {
      eventInProgress = true;
      highMepasRsam = medianLastMepasData;
      highMelabRsam = medianLastMelabData;
      date = mepasJSON[mepasJSON.length - 1][0];
    }
  }
};
