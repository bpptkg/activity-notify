import { readdir, unlink } from "fs/promises";
import { logger } from "./logger";
import path from "path";
import { isFileOlderThanSeconds } from "./utils";
import { globalDb } from "./db";

export const deleteOldVideos = async () => {
    const dirPath = `${process.cwd()}/data/videos`;

    setInterval(async () => {
        if (globalDb.data.isProcessingVideo) {
            return
        }

        try {
            const files = await readdir(dirPath);

            await Promise.all(files.map(async (file) => {
                const filePath = path.join(dirPath, file);
                if (isFileOlderThanSeconds(filePath, 3600 * 24)) {
                    // logger.info(`Deleting file: ${filePath}`);
                    try {
                        await unlink(filePath);
                    } catch (error) {
                        logger.error(`Error deleting file: ${filePath}: ${error}`);
                    }
                }
            }))
        } catch (error) {
            return logger.error("Unable to delete old videos: " + error);
        }
    }, 1000 * 10)
}