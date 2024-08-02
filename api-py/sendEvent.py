from telegram import Bot
from telegram.constants import ParseMode
import os
from dotenv import load_dotenv
load_dotenv()

chat_id = '-1002211468994'
# chat_id = '-1002026839953'
bot_token = os.getenv('BOT_TOKEN')
bot = Bot(token=bot_token)

async def sendEvent(date: str, ratio: int, mepasRsam: int, duration: int, output: str):
    photo_path = f'{output}'
    time = date
    caption = (
        f'Terjadi gempa:\n'
        f'Waktu: {time} WIB\n'
        f'RSAM: {mepasRsam}\n'
        f'Durasi: {duration} detik\n'
        f'Ratio: {ratio}'
    )

    async with bot:
        with open(photo_path, 'rb') as photo:
            await bot.send_photo(chat_id=chat_id, photo=photo, caption=caption, parse_mode=ParseMode.MARKDOWN)

