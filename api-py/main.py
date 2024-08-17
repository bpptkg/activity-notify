from fastapi import FastAPI
from routes.find_event_handler import router as find_event_router


# Define the directory where the MSEED files are stored
MSEED_DIR = "./data"

# Initialize FastAPI
app = FastAPI()
app.include_router(find_event_router)

# Run the API with: uvicorn main:app --reload
