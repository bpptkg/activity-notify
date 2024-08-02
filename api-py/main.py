from fastapi import FastAPI, HTTPException, Query
from obspy import read, UTCDateTime
from datetime import timedelta
import os
import numpy as np
from plot import plot_waveforms
from generateVideo import generateVideo
from sendEvent import sendEvent
from sendVideo import sendVideo
import asyncio

# Define the directory where the MSEED files are stored
MSEED_DIR = "./data"

# Initialize FastAPI
app = FastAPI()

@app.get("/max")
def get_max_value(
    start: str = Query(..., description="Start time in YYYYMMDDHHmmss format (GMT+7)"),
    end: str = Query(..., description="End time in YYYYMMDDHHmmss format (GMT+7)")
):
    # Validate the time format and convert to UTC
    try:
        start_utc = UTCDateTime.strptime(start, "%Y%m%d%H%M%S") - 7 * 3600
        end_utc = UTCDateTime.strptime(end, "%Y%m%d%H%M%S") - 7 * 3600
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid time format. Use YYYYMMDDHHmmss.")

    # Generate the list of filenames to read based on the date range
    current_date = start_utc.date
    end_date = end_utc.date
    filenames = []

    while current_date <= end_date:
        filename = os.path.join(MSEED_DIR, f"{current_date}.mseed")
        if os.path.exists(filename):
            filenames.append(filename)
        current_date += timedelta(days=1)  # Move to the next day

    if not filenames:
        raise HTTPException(status_code=404, detail="No MSEED files found for the given date range.")

    # Read the relevant MSEED files
    st = read(filenames[0])
    for filename in filenames[1:]:
        st += read(filename)
    st.merge()

    max_value = {
        "MEPAS": {
            "rsam": None,
            "time": None
        },
        "MELAB": {
            "rsam": None,
            "time": None
        }
    }

    for tr in st:
        if tr.stats.station in ['MEPAS', "MELAB"]:
            # Trim the trace to the desired time window
            tr_trimmed = tr.trim(starttime=start_utc, endtime=end_utc)
            
            # Find the maximum value in the trimmed trace
            if tr_trimmed.stats.npts > 0:
                max_value_index = np.argmax(tr_trimmed.data)
                max_value[tr.stats.station]["rsam"] = np.max(tr_trimmed.data)
                max_value[tr.stats.station]["time"] = tr_trimmed.times()[max_value_index]
            continue

    if max_value["MEPAS"]['rsam'] is None or max_value["MELAB"]['rsam'] is None:
            raise HTTPException(status_code=404, detail="Trace not found or no data in the given time range.")
    
    time = UTCDateTime(start_utc + max_value["MEPAS"]["time"])
    ratio = round(max_value["MEPAS"]["rsam"] / max_value["MELAB"]["rsam"], 2)
    duration = round(end_utc - start_utc)
    output = "./output/" + (time + 7 * 3600).strftime("%Y%m%d%H%M%S")

    plot_waveforms(time.strftime("%Y%m%d%H%M%S"), output + ".png")
    asyncio.run(sendEvent((time + 7 * 3600).strftime("%Y-%m-%d %H:%M:%S"), ratio, max_value["MEPAS"]["rsam"], duration, output + ".png"))
    generateVideo(os.getenv('VIDEOS_PATH'), (time + 7 * 3600).datetime, 'Jurangjero', 'JUR', output + ".mp4")
    asyncio.run(sendVideo(output + ".mp4"))

    return {
        "ratio": ratio}

# Run the API with: uvicorn api:app --reload
