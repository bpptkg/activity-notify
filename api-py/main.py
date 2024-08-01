from fastapi import FastAPI, HTTPException, Query
from obspy import read, UTCDateTime
from datetime import timedelta
import os
import numpy as np
from plot import plot_waveforms

# Define the directory where the MSEED files are stored
MSEED_DIR = "./data"

# Initialize FastAPI
app = FastAPI()

def convert_to_local_time(utc_time: UTCDateTime) -> str:
    # Convert UTCDateTime to datetime
    utc_dt = utc_time.datetime
    # Convert to GMT+7
    local_dt = utc_dt + timedelta(hours=7)
    # Format as YYYYMMDDHHmmss
    return utc_dt.strftime("%Y%m%d%H%M%S")

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

    # Find the trace for VG.MEPAS.00.HHZ
    max_value = None
    max_value_time = None
    for tr in st:
        if tr.stats.station == 'MEPAS' and tr.stats.channel == 'HHZ':
            # Trim the trace to the desired time window
            tr_trimmed = tr.trim(starttime=start_utc, endtime=end_utc)
            
            # Find the maximum value in the trimmed trace
            if tr_trimmed.stats.npts > 0:
                max_value_index = np.argmax(tr_trimmed.data)
                max_value = np.max(tr_trimmed.data)
                max_value_time = tr_trimmed.times()[max_value_index]
            break

    if max_value is None or max_value_time is None:
            raise HTTPException(status_code=404, detail="Trace not found or no data in the given time range.")
    
    max_value_time_utc = UTCDateTime(start_utc + max_value_time)  # Convert to UTCDateTime
    max_value_time_str = convert_to_local_time(max_value_time_utc)

    output_file = "plot.png"
    plot_waveforms(max_value_time_str, "./output/" + max_value_time_str + ".png")

    return {"mepas": float(max_value), "time": max_value_time_str}

# Run the API with: uvicorn api:app --reload
