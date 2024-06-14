
import ffmpeg from 'fluent-ffmpeg'
import { incrementDb, videoDb } from '../db';
import { createReadStream } from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import { logger } from '../logger';
import dayjs from 'dayjs';
import { readdir, unlink } from 'fs/promises';
import { isValidVideo } from '../utils';

const getPath = (date: string) => `/app/data/videos/${date.replaceAll(':', '_').replaceAll(' ', '-')}.mp4`

export const sendVideoStream = async (date: string) => {
    if (videoDb.data[date] === 'finish') {
        const id = incrementDb.data.i
        const form = new FormData();
        form.append("chat_id", "-1002026839953");
        form.append("caption", `#${id}`);
        form.append('video', createReadStream(getPath(date)));

        try {
            const { data } = await axios.post(
                `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendVideo`,
                form,
                {
                    headers: form.getHeaders(),
                }
            );

            logger.info(data);
        } catch (error) {
            logger.error(error)
        }

    }
}

export const sendVideoToTelegram = async () => {
        const id = incrementDb.data.i
        const form = new FormData();
        form.append("chat_id", "-1002211468994");
        form.append("caption", `#${id}`);
        form.append('video', createReadStream('/tmp/tmp.mp4'));

        try {
            const { data } = await axios.post(
                `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendVideo`,
                form,
                {
                    headers: form.getHeaders(),
                }
            );

            logger.info(data);
        } catch (error:any) {
            logger.error(error.response ? error.response.data : error)
        }
}

export const sendVideoFromGallery = async (date: string, duration: number) => {
    const path = `/app/data/videos`
    const output = `/tmp/tmp.mp4`

    try {
        await unlink(output)
    } catch (error) {
        // 
    }

    try {
        setTimeout(async () => {
            const videos = (await readdir(path))

            const validVideos = [];
            for (const file of videos) {
                const isValid = await isValidVideo(file);
                if (isValid) {
                    validVideos.push(file);
                } else {
                    console.log(`Invalid or broken video file skipped: ${file}`);
                }
            }

            if (validVideos.length === 0) {
                console.log('No valid files to merge.');
                return;
            }
    
            const ffmpegCommand = ffmpeg();
            validVideos.forEach(file => {
                ffmpegCommand.input(file);
            });
    
            ffmpegCommand
            .on('error', (err) => {
              console.log('Error concatenating videos: ' + err.message);
            })
            .on('end', () => {
              console.log('Files have been merged successfully');
              sendVideoToTelegram()
            })
            .mergeToFile(output, '/tmp');
        }, 10000);
    } catch (error) {
        logger.error(error)
    }
}

export const sendVideo = async (date: string, duration: number) => {
    logger.info(`Send video called on: ${date}`)

    const ffmpegCommand = ffmpeg('rtsp://root:pass@192.168.62.154:554/axis-media/media.amp')
        .inputOptions(['-rtsp_transport', 'tcp'])
        .outputOptions(['-c:v', 'copy'])
        .output(getPath(date));

    ffmpegCommand
        .on('start', (cmdline) => {
            logger.info(`Started FFmpeg with command: ${cmdline}`);
        })
        .on('progress', (progress) => {
            logger.info(`Processing: ${progress.percent}% done`);
        })
        .on('end', async () => {
            logger.info('FFmpeg process finished');
            await sendVideoStream(date)
        })
        .on('error', async (err, stdout, stderr) => {
            logger.error('Error occurred:');
            logger.error(err.message);
            logger.error('FFmpeg stdout:');
            logger.error(stdout);
            logger.error('FFmpeg stderr:');
            logger.error(stderr);
            await sendVideoStream(date)
        })
        .run();

    const int = setInterval(async () => {
        if (!videoDb.data[date] || videoDb.data[date] === 'drop' || videoDb.data[date] === 'finish') {
            ffmpegCommand.kill('SIGINT');
            clearInterval(int)
        }
    }, 1000)
};
