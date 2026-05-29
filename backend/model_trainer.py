import os
import pandas as pd
import numpy as np
import yfinance as yf
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import joblib

def calculate_indicators(df):
    """Calculate key financial technical indicators for the model features."""
    df = df.copy()
    
    # Simple Moving Averages (SMA)
    df['SMA_10'] = df['Close'].rolling(window=10).mean()
    df['SMA_30'] = df['Close'].rolling(window=30).mean()
    df['SMA_ratio'] = df['SMA_10'] / df['SMA_30']
    
    # Exponential Moving Averages (EMA)
    df['EMA_9'] = df['Close'].ewm(span=9, adjust=False).mean()
    df['EMA_21'] = df['Close'].ewm(span=21, adjust=False).mean()
    df['EMA_ratio'] = df['EMA_9'] / df['EMA_21']
    df['EMA_9_pct'] = df['EMA_9'] / df['Close']
    df['EMA_21_pct'] = df['EMA_21'] / df['Close']
    
    # MACD
    ema_12 = df['Close'].ewm(span=12, adjust=False).mean()
    ema_26 = df['Close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = ema_12 - ema_26
    df['MACD_signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
    df['MACD_hist'] = df['MACD'] - df['MACD_signal']
    df['MACD_pct'] = df['MACD'] / df['Close']
    df['MACD_signal_pct'] = df['MACD_signal'] / df['Close']
    df['MACD_hist_pct'] = df['MACD_hist'] / df['Close']
    
    # RSI (Relative Strength Index)
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / (loss + 1e-10)
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # Bollinger Bands
    df['BB_middle'] = df['Close'].rolling(window=20).mean()
    df['BB_std'] = df['Close'].rolling(window=20).std()
    df['BB_high'] = df['BB_middle'] + (2 * df['BB_std'])
    df['BB_low'] = df['BB_middle'] - (2 * df['BB_std'])
    df['BB_width'] = (df['BB_high'] - df['BB_low']) / df['BB_middle']
    
    # Momentum / Rate of Change (ROC)
    df['ROC_1'] = df['Close'].pct_change(periods=1)
    df['ROC_5'] = df['Close'].pct_change(periods=5)
    df['ROC_10'] = df['Close'].pct_change(periods=10)
    
    # Volatility (Rolling Std of daily return)
    df['Volatility'] = df['ROC_1'].rolling(window=10).std()
    
    # Drop rows with NaN values resulting from indicators
    df = df.dropna()
    return df

def prepare_dataset():
    """Download representative stock data to simulate a high-quality Kaggle dataset."""
    print("Fetching historical market data...")
    # Using top Indian blue-chips and growth stocks to form a robust NSE dataset
    tickers = [
        'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
        'SBIN.NS', 'BHARTIARTL.NS', 'LT.NS', 'ITC.NS', 'TATAMOTORS.NS', 
        'TITAGARH.NS', '^NSEI'
    ]
    all_data = []
    
    for ticker in tickers:
        print(f"Downloading {ticker}...")
        df = yf.download(ticker, start='2018-01-01', end='2026-05-29')
        if df.empty:
            continue
        
        # Flatten MultiIndex columns if present (recent yfinance versions return MultiIndex columns even for single tickers)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        
        # Calculate indicators
        df = calculate_indicators(df)
        
        # Target: 5 days forward return
        # Bullish: return > 1.2%
        # Bearish: return < -1.2%
        # Neutral: in between
        df['forward_return'] = df['Close'].shift(-5).pct_change(periods=5) # Shifted 5 days ahead return
        
        # Recalculate target cleanly: Close(t+5) / Close(t) - 1
        df['future_5d_close'] = df['Close'].shift(-5)
        df['target_return'] = (df['future_5d_close'] - df['Close']) / df['Close']
        
        # Define categories: 0=Bearish, 1=Neutral, 2=Bullish
        conditions = [
            (df['target_return'] <= -0.012),
            (df['target_return'] > -0.012) & (df['target_return'] < 0.012),
            (df['target_return'] >= 0.012)
        ]
        choices = [0, 1, 2] # 0: Bearish, 1: Neutral, 2: Bullish
        df['target'] = np.select(conditions, choices, default=1)
        
        # Drop rows where future returns are NaN (the last 5 rows of each stock)
        df = df.dropna(subset=['target_return'])
        
        all_data.append(df)
        
    combined_df = pd.concat(all_data, ignore_index=True)
    return combined_df

def train_model():
    """Train Random Forest model and save serialized state."""
    df = prepare_dataset()
    
    features = [
        'SMA_ratio', 'EMA_ratio', 'EMA_9_pct', 'EMA_21_pct',
        'MACD_pct', 'MACD_signal_pct', 'MACD_hist_pct',
        'RSI', 'BB_width', 'ROC_5', 'ROC_10', 'Volatility'
    ]
    
    X = df[features]
    y = df['target']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print(f"Training set shape: {X_train.shape}")
    print(f"Testing set shape: {X_test.shape}")
    
    model = RandomForestClassifier(n_estimators=150, max_depth=12, random_state=42, n_jobs=-1)
    model.fit(X_train_scaled, y_train)
    
    y_pred = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    print(f"Model Training Completed. Test Accuracy: {acc:.4f}")
    print(classification_report(y_test, y_pred, target_names=['Bearish', 'Neutral', 'Bullish']))
    
    # Save the model and scaler
    output_dir = os.path.dirname(os.path.abspath(__file__))
    joblib.dump(model, os.path.join(output_dir, 'stock_model.joblib'))
    joblib.dump(scaler, os.path.join(output_dir, 'scaler.joblib'))
    joblib.dump(features, os.path.join(output_dir, 'features_list.joblib'))
    print("Model saved to stock_model.joblib")

if __name__ == '__main__':
    train_model()
