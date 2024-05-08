import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { memoryDb } from "../db";

export const notifyController = new Hono();

notifyController.get("/", async (c) => {
  let sendStream = true;
  let prevAlertType = 0;
  let i = 0;

  return streamSSE(
    c,
    async (stream) => {
      await stream.writeSSE({
        data: JSON.stringify(memoryDb.data),
      });

      while (sendStream) {
        if (
          memoryDb.data.alertType ||
          (prevAlertType && !memoryDb.data.alertType) ||
          i > 30
        ) {
          i = 0;
          await stream.writeSSE({
            data: JSON.stringify(memoryDb.data),
          });
        }
        prevAlertType = memoryDb.data.alertType;

        stream.onAbort(() => {
          sendStream = false;
          stream.close();
        });

        await stream.sleep(1000);
      }
    },
    async (err, stream) => {
      stream.writeln("An notify stream error occurred!");
      console.error(err);
    }
  );
});
