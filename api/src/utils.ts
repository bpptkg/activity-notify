import fs from "fs";
import { stat } from "fs/promises";
import path from "path";
import { logger } from "./logger";
import ffmpeg from 'fluent-ffmpeg'

export const findMedian = (numbers: number[]) => {
  if (numbers.length === 0) throw new Error("No numbers provided");
  const sortedNumbers = JSON.parse(JSON.stringify(numbers)).sort(
    (a: number, b: number) => a - b
  );
  const midIndex = Math.floor(sortedNumbers.length / 2);

  if (sortedNumbers.length % 2 === 0) {
    return (sortedNumbers[midIndex - 1] + sortedNumbers[midIndex]) / 2;
  } else {
    return sortedNumbers[midIndex];
  }
};

export const isFileOlderThanSeconds = (filePath: string, seconds: number) => {
  try {
    const stats = fs.statSync(filePath);
    const currentTime = Date.now();
    const fileModifiedTime = new Date(stats.mtime).getTime();
    const differenceInSeconds = (currentTime - fileModifiedTime) / 1000;

    return differenceInSeconds > seconds;
  } catch (error) {
    throw error;
  }
};

// Helper function to check if the file is older than 24 hours
const isOlderDays = (filePath: string, days = 1) => isFileOlderThanSeconds(filePath, days * 24 * 60 * 60);

// Function to delete files older than 24 hours
export const deleteOldFiles = (dirPath: string) => {
  // logger.info(`Deleting files in ${dirPath} older than 24 hours...`);

  fs.readdir(dirPath, (err, files) => {
    if (err) {
      return logger.info("Unable to scan directory: " + err);
    }

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);

      if (file.startsWith("logs") && isOlderDays(filePath)) {
        // logger.info(`Deleting ${file}...`);
        fs.unlink(filePath, (err) => {
          if (err) {
            logger.error(`Error deleting file: ${filePath}`, err);
          } else {
            // logger.info(`Deleted file: ${filePath}`);
          }
        });
      } else if (file.endsWith("mseed") && isOlderDays(filePath, 7)) {
        // logger.info(`Deleting ${file}...`);
        fs.unlink(filePath, (err) => {
          if (err) {
            logger.error(`Error deleting file: ${filePath}`, err);
          } else {
            logger.info(`Deleted file: ${filePath}`);
          }
        });
      }
    });
  });
};


export const isValidVideo = async (filePath: string) => {
  try {
    const stats = await stat(filePath);
    return stats.size > 10240;
  } catch (error) {
    console.error(`Error checking file size: ${error}`);
    return false;
  }
}