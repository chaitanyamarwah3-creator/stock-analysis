import os
import uvicorn
from fastapi import FastAPI, File, UploadFile, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from predictor import StockPredictor
import subprocess
import yfinance as yf

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

@app.get("/api/market/gainers-losers")
def get_gainers_losers():
    """Fetch top daily gainers and losers from major Indian stocks."""
    tickers = [
        'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
        'SBIN.NS', 'BHARTIARTL.NS', 'LT.NS', 'ITC.NS', 'TITAGARH.NS',
        'WIPRO.NS', 'ADANIENT.NS', 'AXISBANK.NS', 'ASIANPAINT.NS', 'SUNPHARMA.NS',
        'ONGC.NS', 'NTPC.NS', 'POWERGRID.NS', 'TATASTEEL.NS', 'COALINDIA.NS',
        'BAJFINANCE.NS', 'JSWSTEEL.NS', 'TECHM.NS', 'HINDUNILVR.NS', 'HAL.NS',
        'BEL.NS', 'IRFC.NS', 'RVNL.NS', 'HUDCO.NS', 'ZOMATO.NS'
    ]
    try:
        data = yf.download(tickers, period="5d", group_by='ticker', progress=False)
        results = []
        for ticker in tickers:
            if ticker not in data or data[ticker].empty:
                continue
            df = data[ticker]
            df = df.dropna(subset=["Close", "Volume"])
            df = df[df["Volume"] > 0]
            if len(df) < 2:
                continue
            close_today = float(df["Close"].iloc[-1])
            close_prev = float(df["Close"].iloc[-2])
            change = close_today - close_prev
            change_pct = (change / close_prev) * 100
            
            results.append({
                "symbol": ticker.replace(".NS", ""),
                "price": close_today,
                "change": change,
                "change_pct": change_pct
            })
            
        if not results:
            return {"success": False, "error": "No market telemetry could be parsed."}
            
        results.sort(key=lambda x: x["change_pct"], reverse=True)
        gainers = results[:5]
        losers = results[-5:][::-1] # reverse so worst loser is first
        
        return {
            "success": True,
            "gainers": gainers,
            "losers": losers
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/market/batch")
def get_batch_prices(symbols: str = Query(..., description="Comma-separated ticker symbols")):
    """Fetch live pricing telemetry for a batch of tickers."""
    sym_list = [f"{s.strip().upper()}.NS" for s in symbols.split(",") if s.strip()]
    try:
        if not sym_list:
            return {"success": False, "error": "No symbols specified."}
        data = yf.download(sym_list, period="5d", group_by='ticker', progress=False)
        results = {}
        
        if len(sym_list) == 1:
            ticker = sym_list[0]
            ticker_name = ticker.replace(".NS", "")
            df = data.dropna(subset=["Close"]) if not data.empty else None
            if df is not None and not df.empty:
                close = float(df["Close"].iloc[-1])
                prev_close = float(df["Close"].iloc[-2]) if len(df) > 1 else close
                results[ticker_name] = {
                    "price": close,
                    "change": close - prev_close,
                    "change_pct": ((close - prev_close) / prev_close) * 100
                }
        else:
            for sym in sym_list:
                ticker_name = sym.replace(".NS", "")
                if sym not in data or data[sym].empty:
                    continue
                df = data[sym].dropna(subset=["Close"])
                if df.empty:
                    continue
                close = float(df["Close"].iloc[-1])
                prev_close = float(df["Close"].iloc[-2]) if len(df) > 1 else close
                results[ticker_name] = {
                    "price": close,
                    "change": close - prev_close,
                    "change_pct": ((close - prev_close) / prev_close) * 100
                }
        return {"success": True, "data": results}
    except Exception as e:
        return {"success": False, "error": str(e)}

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
