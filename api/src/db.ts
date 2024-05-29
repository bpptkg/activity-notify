import { Memory, Low } from "lowdb";
import { JSONFilePreset } from "lowdb/node";
import path from "path";

type Data = { mepas: number; melab: number; date: string; alertType: number };
export const memoryDb = new Low<Data>(new Memory(), {
  mepas: 0,
  melab: 0,
  date: "",
  alertType: 0,
});

export const eventsDb = await JSONFilePreset<any[]>(
  path.resolve(process.cwd(), "./data/events.json"),
  []
);
export const incrementDb = await JSONFilePreset<{i: number}>(
  path.resolve(process.cwd(), "./data/increment.json"),
  { i: 1 }
);
