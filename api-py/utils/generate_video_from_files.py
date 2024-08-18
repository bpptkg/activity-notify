import os
import sys
import subprocess
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

def find_video_files(base_path, target_time, name):
    year = target_time.strftime("%Y")
    month = target_time.strftime("%m")
    day = target_time.strftime("%d")
    path = os.path.join(base_path, year, month, day, name)
    
    if not os.path.exists(path):
        return None, None
    
    files = sorted([f for f in os.listdir(path) if f.endswith(".mp4")])

    target_file_name = target_time.strftime("%Y%m%d%H%M%S")
    target_file = None
    next_file = None
    for i, file in enumerate(files):
        if (target_file is None or file < target_file_name):
            target_file = os.path.join(path, file)
            if i + 1 < len(files):
                next_file = os.path.join(path, files[i+1])
            # break
    return target_file, next_file

def get_video_duration(file_path):
    cmd = ['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file_path]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)
    return float(result.stdout)

def convert_to_1fps(input_file, output_file):
    cmd = [
        'ffmpeg',
        '-loglevel',
        'quiet',
        '-y',
        '-i', input_file,
        '-vf', 'fps=1',
        '-an',
        output_file
    ]
    subprocess.run(cmd, check=True)
    return output_file

def generate_video_from_files(base_path, target_time, name, key, output_file):
    target_file, next_file = find_video_files(base_path, target_time, name)
    if not target_file:
        print(f"No video file found for {target_time} with key {key}")
        return

    # Convert target file to 1fps
    target_file_1fps = convert_to_1fps(target_file, f"temp_target_{key}.mp4")
    
    if next_file:
        # Convert next file to 1fps if it exists
        next_file_1fps = convert_to_1fps(next_file, f"temp_next_{key}.mp4")
    else:
        next_file_1fps = None

    video_start_time = datetime.strptime(os.path.basename(target_file)[:14], "%Y%m%d%H%M%S")
    target_seconds = (target_time - video_start_time).total_seconds()
    clip_duration = get_video_duration(target_file_1fps)
    available_after = clip_duration - target_seconds
    print(f"Available after: {available_after}")
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    if available_after >= 45:
        start_time = max(0, target_seconds - 60)
        duration = 240
    else:
        start_time = max(0, target_seconds - (240 - available_after))
        duration = clip_duration - start_time

    if next_file_1fps and duration < 240:
        # Prepare a concat file for FFmpeg
        with open('concat.txt', 'w') as f:
            f.write(f"file '{target_file_1fps}'\n")
            f.write(f"file '{next_file_1fps}'\n")
        
        # Use FFmpeg to concatenate the videos and extract the required portion
        cmd = [
            'ffmpeg',
            '-loglevel',
            'quiet',
            '-y',  # Overwrite output file if it exists
            '-f', 'concat',
            '-safe', '0',
            '-i', 'concat.txt',
            '-ss', str(start_time),
            '-t', '240',
            '-filter:v', 'setpts=0.1*PTS',
            '-an',
            output_file
        ]
    else:
        # Use FFmpeg to extract and speed up the video
        cmd = [
            'ffmpeg',
            '-loglevel',
            'quiet',
            '-y',  # Overwrite output file if it exists
            '-ss', str(start_time),
            '-i', target_file_1fps,
            '-t', str(min(duration, 240)),
            '-filter:v', 'setpts=0.1*PTS',
            '-an',
            output_file
        ]

    subprocess.run(cmd, check=True)

    # Clean up temporary files
    os.remove(target_file_1fps)
    if next_file_1fps:
        os.remove(next_file_1fps)
    if os.path.exists('concat.txt'):
        os.remove('concat.txt')

    print(f"Video saved as {output_file}")
    return name

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python script.py <base_path> <target_time> <name> <key>")
        sys.exit(1)

    base_path = sys.argv[1]
    target_time = datetime.strptime(sys.argv[2], "%Y-%m-%d %H:%M:%S")
    name = sys.argv[3]
    key = sys.argv[4]
    output_file = f"output_{target_time.strftime('%Y%m%d%H%M%S')}_{key}.mp4"

    generate_video_from_files(base_path, target_time, name, key, output_file)