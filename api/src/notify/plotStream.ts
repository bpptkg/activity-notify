import FormData from "form-data";
import { exec } from "child_process";
import { promisify } from "util";
import { createReadStream } from "fs";
import path from "path";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc'
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
    console.log(`Output: ${stdout}`);
    if (stderr) {
      console.error(`Error output: ${stderr}`);
    } else {
        console.log('APPEND');
        
      form.append("photo", createReadStream(`/tmp/${now}.png`));
    }
  } catch (error) {
    console.error("Error plot stream: ", error);
  }
};
