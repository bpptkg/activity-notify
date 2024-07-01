import axios from "axios";
import { ThermalData } from "../db";
import { logger } from "../logger";

const eventInProgres = {
  krasak: false,
  bebeng: false,
  boyong: false,
  kubahBd: false
}

let avgTrigger = false
let maxTrigger = false

const ucFirst = (str: string) => {
  if (!str) return str;
  return str[0].toUpperCase() + str.slice(1);
}

export const notifyThermalData = async (data: ThermalData) => {
  const rivers: ('krasak' | 'bebeng' | 'boyong' | 'kubahBd')[] = ['krasak', 'bebeng', 'boyong', 'kubahBd']

  await Promise.all(rivers.map(async (river): Promise<void> => {
    if (river === 'kubahBd') {

      if (!avgTrigger && !maxTrigger && (data.kubahBdAvg[1] > 20 || data.kubahBd[1] > 100)) {
        avgTrigger = data.kubahBdAvg[1] > 20
        maxTrigger = data.kubahBd[1] > 100

        const form = new FormData();
        const text = `Peringatan!\nTerjadi peningkatan suhu di Kubah BD. Suhu di kubah BD AVG: ${data.kubahBdAvg[1]} derajat MAX: ${data.kubahBd[1]} derajat.\n${data.kubahBd[0]}`;
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
          logger.info("failed to send river event to telegram: ", error?.toString());
        }
      } else if (avgTrigger && data.kubahBdAvg[1] < 15) {
        avgTrigger = false
      } else if (maxTrigger && data.kubahBd[1] < 50) {
        avgTrigger = false
      }
    } else {
      if (data[river][1] > 20 && !eventInProgres[river]) {
        eventInProgres[river] = true
        const form = new FormData();
        const text = `Peringatan! Terjadi RF/AP di sungai ${ucFirst(river)}. Suhu di sungai ${ucFirst(river)} ${data[river][1]} derajat.\n${data[river][0]}`;
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
          logger.info("failed to send river event to telegram: ", error?.toString());
        }
      } else if (eventInProgres[river] && data[river][1] < 15) {
        eventInProgres[river] = false
      }
    }
  }))
}