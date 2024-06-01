import FormData from "form-data";
import { exec } from "child_process";
import { promisify } from "util";
import { createReadStream } from "fs";
import path from "path";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc'
import { logger } from "../logger";
const execPromise = promisify(exec);
dayjs.extend(utc)

export const plotStream = async (date: string, form: FormData) => {
  try {
    const now = dayjs(date).subtract(7, 'h').format('YYYYMMDDHHmmss');
    const { stdout, stderr } = await execPromise(
      `${path.resolve(process.cwd(), ".venv/bin/python3")} ${path.resolve(
        process.cwd(),
        "src-py/plot.py"
      )} ${now} /tmp/${now}.png`
    );
    logger.info(`Output: ${stdout}`);
    if (stderr) {
      logger.error(`Error output: ${stderr}`);
    } else {
      logger.info('APPEND');
        
      form.append("photo", createReadStream(`/tmp/${now}.png`));
    }
  } catch (error) {
    logger.error("Error plot stream: ", error);
  }
};
