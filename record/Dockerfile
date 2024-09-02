# Use jrottenberg/ffmpeg:4.2.7-ubuntu2004 as the base image
FROM jrottenberg/ffmpeg:4.2.7-ubuntu2004

# Install Monit
RUN apt-get update && apt-get install -y monit && rm -rf /var/lib/apt/lists/*

# Create directory for data
RUN mkdir /data

# Copy the FFmpeg script
COPY ffmpeg_script.sh /ffmpeg_script.sh
RUN chmod +x /ffmpeg_script.sh

# Copy Monit configuration
COPY monitrc /etc/monit/monitrc
RUN chmod 700 /etc/monit/monitrc

# Copy the entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Default command (can be overridden)
CMD ["run"]