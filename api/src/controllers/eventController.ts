import { Hono } from "hono";
import { Readable } from "stream";
import { createReadStream } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc'

const execPromise = promisify(exec);
dayjs.extend(utc)

export const eventController = new Hono();

eventController.get("/", async (c) => {
  const stream = Readable.toWeb(
    createReadStream(path.resolve(process.cwd(), "./data/events.json"))
  ) as ReadableStream;

  return c.body(stream);
});

eventController.get("/plot/:id", async (c) => {
  const time = dayjs(c.req.param("id")).subtract(7, 'h').format('YYYYMMDDHHmmss');
  const { stderr } = await execPromise(
    `${path.resolve(process.cwd(), ".venv/bin/python3")} ${path.resolve(
      process.cwd(),
      "src-py/plot.py"
    )} ${time} /tmp/${time}.png`
  );

  if (stderr) {
    return c.body(`Failed to plot data: ${stderr}`, 500);
  }

  const stream = Readable.toWeb(
    createReadStream(path.resolve(process.cwd(), `/tmp/${time}.png`))
  ) as ReadableStream;

  return c.body(stream);
});
