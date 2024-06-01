import fs from "fs";
import path from "path";
import { logger } from "./logger";

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

// Helper function to check if the file is older than 24 hours
const isOlderThan24Hours = (filePath: string) => {
  const stats = fs.statSync(filePath);
  const now = Date.now();
  const modificationTime = new Date(stats.mtime).getTime();
  const hours24 = 24 * 60 * 60 * 1000;
  return now - modificationTime > hours24;
};

// Function to delete files older than 24 hours
export const deleteOldFiles = (dirPath: string) => {
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      return logger.info("Unable to scan directory: " + err);
    }

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);

      if (file.startsWith("log-") && isOlderThan24Hours(filePath)) {
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
