import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { notifyController } from "./controllers/notifyController";
import { getRsamData } from "./getRsamData";
import { eventController } from "./controllers/eventController";
import { cors } from 'hono/cors'
// import { getRsamDataAlt } from "./getRsamDataAlt";

const app = new Hono();
app.use("*", cors());
app.route("notify", notifyController);
app.route("events", eventController);

setInterval(() => {
  getRsamData();
  // getRsamDataAlt();
}, 1000);

const port = 18000;
serve({
  fetch: app.fetch,
  port,
});
console.log(`Server is running on port ${port}`);
