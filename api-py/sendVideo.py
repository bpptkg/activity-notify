import os
import aiohttp
from dotenv import load_dotenv

load_dotenv()
chat_id = os.getenv('CHAT_ID')
bot_token = os.getenv('BOT_TOKEN')

async def sendVideo(output: str):
    video_path = f'{output}'
    url = f'https://api.telegram.org/bot{bot_token}/sendVideo'
    
    async with aiohttp.ClientSession() as session:
        with open(video_path, 'rb') as video:
            data = aiohttp.FormData()
            data.add_field('chat_id', chat_id)
            data.add_field('video', video)
            
            async with session.post(url, data=data) as response:
                if response.status == 200:
                    print("Video sent successfully")
                else:
                    print(f"Failed to send video. Status code: {response.status}")
                    response_text = await response.text()
                    print(f"Response: {response_text}")