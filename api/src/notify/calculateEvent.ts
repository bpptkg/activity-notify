import dayjs from "dayjs";
import { eventsDb, incrementDb, videoDb } from "../db";
import { findMedian } from "../utils";
import { sendCctv } from "./sendCctv";
import { sendEvent } from "./sendEvent";
import { sendPlot } from "./sendPlot";
import { logger } from "../logger";
import { sendVideo, sendVideoFromGallery } from "./sendVideo";

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
            await sendPlot(date, `#${id}`);
            if (ratio <= 2) {
              await sendCctv(`#${id}`);
              await videoDb.update((data) => {
                data[date] = 'finish';
              })
            } else {
              await videoDb.update((data) => {
                data[date] = 'drop';
              })
            }
          }

          if (ratio <= 2) {
            await sendVideoFromGallery(date, duration)
          }
        } catch (error) {
          logger.error(error);
        }
      } else {
        await videoDb.update((data) => {
          data[date] = 'drop';
        })
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

          await sendPlot(date, `#${id}`);
          if (ratio <= 2) {
            await sendCctv(`#${id}`);
          }
          await videoDb.update((data) => {
            data[date] = 'finish';
          })
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

      await videoDb.update((data) => {
        data[date] = 'pending';
      })

      // sendVideo(date).catch((error) => {
      //   logger.error(error);
      // })
    }
  }
};
