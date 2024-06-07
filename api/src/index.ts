import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { notifyController } from "./controllers/notifyController";
import { getRsamData } from "./getRsamData";
import { eventController } from "./controllers/eventController";
import { cors } from "hono/cors";
import { deleteOldFiles } from "./utils";
import path from "path";
import { logger } from "./logger";
import { CronJob } from 'cron';
import { incrementDb, videoDb } from "./db";
import { sendVideo } from "./notify/sendVideo";

const app = new Hono();
app.use("*", cors());
app.route("notify", notifyController);
app.route("events", eventController);


await videoDb.update((x) => {
  x['2022-11-01'] = 'pending'
})
sendVideo('2022-11-01');

setTimeout(async () => {
  await videoDb.update((x) => {
    x['2022-11-01'] = 'finish'
  })
}, 30000);


setInterval(() => {
  getRsamData();
}, 1000);

setInterval(() => {
  deleteOldFiles(path.resolve(process.cwd(), `./data`));
}, 1000 * 60 * 60);

const job = new CronJob(
	'0 0 * * *',
	async () =>{
    await incrementDb.update((data) => {
      data.i = 0;
    })
  },
	null,
	true,
	'Asia/Jakarta'
);

const port = 18000;
serve({
  fetch: app.fetch,
  port,
});
logger.info(`Server is running on port ${port}`);
