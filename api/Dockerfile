FROM jrottenberg/ffmpeg:4.2.7-ubuntu2004

RUN apt-get update && apt-get install -y python3 python3-pip python3-venv curl

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN python3 -m venv .venv
RUN . .venv/bin/activate

COPY ./requirements.txt /app/
RUN .venv/bin/pip3 install -r requirements.txt

COPY package*json /app/
RUN npm install

COPY . /app/

ENTRYPOINT ["npx", "tsx", "./src/index.ts"]