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

type ThermalData = {
  'krasak': [string, number];
  'bebeng': [string, number];
  'boyong': [string, number];
  'kubahBd': [string, number];
  'kubahBdMax': [string, number];
};
export const thermalDb = new Low<ThermalData>(new Memory(), {
  krasak: ['', 0],
  bebeng: ['', 0],
  boyong: ['', 0],
  kubahBd: ['', 0],
  kubahBdMax: ['', 0],
});

export const videoDb = new Low<{ [key: string]: string }>(new Memory(), {});

export const eventsDb = await JSONFilePreset<any[]>(
  path.resolve(process.cwd(), "./data/events.json"),
  []
);
export const incrementDb = await JSONFilePreset<{ i: number }>(
  path.resolve(process.cwd(), "./data/increment.json"),
  { i: 1 }
);

export const globalDb = new Low<{ isProcessingVideo: boolean }>(new Memory(), {
  isProcessingVideo: false
});