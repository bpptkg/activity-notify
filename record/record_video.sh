#!/bin/bash

# Start the file management script in the background
# ./manage_files.sh &

# Record video from the webcam for the specified duration
ffmpeg -i "rtsp://root:pass@192.168.62.154:554/axis-media/media.amp" -c:v copy -f segment -segment_time 15 -reset_timestamps 1 -strftime 1 "/data/%Y%m%d%H%M%S.mp4"
