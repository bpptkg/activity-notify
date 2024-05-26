FROM node:18-slim

RUN apt-get update && apt-get install -y python3 python3-pip python3-venv

WORKDIR /app

RUN python3 -m venv .venv
RUN . .venv/bin/activate

COPY ./requirements.txt /app/
RUN .venv/bin/pip3 install -r requirements.txt

COPY package*json /app/
RUN npm install

COPY . /app/

CMD ["npx", "tsx", "./src/index.ts"]