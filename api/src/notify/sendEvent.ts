import FormData from "form-data";
import axios from "axios";

export const sendEvent = async (
  ratio: number,
  duration: number,
  time: string,
  mepasRsam: number
) => {
  const form = new FormData();
  const text = `Terjadi gempa:\nWaktu: ${time} WIB\nRSAM: ${mepasRsam}\nDurasi: ${duration} detik\nRatio: ${ratio}`;
  form.append("chat_id", "-1002026839953");
  form.append("text", text);
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
