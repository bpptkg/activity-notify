export const sendCctv = async () => {
  try {
    const formPhoto = new FormData();
    formPhoto.append("chat_id", "-1002026839953");
    const photoResponse = await fetch(
      `http://192.168.0.74:1984/api/frame.jpeg?src=main_JUR`
    );
    const photo = await photoResponse.blob();
    formPhoto.append("photo", photo);
    await fetch(
      `https://api.telegram.org/bot6715715865:AAEchBtNy2GlrX-o3ACJQnbTjvv476jBwjY/sendPhoto`,
      {
        method: "POST",
        body: formPhoto,
      }
    );
  } catch (error) {
    console.error('Error send cctv: ', error);
  }
};
