
import ffmpeg from 'fluent-ffmpeg'
import { incrementDb, videoDb } from '../db';
import { createReadStream } from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import { logger } from '../logger';
import dayjs from 'dayjs';
import { readdir, unlink } from 'fs/promises';

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
        form.append("chat_id", "-1002026839953");
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
    const path = `${process.cwd()}/videos/${dayjs(date).format('YYYY/MM/DD')}/Jurangjero`
    const output = `/tmp/tmp.mp4`

    try {
        await unlink(output)
    } catch (error) {
        // 
    }

    try {
        const data = (await readdir(path)).reverse()
        const video = data.find((x) => x < dayjs(date).format('YYYYMMDDHHmmss'))

        if (!video) {
            logger.info('No video found')
            return
        }
        const diff = dayjs(date).diff(dayjs(video.substring(0, 14)), 's')

        ffmpeg(`${path}/${video}`)
            .setStartTime(diff < 5 ? 0 : diff - 5)
            .setDuration(duration)
            .output(output)
            .on('end', () => {
                console.log('Video has been converted successfully.');
                sendVideoToTelegram()
            })
            .on('error', (err) => {
                console.error('An error occurred: ' + err.message);
            })
            .run();
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
