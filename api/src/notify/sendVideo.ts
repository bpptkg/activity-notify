
import ffmpeg from 'fluent-ffmpeg'
import { videoDb } from '../db';
import { createReadStream } from 'fs';
import FormData from 'form-data';
import axios from 'axios';

export const sendVideo = async (date: string) => {
    const ffmpegCommand = ffmpeg('rtsp://root:pass@192.168.62.154:554/axis-media/media.amp')
        .inputOptions(['-rtsp_transport', 'tcp', '-loglevel', 'error'])
        .outputOptions(['-c:v', 'libx264'])
        .output(`/tmp/${date}.mp4`);

    ffmpegCommand
        .on('start', (cmdline) => {
            console.log('Started FFmpeg with command:', cmdline);
        })
        .on('progress', (progress) => {
            console.log(`Processing: ${progress.percent}% done`);
        })
        .on('end', async () => {
            console.log('FFmpeg process finished');
            if (videoDb.data[date] === 'finish') {
                const form = new FormData();
                form.append("chat_id", "-1002026839953");
                // form.append("caption", date);
                form.append('video', createReadStream(`/tmp/${date}.mp4`));

                const data = await axios.post(
                    `https://api.telegram.org/bot7407670437:AAFsJCEv1K4lIifPL0Ou7ALCi3PeH6GvPFU/sendVideo`,
                    form,
                    {
                        headers: form.getHeaders(),
                    }
                );
            }
        })
        .on('error', (err, stdout, stderr) => {
            console.error('Error occurred:', err.message);
            console.error('FFmpeg stdout:', stdout);
            console.error('FFmpeg stderr:', stderr);
        })
        .run();

    const int = setInterval(async () => {
        if (!videoDb.data[date] || videoDb.data[date] === 'drop' || videoDb.data[date] === 'finish') {
            ffmpegCommand.kill('SIGINT');
            clearInterval(int)
        }
    }, 1000)
};