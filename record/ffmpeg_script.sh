#!/bin/bash

ffmpeg -rtsp_transport tcp -i "rtsp://root:pass@192.168.62.154:554/axis-media/media.amp?fps=5&h264profile=main&overlays=all&videocodec=h264" \
-r 5 -vsync cfr -c:v libx264 -crf 23 -preset faster \
-f segment -segment_time 15 -reset_timestamps 1 -strftime 1 \
"/data/%Y%m%d%H%M%S.mp4"