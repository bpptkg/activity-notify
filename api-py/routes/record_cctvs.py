from utils.generate_video_from_files import generate_video_from_files
from fastapi import APIRouter, Query
import os
from datetime import datetime

router = APIRouter()

@router.get("/record_cctvs")
async def record_cctvs(
    event: str,
    start: str = Query(..., description="Start time in YYYYMMDDHHmm format (GMT+7)")
):
    station_name = 'Jurangjero'
    station_code = 'JUR'

    start_datetime = datetime.strptime(start, "%Y%m%d%H%M")
    date_path = start_datetime.strftime("%Y/%m/%d")
    output = f"{os.getenv('VIDEOS_PATH')}/Event/{date_path}/{event}/{station_code}_{start_datetime.strftime('%Y%m%d%H%M')}.mp4"

    generate_video_from_files(os.getenv('VIDEOS_PATH') + "/Video Monitoring", start_datetime, station_name, station_code, output)

    return output
