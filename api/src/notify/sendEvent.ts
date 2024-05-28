import FormData from "form-data";
import axios from "axios";

export const sendEvent = async (
  event: { date: string, ratio: number },
  duration: number,
  time: string,
  rsam: number
) => {
  const form = new FormData();
  const caption = `Terjadi gempa:\nWaktu: ${time} WIB\nRSAM: ${rsam}\nDurasi: ${duration} detik\nRatio: ${event?.ratio}`;
  form.append("chat_id", "-1002026839953");
  form.append("caption", caption);
  form.append("parse_mode", "Markdown");

  try {
      const { data } = await axios.post(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
        form
      );
      console.log("sent notification to telegram: ", data);
  } catch (error) {
    console.log("faild to send photo notification to telegram: ", error);
  }
};
