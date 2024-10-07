from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from obspy import UTCDateTime
from datetime import timedelta, datetime
import os
import numpy as np
import asyncio
import aiohttp
import asyncio
from utils.send_event_to_tg import send_event_to_tg
from utils.generate_video_from_files import generate_video_from_files
from utils.winston_csv_to_json import winston_csv_to_json
from utils.send_video_to_tg import send_video_to_tg
from utils.plot import plot_waveforms

router = APIRouter()

# Define the directory where the MSEED files are stored
MSEED_DIR = "./data"

async def fetch_data(session, code, start, duration):
    url = f"http://192.168.0.45:16030/rsam/?code={code}&t1={start.strftime('%Y%m%d%H%M')}&t2={(start + timedelta(seconds=duration)).strftime('%Y%m%d%H%M')}&rsamP=1&tz=Asia/Jakarta&csv=1"
    async with session.get(url) as response:
        return await response.text()

@router.get("/max")
async def find_event(
    start: str = Query(..., description="Start time in YYYYMMDDHHmm format (GMT+7)"),
    duration: int = Query(60 * 5, description="Duration in seconds")
):
    # Validate the time format and convert to UTC
    try:
        start_utc = UTCDateTime.strptime(start, "%Y%m%d%H%M") - 7 * 3600
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid time format. Use YYYYMMDDHHmm.")
    
    # Validate the duration
    try:
        if duration <= 0:
            raise ValueError
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid duration. Duration must be a positive integer.")

    codes = ["MEPAS_HHZ_VG_00", "MELAB_HHZ_VG_00"]
    async with aiohttp.ClientSession() as session:
        raw_values = await asyncio.gather(*(fetch_data(session, code, start_utc, 60 * 5) for code in codes))
    
    mepas_raw_val, melab_raw_val = raw_values
    
    mepas_json = winston_csv_to_json(mepas_raw_val)
    melab_json = winston_csv_to_json(melab_raw_val)

    event_start_time = None
    max_mepas_rsam = None
    event_duration = None
    for i in np.ndindex(mepas_json.shape):
        index = i[0]
        timestamp = mepas_json[index][0]
        rsam = float(mepas_json[index][1])

        if event_start_time is None and rsam > 500:
            event_start_time = timestamp
            max_mepas_rsam = rsam

        if event_start_time is not None:
            if rsam > max_mepas_rsam:
                max_mepas_rsam = rsam

            if rsam <= 750:
                event_duration = (datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S") - datetime.strptime(event_start_time, "%Y-%m-%d %H:%M:%S")).total_seconds()
                if (event_duration > 10 and max_mepas_rsam > 2500) or (event_duration > 25 and max_mepas_rsam <= 2500):
                    break
                else:
                    event_start_time = None
                    max_mepas_rsam = None

    max_melab_rsam = None
    if event_start_time is not None:
        if event_duration is None:
            event_duration = (datetime.strptime(mepas_json[-1][0], "%Y-%m-%d %H:%M:%S") - datetime.strptime(event_start_time, "%Y-%m-%d %H:%M:%S")).total_seconds()

        for i in np.ndindex(melab_json.shape):
            index = i[0]
            rsam = float(melab_json[index][1])
            timestamp = melab_json[index][0]

            if timestamp < event_start_time:
                continue

            if  (datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S") - datetime.strptime(event_start_time, "%Y-%m-%d %H:%M:%S")).total_seconds() > event_duration:
                break

            max_melab_rsam = rsam


    if not max_mepas_rsam or not max_melab_rsam:
        return {"message": "Event not found"}
    
    time = UTCDateTime.strptime(event_start_time, "%Y-%m-%d %H:%M:%S")
    output = "./output/" + time.strftime("%Y-%m-%d_%H.%M.%S")
    ratio = round(max_mepas_rsam / max_melab_rsam, 2)
    event_duration = round(event_duration)
    max_mepas_rsam = round(max_mepas_rsam)

    plot_waveforms((time - 7 * 3600).strftime("%Y%m%d%H%M%S"), output + ".png")
    await (send_event_to_tg((time).strftime("%Y-%m-%d %H:%M:%S"), ratio, max_mepas_rsam, event_duration, output + ".png"))
    generate_video_from_files(os.getenv('VIDEOS_PATH') + "/Video Monitoring", (time).datetime, 'Jurangjero', 'JUR', output + ".mp4")
    await (send_video_to_tg(output + ".mp4"))

    return {
        "time": event_start_time,
        "rsam": max_mepas_rsam,
        "ratio": ratio,
        "duration": event_duration
    }

@router.get("/resend-stream")
async def find_event(
    start: str = Query(..., description="Start time in YYYYMMDDHHmmss format (GMT+7)"),
    index: int = Query(0, description="Duration in seconds"),
    duration: int = Query(60, description="Duration in seconds")
):
    # Validate the time format
    try:
        UTCDateTime.strptime(start, "%Y%m%d%H%M%S")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid time format. Use YYYYMMDDHHmmss.")
    
    # Validate the duration
    try:
        if duration <= 0:
            raise ValueError
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid duration. Duration must be a positive integer.")

    start_time = UTCDateTime.strptime(start, "%Y%m%d%H%M%S")
    output = "./output/" + start_time.strftime("%Y-%m-%d_%H.%M.%S")
    plotResult = plot_waveforms((start_time - 7 * 3600).strftime("%Y%m%d%H%M%S"), output + ".png", duration, -5)

    link = f'#{index}\n[Stream Update](https://proxy.cendana15.com/notify/resend-stream?start={start}&index={index}&duration={duration})'

    await (send_event_to_tg((start_time).strftime("%Y-%m-%d %H:%M:%S"), plotResult['ramp'], plotResult['amp1'], duration, output + ".png", link))

    return FileResponse(output + ".png", media_type="image/png")

@router.get("/resend-video")
async def find_event(
    start: str = Query(..., description="Start time in YYYYMMDDHHmmss format (GMT+7)"),
    index: int = Query(0, description="Duration in seconds"),
    duration: int = Query(60, description="Duration in seconds")
):
    # Validate the time format
    try:
        UTCDateTime.strptime(start, "%Y%m%d%H%M%S")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid time format. Use YYYYMMDDHHmmss.")
    
    # Validate the duration
    try:
        if duration <= 0:
            raise ValueError
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid duration. Duration must be a positive integer.")

    start_time = UTCDateTime.strptime(start, "%Y%m%d%H%M%S")
    output = "./output/" + start_time.strftime("%Y-%m-%d_%H.%M.%S")
    link = f'#{index}\n[Resend Video](https://proxy.cendana15.com/notify/resend-video?start={start}&index={index}&duration={duration})'
   
    generate_video_from_files(os.getenv('VIDEOS_PATH') + "/Video Monitoring", (start_time).datetime, 'Jurangjero', 'JUR', output + ".mp4")
    await (send_video_to_tg(output + ".mp4", link))

    return FileResponse(output + ".mp4", media_type="video/mp4")

@router.get("/plot")
async def find_event(
    start: str = Query(..., description="Start time in YYYYMMDDHHmmss format (GMT+7)"),
    duration: int = Query(30, description="Duration in seconds")
):
    # Validate the time format
    try:
        UTCDateTime.strptime(start, "%Y%m%d%H%M%S")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid time format. Use YYYYMMDDHHmmss.")
    
    # Validate the duration
    try:
        if duration <= 0:
            raise ValueError
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid duration. Duration must be a positive integer.")

    start_time = UTCDateTime.strptime(start, "%Y%m%d%H%M%S")
    output = "./output/" + start_time.strftime("%Y-%m-%d_%H.%M.%S")
    plot_waveforms((start_time - 7 * 3600).strftime("%Y%m%d%H%M%S"), output + ".png", duration)

    return FileResponse(output + ".png", media_type="image/png")
