from telegram import Bot
from telegram.constants import ParseMode
import os
from dotenv import load_dotenv

load_dotenv()
chat_id = os.getenv('CHAT_ID')
bot_token = os.getenv('BOT_TOKEN')
bot = Bot(token=bot_token)

async def sendVideo(output: str):
    video_path = f'{output}'
    
    async with bot:
        with open(video_path, 'rb') as video:
            await bot.send_video(chat_id=chat_id, video=video)