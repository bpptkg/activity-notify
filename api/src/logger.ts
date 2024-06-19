import path from "path";
import * as winston from "winston";
import "winston-daily-rotate-file";

const dir = path.resolve(
  process.cwd(),
  `./data`
)

const transport = new winston.transports.DailyRotateFile({
  filename: `${dir}/logger-%DATE%.log`,
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "7d",
});

export const logger = winston.createLogger({
  transports: [transport, new winston.transports.Console()],
});