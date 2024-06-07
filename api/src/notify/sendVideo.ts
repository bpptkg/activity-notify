
import ffmpeg from 'fluent-ffmpeg'
import { incrementDb, videoDb } from '../db';
import { createReadStream } from 'fs';
import FormData from 'form-data';
import axios from 'axios';

const getPath = (date: string) => `/tmp/${date.replaceAll(':', '_').replaceAll(' ', '-')}.mp4`

export const sendVideoStream = async (date: string) => {
    if (videoDb.data[date] === 'finish') {
        const id = incrementDb.data.i
        const form = new FormData();
        form.append("chat_id", "-1002026839953");
        form.append("caption", `#${id}`);
        form.append('video', createReadStream(getPath(date)));

        const data = await axios.post(
            `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendVideo`,
            form,
            {
                headers: form.getHeaders(),
            }
        );
    }
}

export const sendVideo = async (date: string) => {
    const path = `/tmp/${date.replaceAll(':', '_').replaceAll(' ', '-')}.mp4`

    const ffmpegCommand = ffmpeg('rtsp://root:pass@192.168.62.154:554/axis-media/media.amp')
        .inputOptions(['-rtsp_transport', 'tcp'])
        .outputOptions(['-c:v', 'libx264'])
        .output(getPath(date));

    ffmpegCommand
        .on('start', (cmdline) => {
            console.log('Started FFmpeg with command:', cmdline);
        })
        .on('progress', (progress) => {
            console.log(`Processing: ${progress.percent}% done`);
        })
        .on('end', async () => {
            console.log('FFmpeg process finished');
            await sendVideoStream(date)
        })
        .on('error', async (err, stdout, stderr) => {
            console.error('Error occurred:', err.message);
            console.error('FFmpeg stdout:', stdout);
            console.error('FFmpeg stderr:', stderr);
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
