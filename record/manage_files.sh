#!/bin/bash

# Directory to monitor
DIR="/data"
# Number of files to keep
KEEP=7

while true; do
    # Count the number of files in the directory
    FILE_COUNT=$(ls -1q $DIR/*.mp4 | wc -l)
    
    # Check if the number of files exceeds the limit
    if [ $FILE_COUNT -gt $KEEP ]; then
        # Find and delete the oldest file(s)
        ls -t $DIR/*.mp4 | tail -n +$(($KEEP + 1)) | xargs rm --
    fi

    # Sleep for a while before checking again
    sleep 5
done
