#!/bin/bash
set -e

if [ "$1" = 'run' ]; then
    # Start Monit
    monit

    # Start FFmpeg script
    exec /ffmpeg_script.sh
else
    exec "$@"
fi