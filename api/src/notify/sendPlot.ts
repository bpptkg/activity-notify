import FormData from "form-data";
import { plotStream } from "./plotStream";
import axios from "axios";
import { logger } from "../logger";
import dayjs from "dayjs";

export const sendPlot = async (date: string, id: string) => {
  const form = new FormData();
  form.append("chat_id", "-1002026839953");
  form.append("parse_mode", "Markdown");
  form.append("caption", `${id}\nGenerated at ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`);

  try {
    await plotStream(date, form);
    const { data } = await axios.post(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendPhoto`,
      form
    );
    logger.info("sent plot to telegram: ", data);
  } catch (error) {
    logger.info("faild to send photo plot to telegram: ", error);
  }
};
