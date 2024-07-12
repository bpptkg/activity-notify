#!/bin/bash

# Start the file management script in the background
# ./manage_files.sh &

# Record video from the webcam for the specified duration
# ffmpeg -rtsp_transport tcp -i "rtsp://root:pass@192.168.62.154:554/axis-media/media.amp" -c:v copy -f segment -segment_time 15 -r 10 -reset_timestamps 1 -strftime 1 "/data/%Y%m%d%H%M%S.mp4"
#!/bin/bash

# Function to run ffmpeg command
run_ffmpeg() {
    ffmpeg -rtsp_transport tcp -i "rtsp://root:pass@192.168.62.154:554/axis-media/media.amp?fps=5&h264profile=main&overlays=all&videocodec=h264" \
    -r 5 -vsync cfr -c:v libx264 -crf 23 -preset faster \
    -f segment -segment_time 15 -reset_timestamps 1 -strftime 1 \
    "/data/%Y%m%d%H%M%S.mp4"
}

# Main loop
while true; do
    echo "Starting ffmpeg..."
    run_ffmpeg

    # Check the exit status of ffmpeg
    if [ $? -ne 0 ]; then
        echo "ffmpeg failed with exit code $?. Restarting in 10 seconds..."
        sleep 10
    else
        echo "ffmpeg exited normally. Restarting in 5 seconds..."
        sleep 5
    fi
done