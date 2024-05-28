import FormData from "form-data";
import { plotStream } from "./plotStream";
import axios from "axios";
import { sendCctv } from "./sendCctv";

export const sendPlot = async (date: string) => {
  const form = new FormData();
  form.append("chat_id", "-1002026839953");
  form.append("parse_mode", "Markdown");

  try {
    await plotStream(date, form);
    const { data } = await axios.post(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendPhoto`,
      form
    );
    console.log("sent notification to telegram: ", data);

    setTimeout(() => {
      sendCctv();
    }, 2000);
  } catch (error) {
    console.log("faild to send photo notification to telegram: ", error);
  }
};
