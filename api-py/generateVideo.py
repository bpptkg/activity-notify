import os
import sys
import subprocess
from datetime import datetime, timedelta

def find_video_files(base_path, target_time, name):
    year = target_time.strftime("%Y")
    month = target_time.strftime("%m")
    day = target_time.strftime("%d")
    path = os.path.join(base_path, year, month, day, name)
    files = sorted([f for f in os.listdir(path) if f.endswith(".mp4")])
    target_file = None
    next_file = None
    for i, file in enumerate(files):
        if file.startswith(target_time.strftime("%Y%m%d")) and (target_file is None or file > target_file):
            target_file = os.path.join(path, file)
            if i + 1 < len(files):
                next_file = os.path.join(path, files[i+1])
            break
    return target_file, next_file

def get_video_duration(file_path):
    cmd = ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file_path]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)
    return float(result.stdout)

def generateVideo(base_path, target_time, name, key, output_file):
    target_file, next_file = find_video_files(base_path, target_time, name)
    if not target_file:
        print(f"No video file found for {target_time} with key {key}")
        return

    video_start_time = datetime.strptime(os.path.basename(target_file)[:14], "%Y%m%d%H%M%S")
    target_seconds = (target_time - video_start_time).total_seconds()
    
    clip_duration = get_video_duration(target_file)
    available_after = clip_duration - target_seconds
    print(f"Available after: {available_after}")

    if available_after >= 45:
        start_time = max(0, target_seconds - 15)
        duration = 60
    else:
        start_time = max(0, target_seconds - (60 - available_after))
        duration = clip_duration - start_time

    if next_file and duration < 60:
        # Prepare a concat file for FFmpeg
        with open('concat.txt', 'w') as f:
            f.write(f"file '{target_file}'\n")
            f.write(f"file '{next_file}'\n")
        
        # Use FFmpeg to concatenate the videos and extract the required portion
        cmd = [
            'ffmpeg',
            '-f', 'concat',
            '-safe', '0',
            '-i', 'concat.txt',
            '-ss', str(start_time),
            '-t', '60',
            '-filter:v', 'setpts=0.2*PTS',
            '-an',
            output_file
        ]
    else:
        # Use FFmpeg to extract and speed up the video
        cmd = [
            'ffmpeg',
            '-ss', str(start_time),
            '-i', target_file,
            '-t', str(min(duration, 60)),
            '-filter:v', 'setpts=0.1*PTS',
            '-an',
            output_file
        ]

    subprocess.run(cmd, check=True)
    
    if os.path.exists('concat.txt'):
        os.remove('concat.txt')

    print(f"Video saved as {output_file}")

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python script.py <base_path> <target_time> <name> <key>")
        sys.exit(1)

    base_path = sys.argv[1]
    target_time = datetime.strptime(sys.argv[2], "%Y-%m-%d %H:%M:%S")
    name = sys.argv[3]
    key = sys.argv[4]
    output_file = f"output_{target_time.strftime('%Y%m%d%H%M%S')}_{key}.mp4"

    generateVideo(base_path, target_time, name, key, output_file)