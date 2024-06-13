import { readdir, unlink } from "fs/promises";
import { logger } from "./logger";
import ffmpeg from 'fluent-ffmpeg';
import path from "path";
import { isFileOlderThanSeconds } from "./utils";

const inputStream = 'rtsp://root:pass@192.168.62.154:554/axis-media/media.amp';

const outputPattern = `${process.cwd()}/data/videos/%Y%m%d%H%M%S.mp4`;
const segmentTime = '15';

export const recordVideo = async () => {
    logger.info('Recording video...');
    const command = ffmpeg(inputStream)
        .output(outputPattern)
        .format('segment')
        .addOption('-c', 'copy')
        .addOption('-segment_time', segmentTime)
        .addOption('-reset_timestamps', '1')
        .addOption('-strftime', '1')
        .on('end', () => {
            logger.info('Segmented recording finished.');
        })
        .on('error', (err: any) => {
            logger.error('An error occurred: ' + err.message);
            logger.info('Restarting FFmpeg...');
            setTimeout(recordVideo, 5000);
        })
        .on('stdout', e => logger.info(e.toString()));

    command.run();
}

export const deleteOldVideos = async () => {
    const dirPath = `${process.cwd()}/data/videos`;

    setInterval(async () => {
        try {
            const files = await readdir(dirPath);

            await Promise.all(files.map(async (file) => {
                const filePath = path.join(dirPath, file);
                if (isFileOlderThanSeconds(filePath, 120)) {
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