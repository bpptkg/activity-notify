FROM node:18-slim

WORKDIR /app

COPY package*json /app/
RUN npm install
COPY . /app

CMD ["npx", "tsx", "./src/index.ts"]