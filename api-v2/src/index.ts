import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { notifyController } from "./controllers/notifyController";
import { getRsamData } from "./getRsamData";

const app = new Hono();
app.route("notify", notifyController);

setInterval(() => {
  getRsamData();
}, 1000);

const port = 3000;
serve({
  fetch: app.fetch,
  port,
});
console.log(`Server is running on port ${port}`);
