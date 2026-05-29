import os
import uvicorn
from fastapi import FastAPI, File, UploadFile, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from predictor import StockPredictor
import subprocess

app = FastAPI(
    title="Stock Trend Predictor API",
    description="Machine Learning and Computer Vision backend for Bullish/Bearish prediction",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize predictor
predictor = StockPredictor()

@app.get("/api/health")
def health_check():
    model_trained = os.path.exists(os.path.join(os.path.dirname(__file__), 'stock_model.joblib'))
    return {
        "status": "healthy",
        "model_status": "trained" if model_trained else "not_trained (using fallback rules)"
    }

@app.get("/api/predict/live")
def predict_live(symbol: str = Query(..., description="Stock symbol (e.g. AAPL, TSLA, BTC-USD)")):
    """Predict trend (Bullish/Bearish) using live data and ML Classifier."""
    result = predictor.predict_live(symbol)
    return result

@app.post("/api/predict/screenshot")
async def predict_screenshot(file: UploadFile = File(...)):
    """Predict trend from a screenshot of a stock chart using OpenCV."""
    contents = await file.read()
    result = predictor.predict_screenshot(contents)
    return result

def run_training_task():
    try:
        script_path = os.path.join(os.path.dirname(__file__), 'model_trainer.py')
        subprocess.run(["python", script_path], check=True)
        # Reload predictor model state
        predictor.load_model()
        print("Async model training task completed.")
    except Exception as e:
        print(f"Async model training failed: {e}")

@app.post("/api/train")
def train_model(background_tasks: BackgroundTasks):
    """Trigger background job to download Kaggle-equivalent stock dataset and train the ML classifier."""
    background_tasks.add_task(run_training_task)
    return {"status": "training_started", "message": "Model training has been queued in the background."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
