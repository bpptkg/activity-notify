import os
import sys
from datetime import datetime
from moviepy.editor import VideoFileClip, concatenate_videoclips

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

def generateVideo(base_path, target_time, name, key, output_file):
    target_file, next_file = find_video_files(base_path, target_time, name)
    
    if not target_file:
        print(f"No video file found for {target_time} with key {key}")
        return
    
    clip = VideoFileClip(target_file)
    video_start_time = datetime.strptime(os.path.basename(target_file)[:14], "%Y%m%d%H%M%S")
    target_seconds = (target_time - video_start_time).total_seconds()
    
    available_after = clip.duration - target_seconds
    print(available_after)
    
    if available_after >= 45:
        start_time = max(0, target_seconds - 15)
        end_time = target_seconds + 45
        extracted_clip = clip.subclip(start_time, end_time)
    else:
        start_time = max(0, target_seconds - (60 - available_after))
        extracted_clip = clip.subclip(start_time)
        
        if next_file and extracted_clip.duration < 60:
            next_clip = VideoFileClip(next_file)
            remaining_duration = 60 - extracted_clip.duration
            extracted_clip = concatenate_videoclips([extracted_clip, next_clip.subclip(0, remaining_duration)])
            next_clip.close()
    
    extracted_clip = extracted_clip.subclip(0, 60)
    fast_clip = extracted_clip.speedx(5)
    
    fast_clip.write_videofile(output_file)
    
    clip.close()
    extracted_clip.close()
    fast_clip.close()

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python script.py <base_path> <target_time> <key>")
        sys.exit(1)
    
    base_path = sys.argv[1]
    target_time = datetime.strptime(sys.argv[2], "%Y-%m-%d %H:%M:%S")
    key = sys.argv[3]
    
    output_file = f"output_{target_time.strftime('%Y%m%d%H%M%S')}_{key}.mp4"
    
    generateVideo(base_path, target_time, key, output_file)
    print(f"Video saved as {output_file}")