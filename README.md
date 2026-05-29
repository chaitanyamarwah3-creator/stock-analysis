# 📈 AI Stock Trend Predictor

An interactive, high-end web application that predicts whether a stock trend is **Bullish**, **Bearish**, or **Neutral** using **Machine Learning (Random Forest)**, **Computer Vision (OpenCV)**, and real-time financial data.

Designed with a premium, futuristic dark-theme interface featuring glassmorphic details and cursor-reactive particle animations (inspired by the Antigravity design language).

---

## 🌟 Key Features

* **Interactive Cursor-Reactive UI**: Canvas-based particle swarm background that responds dynamically to mouse coordinates, creating an engaging user experience.
* **Live Ticker Analysis**: Queries real-time stock and cryptocurrency indexes (via Yahoo Finance API), calculates complex technical indicators, and runs a Machine Learning classifier to output a trend probability.
* **Chart Digitizer & OpenCV Screenshot Analysis**:
  - Preprocesses chart images to crop toolbar chrome and volume bars automatically.
  - Segments green/red candlestick bodies using HSV color masking.
  - Digitizes pixel coordinates into chronological `Open`, `High`, `Low`, and `Close` (OHLC) values.
  - Scales the series so the latest price matches `$150.0` to preserve volatility while aligning features with the classifier.
* **Pattern Recognition Engine**: Detects high-probability Japanese candlestick formations (Doji, Hammer, Shooting Star, Engulfing, Morning/Evening Stars).
* **Technical Indicator Suite**: Computes Relative Strength Index (RSI), Moving Average Convergence Divergence (MACD), Simple Moving Averages (10-day & 30-day SMAs), and Bollinger Bands.
* **Ensemble Blending**: Blends the ML classification probabilities, candlestick patterns, and linear regression slopes into a single, high-fidelity trend call.

---

## 🛠️ Technology Stack

### Backend
* **FastAPI**: High-performance Python web framework for exposing the API endpoints.
* **OpenCV**: Computer vision library used to parse, segment, and digitize stock charts from screenshots.
* **Scikit-Learn**: Scaler and Random Forest classifier trained on 8 years of historical S&P 500 ETF and blue-chip stock data.
* **Pandas & NumPy**: High-performance data manipulation and mathematical analysis.
* **yfinance**: Real-time market data fetcher.

### Frontend
* **React + Vite**: Ultra-fast build tool and reactive component architecture.
* **Recharts**: Responsive charting library for displaying historical prices.
* **Lucide React**: Clean, modern icon family.
* **HTML5 Canvas API**: Used to render the cursor-following particle grid.

---

## 📂 Project Directory Structure

```text
stock-analysis/
├── backend/
│   ├── main.py              # FastAPI application server & routes
│   ├── predictor.py         # OpenCV digitizer, ML inference & patterns logic
│   ├── model_trainer.py     # Script to download datasets & train RandomForest
│   ├── requirements.txt     # Python project dependencies
│   ├── stock_model.joblib   # Trained ML Model (gitignored)
│   ├── scaler.joblib        # Pre-fitted StandardScaler (gitignored)
│   └── features_list.joblib # Trained feature list parameters (gitignored)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx   # Stock search, screenshot drops & predictions
│   │   │   └── ParticlesBg.jsx # Interactive cursor-reactive canvas grid
│   │   ├── App.jsx             # App layout and landing greeting views
│   │   ├── index.css           # Global typography, colors, animations & scrollbar
│   │   └── main.jsx            # React root mount
│   ├── package.json         # NodeJS dependencies
│   └── vite.config.js       # Vite server settings
│
└── .gitignore               # Global git exclusions
```

---

## 🚀 Getting Started

### Prerequisites
* Python 3.10 or higher
* Node.js (v18 or higher) & npm

### Backend Installation & Setup
1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install the dependencies (force-use precompiled wheels if on custom Python builds):
   ```bash
   pip install -r requirements.txt
   ```
4. Train the Random Forest classifier:
   ```bash
   python model_trainer.py
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn main:app --port 8000 --host 127.0.0.1
   ```

### Frontend Installation & Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite hot-reloading development server:
   ```bash
   npm run dev
   ```
4. Open the link displayed in your terminal (typically `http://localhost:5173` or `http://localhost:5174`).

---

## 📈 Under the Hood: Prediction Algorithms

### 1. Live Ticker Model
The Random Forest model is trained on technical data (2018–2026) for S&P 500 ETF and blue-chip stocks. 
* **Inputs**: `SMA_ratio`, `EMA_9`, `EMA_21`, `MACD`, `MACD_signal`, `MACD_hist`, `RSI`, `BB_width`, `ROC_5`, `ROC_10`, and `Volatility`.
* **Output**: Probability distributions for Bearish (Class 0), Neutral (Class 1), or Bullish (Class 2) states in the next 5 market days.

### 2. Image Parser & Ensemble (Screenshot Mode)
1. **Segmentation**: Uses OpenCV HSV masking (Green range: `[40, 50, 50]` to `[85, 255, 255]`; Red range: `[0, 50, 50]` to `[10, 255, 255]`) to locate colored candles.
2. **Digitization**: Traces wicks and bodies column-by-column to compile an array of `{Open, High, Low, Close}` coordinates.
3. **Scaling**: Scales coordinates so the latest close equals `$150.0`. Calculates RSI, MACD, SMAs, and Bollinger Bands on the digitized series.
4. **Pattern Scoring**: Evaluates candlestick reversals on the latest 3 bars.
5. **Weighted Blend**:
   $$\text{Final Score} = (45\% \times \text{ML Probability}) + (30\% \times \text{Candlestick Pattern}) + (25\% \times \text{Linear Regression})$$

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.
