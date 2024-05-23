FROM node:20-slim

RUN apt-get update && apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*json /app/
RUN npm install
COPY . /app

CMD ["npx", "tsx", "./src/index.ts"]