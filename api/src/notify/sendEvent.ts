import FormData from "form-data";
import axios from "axios";
import { logger } from "../logger";

export const sendEvent = async (
  ratio: number,
  duration: number,
  time: string,
  mepasRsam: number,
  id: string
) => {
  const form = new FormData();
  const text = `Terjadi gempa:\nWaktu: ${time} WIB\nRSAM: ${mepasRsam}\nDurasi: ${duration} detik\nRatio Max t <= 30: ${ratio}\n\n${id}`;
  form.append("chat_id", "-1002026839953");
  form.append("text", text);
  form.append("parse_mode", "Markdown");

  try {
      const { data } = await axios.post(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
        form
      );
      logger.info("sent event to telegram: ", data);
  } catch (error) {
    logger.info("failed to send event to telegram: ", error);
  }
};
