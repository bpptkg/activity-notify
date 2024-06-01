import { logger } from "../logger";

export const sendCctv = async (id: string) => {
  try {
    const formPhoto = new FormData();
    formPhoto.append("chat_id", "-1002026839953");
    formPhoto.append("caption", id);
    const photoResponse = await fetch(
      `http://192.168.0.74:1984/api/frame.jpeg?src=main_JUR`
    );
    const photo = await photoResponse.blob();
    formPhoto.append("photo", photo);
    const data =  await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendPhoto`,
      {
        method: "POST",
        body: formPhoto,
      }
    );
    logger.info("sent cctv to telegram: ", data.json());
  } catch (error) {
    logger.error('failed send cctv to telegram: ', error);
  }
};
