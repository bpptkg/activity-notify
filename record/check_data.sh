#!/bin/bash

# Directory to check
DATA_DIR="/tmp"

# Check if any files in the directory have been modified in the last 5 minutes
find "$DATA_DIR" -type f -mmin -5 | grep -q .
if [ $? -eq 0 ]; then
    exit 0  # Files found, return success
else
    exit 1  # No files found, return failure
fi
