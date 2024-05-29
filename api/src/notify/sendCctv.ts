export const sendCctv = async (id: string) => {
  try {
    const formPhoto = new FormData();
    formPhoto.append("chat_id", "-1002026839953");
    formPhoto.append("capion", id);
    const photoResponse = await fetch(
      `http://192.168.0.74:1984/api/frame.jpeg?src=main_JUR`
    );
    const photo = await photoResponse.blob();
    formPhoto.append("photo", photo);
    await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendPhoto`,
      {
        method: "POST",
        body: formPhoto,
      }
    );
  } catch (error) {
    console.error('Error send cctv: ', error);
  }
};
