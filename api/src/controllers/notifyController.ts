import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { memoryDb, thermalDb } from "../db";

export const notifyController = new Hono();

notifyController.get("/", async (c) => {
  let sendStream = true;
  let prevAlertType = 0;
  let i = 0;

  return streamSSE(
    c,
    async (stream) => {
      stream.onAbort(() => {
        sendStream = false;
        stream.close();
      });

      await stream.writeSSE({
        data: JSON.stringify({ ...memoryDb.data, ...thermalDb.data }),
      });

      while (sendStream) {
        i++
        const sendStream = memoryDb.data.alertType || (prevAlertType && !memoryDb.data.alertType) || i > 30 || thermalDb.data.krasak[1] > 20 || thermalDb.data.bebeng[1] > 20 || thermalDb.data.boyong[1] > 20 || thermalDb.data.kubahBd[1] > 20 || thermalDb.data.kubahBdMax[1] > 150
        prevAlertType = memoryDb.data.alertType;

        if (sendStream) {
          i = 0;
          await stream.writeSSE({
            data: JSON.stringify({ ...memoryDb.data, ...thermalDb.data }),
          });
        }

        await stream.sleep(1000);
      }
    },
    async (err, stream) => {
      stream.writeln("An notify stream error occurred!");
      console.error(err);
    }
  );
});
