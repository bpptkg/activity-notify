import { Hono } from "hono";
import { Readable } from "stream";
import { createReadStream } from "fs";
import path from "path";

export const eventController = new Hono();

eventController.get("/", async (c) => {
  const stream = Readable.toWeb(
    createReadStream(path.resolve(process.cwd(), "./data/events.json"))
  ) as ReadableStream;

  return c.body(stream);
});
