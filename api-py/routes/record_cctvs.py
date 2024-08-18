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
    start_datetime = datetime.strptime(start, "%Y%m%d%H%M")
    date_path = start_datetime.strftime("%Y/%m/%d")

    stations = [
        ('Jurangjero', 'JUR'),
        ('Panguk-TRM', 'PGK-TRM'),
        ('Plawangan', 'PLA'),
        ('Kaliurang-TRM2', 'KAL-TRM2'),
        ('Tunggularum', 'TUN'),
        ('Jurangjero', 'JUR'),
        ('Jurangjero-TRM', 'JUR-TRM'),
        ('Babadan-2', 'BBD2'),
        ('Merbabu', 'MBB')
    ]

    outputs = []
    for station_name, station_code in stations:
        output = f"{os.getenv('VIDEOS_PATH')}/Event/{date_path}/{event}/{station_code}_{start_datetime.strftime('%Y%m%d%H%M')}.mp4"
        path = generate_video_from_files(os.getenv('VIDEOS_PATH') + "/Video Monitoring", start_datetime, station_name, station_code, output)
        outputs.append(path)

    return {"videos": outputs}
