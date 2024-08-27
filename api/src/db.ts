import { Memory, Low } from "lowdb";
import { JSONFilePreset } from "lowdb/node";
import path from "path";

type Data = { mepas: number; melab: number; meimo: number; date: string; alertType: number };
export const memoryDb = new Low<Data>(new Memory(), {
  mepas: 0,
  melab: 0,
  meimo: 0,
  date: "",
  alertType: 0,
});

export type ThermalData = {
  'krasak': [string, number];
  'bebeng': [string, number];
  'boyong': [string, number];
  'kubahBd': [string, number];
  'krasakAvg': [string, number];
  'bebengAvg': [string, number];
  'boyongAvg': [string, number];
  'kubahBdAvg': [string, number];
};
export const thermalDb = new Low<ThermalData>(new Memory(), {
  krasak: ['', 0],
  bebeng: ['', 0],
  boyong: ['', 0],
  kubahBd: ['', 0],
  krasakAvg: ['', 0],
  bebengAvg: ['', 0],
  boyongAvg: ['', 0],
  kubahBdAvg: ['', 0],
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

export const stateDb = new Low<{calculateApgInProgress: boolean}>(new Memory(), {
  calculateApgInProgress: false,
});