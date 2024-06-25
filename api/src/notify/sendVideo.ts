
import ffmpeg from 'fluent-ffmpeg'
import { globalDb, incrementDb } from '../db';
import { createReadStream } from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import { logger } from '../logger';
import { readdir, unlink } from 'fs/promises';
import { isValidVideo } from '../utils';

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
    } catch (error: any) {
        logger.error(error.response ? error.response.data : error)
    }
}

export const sendVideoFromGallery = async (date: string, duration: number) => {
    logger.info('SENDING VIDEO FERROM GALLERY: ', date)
    const path = `/app/data/videos`
    const output = `/tmp/tmp.mp4`

    try {
        await unlink(output)
    } catch (error) {
        // 
    }

    setTimeout(async () => {
        try {
            await globalDb.update((data) => {
                data.isProcessingVideo = true
            })

            const videos = (await readdir(path))
            videos.pop()
            const last5Videos = videos.slice(-2) 

            const validVideos = [];
            for (const file of last5Videos) {
                const isValid = await isValidVideo(`${path}/${file}`);
                if (isValid) {
                    validVideos.push(`${path}/${file}`);
                } else {
                    logger.info(`Invalid or broken video file skipped: ${file}`);
                }
            }

            if (validVideos.length === 0) {
                logger.info('No valid files to merge.');
                return;
            }

            const ffmpegCommand = ffmpeg();
            validVideos.forEach(file => {
                ffmpegCommand.input(file);
            });

            logger.info('valid videos: ' + validVideos)

            ffmpegCommand
                // .on('start', commandLine => {
                //     logger.info('FFmpeg command: '+ commandLine);
                // })
                // .on('progress', progress => {
                //     logger.info('Processing: ' + progress.percent + '% done');
                // })
                // .on('stderr', stderrLine => {
                //     logger.info('Stderr output: '+ stderrLine);
                // })
                .on('error', async (err) => {
                    logger.info('Error concatenating videos: ' + err.message);
                    await globalDb.update((data) => {
                        data.isProcessingVideo = false
                    })
                })
                .on('end', async () => {
                    logger.info('Files have been merged successfully');
                    await globalDb.update((data) => {
                        data.isProcessingVideo = false
                    })
                    sendVideoToTelegram()
                })
                .mergeToFile(output, '/tmp')
        } catch (error) {
            logger.error("ERROR SENDING VIDEO FERROM GALLERY: " + error)
        }
    }, 12000);
}

