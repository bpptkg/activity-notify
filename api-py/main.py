from fastapi import FastAPI
from routes.find_event_handler import router as find_event_router
from routes.record_cctvs import router as record_cctvs


# Define the directory where the MSEED files are stored
MSEED_DIR = "./data"

# Initialize FastAPI
app = FastAPI()
app.include_router(find_event_router)
app.include_router(record_cctvs)

# Run the API with: uvicorn main:app --reload
