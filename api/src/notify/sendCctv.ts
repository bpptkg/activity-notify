import axios from "axios";
import { logger } from "../logger";
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import FromData from 'form-data'

export const sendCctv = async (id: string) => {
  const formPhoto = new FromData();
  formPhoto.append("chat_id", "-1002026839953");
  formPhoto.append("caption", id);

  const output = `/tmp/${Date.now()}.jpg`
  const streamUrl = 'http://root:pass@192.168.62.154/mjpg/video.mjpg?fps=1&overlays=all&videocodec=jpeg';

  ffmpeg(streamUrl)
    .frames(1)
    .on('end', async () => {
      console.log('CCTV taken successfully');
      try {
        const photo = fs.createReadStream(output);
        formPhoto.append('photo', photo);
        const { data } = await axios.post(
          `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendPhoto`,
          formPhoto,
          {
            headers: {
              ...formPhoto.getHeaders(), 
            }
          }
        );
        logger.info("sent cctv to telegram: ", data.code);
      } catch (error: any) {
        logger.error('failed send cctv to telegram: ', error?.response?.data);
      }
    })
    .on('error', (err: any) => {
      console.error('Error capturing CCTV:', err);
    })
    .save(output);
};