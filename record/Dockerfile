# Use the base image
FROM jrottenberg/ffmpeg:4.2.7-ubuntu2004

# Set the timezone
ENV TZ=Asia/Jakarta

# Install tzdata and set timezone
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Copy your recording script into the container
COPY manage_files.sh .
COPY record_video.sh .

# Make the script executable
RUN chmod +x manage_files.sh
RUN chmod +x record_video.sh

# Set the entrypoint to your script
ENTRYPOINT ["./record_video.sh"]
