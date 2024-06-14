# Use the base image
FROM jrottenberg/ffmpeg:4.2.7-ubuntu2004

# Copy your recording script into the container
COPY manage_files.sh .
COPY record_video.sh .

# Make the script executable
RUN chmod +x manage_files.sh
RUN chmod +x record_video.sh

# Set the entrypoint to your script
ENTRYPOINT ["./record_video.sh"]
