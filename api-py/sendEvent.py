import os
import aiohttp
from dotenv import load_dotenv

load_dotenv()
chat_id = os.getenv('CHAT_ID')
bot_token = os.getenv('BOT_TOKEN')

async def sendEvent(date: str, ratio: float, mepasRsam: int, duration: int, output: str):
    photo_path = f'{output}'
    time = date
    caption = (
        f'Terjadi gempa:\n'
        f'Waktu: {time} WIB\n'
        f'RSAM: {mepasRsam}\n'
        f'Durasi: {duration} detik\n'
        f'Ratio: {ratio}'
    )
    
    url = f'https://api.telegram.org/bot{bot_token}/sendPhoto'
    
    async with aiohttp.ClientSession() as session:
        with open(photo_path, 'rb') as photo:
            form = aiohttp.FormData()
            form.add_field('photo', photo)
            form.add_field('chat_id', chat_id)
            form.add_field('caption', caption)
            form.add_field('parse_mode', 'Markdown')
            
            async with session.post(url, data=form) as response:
                return await response.json()