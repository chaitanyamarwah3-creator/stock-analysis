import os
import cv2
import numpy as np
import pandas as pd
import yfinance as yf
import joblib

from model_trainer import calculate_indicators

CURRENT_DIR  = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH   = os.path.join(CURRENT_DIR, 'stock_model.joblib')
SCALER_PATH  = os.path.join(CURRENT_DIR, 'scaler.joblib')
FEATURES_PATH = os.path.join(CURRENT_DIR, 'features_list.joblib')


class StockPredictor:
    def __init__(self):
        self.model    = None
        self.scaler   = None
        self.features = []
        self.load_model()

    def load_model(self):
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            try:
                self.model    = joblib.load(MODEL_PATH)
                self.scaler   = joblib.load(SCALER_PATH)
                self.features = joblib.load(FEATURES_PATH)
                print("ML models loaded successfully.")
            except Exception as e:
                print(f"Error loading model: {e}. Using fallback rules.")
        else:
            print("Model files not found. Fallback heuristic predictions will be used.")

    # ------------------------------------------------------------------
    # LIVE TICKER PREDICTION
    # ------------------------------------------------------------------
    def predict_live(self, symbol: str):
        """Fetches live stock data and predicts Bullish / Neutral / Bearish."""
        try:
            symbol = symbol.strip().upper()
            # If standard ticker without suffix and not an index symbol
            if not symbol.startswith('^') and '.' not in symbol:
                symbol = f"{symbol}.NS"

            ticker = yf.Ticker(symbol)
            # Download a full 1-year history to provide rich padding/buffers for indicators
            df     = ticker.history(period="1y")

            if df.empty or len(df) < 35:
                return {"success": False,
                        "error": f"Not enough historical data for symbol: {symbol}"}

            # Flatten MultiIndex columns if present (recent yfinance versions return MultiIndex columns even for single tickers)
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)

            # Drop the latest row if it is a pre-market or weekend bar with zero trading volume
            if len(df) > 1 and df["Volume"].iloc[-1] == 0:
                df = df.iloc[:-1]

            info            = ticker.info
            name            = info.get("longName", symbol)
            current_price   = float(df["Close"].iloc[-1])
            prev_close      = float(df["Close"].iloc[-2])
            price_change    = current_price - prev_close
            price_change_pct = (price_change / prev_close) * 100

            df_features = calculate_indicators(df)
            if df_features.empty:
                return {"success": False, "error": "Failed to calculate indicators."}

            latest = df_features.iloc[[-1]]

            rsi          = float(latest['RSI'].iloc[0])
            macd         = float(latest['MACD'].iloc[0])
            macd_signal  = float(latest['MACD_signal'].iloc[0])
            macd_hist    = float(latest['MACD_hist'].iloc[0])
            sma_10       = float(latest['SMA_10'].iloc[0])
            sma_30       = float(latest['SMA_30'].iloc[0])
            volatility   = float(latest['Volatility'].iloc[0])

            explanations = []
            if rsi > 70:
                explanations.append(f"RSI is high ({rsi:.1f}), indicating the stock is overbought (potential bearish pullback).")
            elif rsi < 30:
                explanations.append(f"RSI is low ({rsi:.1f}), indicating the stock is oversold (potential bullish rebound).")
            else:
                explanations.append(f"RSI is neutral ({rsi:.1f}), showing stable momentum.")

            if macd > macd_signal:
                explanations.append(f"MACD ({macd:.3f}) is above signal ({macd_signal:.3f}) — bullish crossover.")
            else:
                explanations.append(f"MACD ({macd:.3f}) is below signal ({macd_signal:.3f}) — bearish crossover.")

            if sma_10 > sma_30:
                explanations.append("10-day SMA is above 30-day SMA — upward price trend.")
            else:
                explanations.append("10-day SMA is below 30-day SMA — downward price trend.")

            use_fallback = (self.model is None or self.scaler is None)

            if use_fallback:
                score = 0
                if rsi < 40:          score += 1
                if rsi > 60:          score -= 1
                if macd > macd_signal: score += 1
                else:                  score -= 1
                if sma_10 > sma_30:   score += 1
                else:                  score -= 1

                if score >= 1:
                    prediction_class = 2
                    probabilities    = [0.15, 0.25, 0.60]
                elif score <= -1:
                    prediction_class = 0
                    probabilities    = [0.60, 0.25, 0.15]
                else:
                    prediction_class = 1
                    probabilities    = [0.30, 0.40, 0.30]
            else:
                X               = latest[self.features]
                X_scaled        = self.scaler.transform(X)
                prediction_class = int(self.model.predict(X_scaled)[0])
                probabilities   = self.model.predict_proba(X_scaled)[0].tolist()

            classes         = ["Bearish", "Neutral", "Bullish"]
            prediction_label = classes[prediction_class]
            confidence       = float(probabilities[prediction_class] * 100)

            if abs(rsi - 50) > 20:
                change_days = max(1, int(7 - abs(rsi - 50) / 10))
            elif abs(macd_hist) < 0.1 * abs(macd) and macd != 0:
                change_days = 2
            else:
                change_days = max(4, int(10 - volatility * 200))

            chart_data = []
            for date, row in df.tail(30).iterrows():
                chart_data.append({
                    "date":   date.strftime("%Y-%m-%d"),
                    "price":  float(row["Close"]),
                    "volume": int(row["Volume"]),
                    "high":   float(row["High"]),
                    "low":    float(row["Low"]),
                    "open":   float(row["Open"]),
                })

            return {
                "success":        True,
                "symbol":         symbol.upper(),
                "name":           name,
                "currentPrice":   current_price,
                "priceChange":    price_change,
                "priceChangePct": price_change_pct,
                "prediction":     prediction_label,
                "confidence":     confidence,
                "probabilities": {
                    "bearish": float(probabilities[0] * 100),
                    "neutral": float(probabilities[1] * 100),
                    "bullish": float(probabilities[2] * 100),
                },
                "explanations":      explanations,
                "changeDaysApprox":  change_days,
                "chartData":         chart_data,
            }

        except Exception as e:
            return {"success": False, "error": f"Error performing prediction: {str(e)}"}

    # ------------------------------------------------------------------
    # SCREENSHOT / CHART IMAGE PREDICTION (Improved v2: Chart Digitizer & ML Ensemble)
    # ------------------------------------------------------------------
    def predict_screenshot(self, file_bytes: bytes):
        """
        Analyzes a candlestick or line chart screenshot, digitizes it, 
        calculates actual technical indicators (RSI, MACD, SMAs) on the 
        reconstructed price points, and runs the Random Forest ML classifier.
        Also performs direct candlestick pattern detection.
        """
        try:
            np_arr = np.frombuffer(file_bytes, np.uint8)
            img    = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            if img is None:
                return {"success": False, "error": "Invalid image format."}

            h, w = img.shape[:2]

            # ── 1. Crop UI chrome (toolbar top ~10%, volume bottom ~22%) ────
            top_crop  = int(h * 0.10)
            bot_crop  = int(h * 0.22)
            chart_img = img[top_crop: h - bot_crop, :, :]
            ch, cw    = chart_img.shape[:2]

            # ── 2. HSV candlestick color detection ────────────────────
            hsv        = cv2.cvtColor(chart_img, cv2.COLOR_BGR2HSV)
            green_mask = cv2.inRange(hsv, np.array([40, 50, 50]), np.array([85, 255, 255]))
            red_mask1  = cv2.inRange(hsv, np.array([0, 50, 50]), np.array([10, 255, 255]))
            red_mask2  = cv2.inRange(hsv, np.array([160, 50, 50]), np.array([180, 255, 255]))
            red_mask   = cv2.bitwise_or(red_mask1, red_mask2)

            candle_px = cv2.countNonZero(cv2.bitwise_or(green_mask, red_mask))
            is_candle = candle_px > (ch * cw * 0.005)   # > 0.5% colored pixels

            # ── 3. Build price-level time series & candle wicks/bodies ────
            candles = []

            if is_candle:
                # Group contiguous columns containing candle pixels
                col_has_color = np.zeros(cw, dtype=bool)
                for col in range(cw):
                    col_has_color[col] = (np.any(green_mask[:, col] > 0) or np.any(red_mask[:, col] > 0))

                raw_clusters = []
                in_cluster = False
                start_idx = 0
                for col in range(cw):
                    if col_has_color[col]:
                        if not in_cluster:
                            start_idx = col
                            in_cluster = True
                    else:
                        if in_cluster:
                            raw_clusters.append((start_idx, col - 1))
                            in_cluster = False
                if in_cluster:
                    raw_clusters.append((start_idx, cw - 1))

                # Merge adjacent clusters separated by a small gap (<= 3 pixels)
                clusters = []
                if raw_clusters:
                    current = raw_clusters[0]
                    for next_c in raw_clusters[1:]:
                        if next_c[0] - current[1] <= 3:
                            current = (current[0], next_c[1])
                        else:
                            clusters.append(current)
                            current = next_c
                    clusters.append(current)
                else:
                    clusters = raw_clusters

                # Process each merged cluster as a single candlestick
                for start, end in clusters:
                    w_c = end - start + 1
                    g_pixels = np.where(green_mask[:, start:end+1] > 0)
                    r_pixels = np.where(red_mask[:, start:end+1] > 0)
                    
                    g_count = len(g_pixels[0])
                    r_count = len(r_pixels[0])
                    if g_count == 0 and r_count == 0:
                        continue

                    is_bullish = g_count > r_count
                    target_mask = green_mask if is_bullish else red_mask

                    # Extract vertical bounds
                    all_y_idx = np.where(target_mask[:, start:end+1] > 0)[0]
                    if len(all_y_idx) == 0:
                        continue

                    wick_top = float(np.min(all_y_idx))
                    wick_bottom = float(np.max(all_y_idx))

                    # Deduce body top and bottom
                    # Count colored pixels per row in this cluster to separate thick body from thin wicks
                    row_counts = np.sum(target_mask[:, start:end+1] > 0, axis=1)
                    body_rows = np.where(row_counts >= max(2, w_c * 0.4))[0]
                    
                    if len(body_rows) > 0:
                        body_top = float(np.min(body_rows))
                        body_bottom = float(np.max(body_rows))
                    else:
                        body_top = wick_top
                        body_bottom = wick_bottom

                    # Convert to math heights (flip Y-axis)
                    open_val = ch - body_bottom if is_bullish else ch - body_top
                    close_val = ch - body_top if is_bullish else ch - body_bottom
                    high_val = ch - wick_top
                    low_val = ch - wick_bottom

                    # Safety check ranges
                    high_val = max(high_val, open_val, close_val)
                    low_val = min(low_val, open_val, close_val)

                    candles.append({
                        "x": float((start + end) / 2),
                        "Open": float(open_val),
                        "High": float(high_val),
                        "Low": float(low_val),
                        "Close": float(close_val),
                        "color": "green" if is_bullish else "red"
                    })

            # Fallback for line chart or failed candle segmentations
            if not is_candle or len(candles) < 8:
                gray   = cv2.cvtColor(chart_img, cv2.COLOR_BGR2GRAY)
                avg_br = np.mean(gray)
                if avg_br > 127:
                    _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
                else:
                    _, thresh = cv2.threshold(gray,  40, 255, cv2.THRESH_BINARY)
                
                step = max(1, cw // 50)
                candles = []
                for col in range(0, cw, step):
                    active = np.where(thresh[:, col] > 0)[0]
                    if len(active) > 0:
                        val = float(ch - np.mean(active))
                        candles.append({
                            "x": float(col),
                            "Open": val,
                            "High": val,
                            "Low": val,
                            "Close": val,
                            "color": "green"  # Default
                        })

            if len(candles) < 8:
                return {
                    "success": False,
                    "error": "Could not detect a clear price trend in the image. Try uploading a cleaner screenshot."
                }

            # ── 4. Sort and Scale prices ──────────────────────────────
            df_recon = pd.DataFrame(candles)
            df_recon = df_recon.sort_values('x').reset_index(drop=True)

            # Scale so that the last Close is exactly $150.0
            last_close = df_recon['Close'].iloc[-1]
            scale_factor = 150.0 / max(last_close, 1.0)
            for col in ['Open', 'High', 'Low', 'Close']:
                df_recon[col] *= scale_factor

            # Pad with backward fill if series has less than 30 candles (required for rolling indicators)
            if len(df_recon) < 30:
                pad_len = 30 - len(df_recon)
                first_row = df_recon.iloc[[0]]
                padding = pd.concat([first_row] * pad_len, ignore_index=True)
                df_recon = pd.concat([padding, df_recon], ignore_index=True)

            # ── 5. Calculate Technical Indicators ──────────────────────
            df_features = calculate_indicators(df_recon)
            latest_features = df_features.iloc[[-1]]

            # Heuristics for explanations
            rsi = float(latest_features['RSI'].iloc[0])
            macd = float(latest_features['MACD'].iloc[0])
            macd_signal = float(latest_features['MACD_signal'].iloc[0])
            sma_10 = float(latest_features['SMA_10'].iloc[0])
            sma_30 = float(latest_features['SMA_30'].iloc[0])

            explanations = []
            if rsi > 70:
                explanations.append(f"Screenshot RSI is high ({rsi:.1f}) — overbought territory.")
            elif rsi < 30:
                explanations.append(f"Screenshot RSI is low ({rsi:.1f}) — oversold rebound setup.")
            else:
                explanations.append(f"Momentum RSI is stable at {rsi:.1f}.")

            if macd > macd_signal:
                explanations.append("MACD shows a bullish crossover on the chart.")
            else:
                explanations.append("MACD shows a bearish crossover on the chart.")

            if sma_10 > sma_30:
                explanations.append("Short-term moving average is above long-term moving average.")
            else:
                explanations.append("Short-term moving average is below long-term moving average.")

            # ── 6. ML Model Inference on Reconstructed Data ────────────
            use_fallback = (self.model is None or self.scaler is None)
            if use_fallback:
                ml_prob = [0.33, 0.34, 0.33]  # Neutral default
                ml_pred_class = 1
            else:
                X = latest_features[self.features]
                X_scaled = self.scaler.transform(X)
                ml_pred_class = int(self.model.predict(X_scaled)[0])
                ml_prob = self.model.predict_proba(X_scaled)[0].tolist()

            # Mapping class: 0: Bearish, 1: Neutral, 2: Bullish
            # Scale to -1 (Bearish) ... +1 (Bullish)
            ml_score = ml_prob[2] - ml_prob[0]

            # ── 7. Candlestick Pattern Recognition ────────────────────
            pattern_score, pattern_exps = self._detect_candlestick_patterns(candles)
            explanations.extend(pattern_exps)

            # ── 8. Overall price slope calculation ────────────────────
            x_arr = df_recon['x'].values
            y_arr = df_recon['Close'].values
            
            # Simple regression slope over entire chart
            slope, _ = np.polyfit(x_arr, y_arr, 1)
            norm_slope = slope * (cw / ch)
            slope_score = max(-1.0, min(1.0, norm_slope * 10))

            # ── 9. Weighted Ensemble Blend ────────────────────────────
            # Combine ML classifier (45%), Candlestick patterns (30%), overall slope (25%)
            if is_candle:
                blended = (0.45 * ml_score) + (0.30 * pattern_score) + (0.25 * slope_score)
            else:
                blended = (0.70 * ml_score) + (0.30 * slope_score)

            # ── 10. Classification and Confidence ─────────────────────
            THR = 0.08
            if blended > THR:
                prediction = "Bullish"
                confidence = min(95.0, 52.0 + abs(blended) * 55)
            elif blended < -THR:
                prediction = "Bearish"
                confidence = min(95.0, 52.0 + abs(blended) * 55)
            else:
                prediction = "Neutral"
                confidence = 50.0 + (1.0 - abs(blended) / THR) * 12.0

            # ── 11. Trend-change Warning ──────────────────────────────
            # Calculate recent slope (last 30%)
            r_cut = int(len(x_arr) * 0.70)
            x_rec, y_rec = x_arr[r_cut:], y_arr[r_cut:]
            slope_r, _ = np.polyfit(x_rec, y_rec, 1) if len(x_rec) >= 4 else (slope, 0)
            norm_slope_recent = slope_r * (cw / ch)

            if prediction == "Bullish" and norm_slope_recent < -0.03:
                change_prediction = "Momentum is fading on recent candles. Watch for a bearish reversal soon."
                change_days = 2
            elif prediction == "Bearish" and norm_slope_recent > 0.03:
                change_prediction = "Selling pressure is easing on recent candles. A bullish recovery is approaching."
                change_days = 2
            elif prediction == "Neutral":
                change_prediction = "Market is consolidating. Expect a directional breakout soon."
                change_days = 3
            else:
                change_prediction = "The trend is strong and expected to continue."
                change_days = max(3, int(12 - abs(blended) * 20))

            # Format data to return
            traced_data = [{"x": float(c["x"]), "y": float(c["Close"])} for c in candles]

            return {
                "success":          True,
                "prediction":       prediction,
                "confidence":       float(confidence),
                "slope":            float(norm_slope),
                "recentSlope":      float(norm_slope_recent),
                "changePrediction": change_prediction,
                "changeDaysApprox": change_days,
                "pointsTraced":     len(traced_data),
                "tracedData":       traced_data[:60],
                "analysisMode":     "candlestick" if is_candle else "line",
                "explanations":     explanations
            }

        except Exception as e:
            return {"success": False, "error": f"Computer vision analysis failed: {str(e)}"}

    def _detect_candlestick_patterns(self, candles):
        """Detects standard high-probability candlestick patterns."""
        if len(candles) < 3:
            return 0.0, []
            
        explanations = []
        score = 0.0
        
        c1, c2, c3 = candles[-3], candles[-2], candles[-1]
        
        body_size = abs(c3['Close'] - c3['Open'])
        total_range = max(c3['High'] - c3['Low'], 1e-5)
        is_doji = (body_size / total_range) < 0.1
        
        lower_shadow = min(c3['Open'], c3['Close']) - c3['Low']
        upper_shadow = c3['High'] - max(c3['Open'], c3['Close'])
        
        is_hammer = (lower_shadow > 2.0 * body_size) and (upper_shadow < 0.2 * total_range) and (c3['Close'] > c3['Open'])
        is_shooting_star = (upper_shadow > 2.0 * body_size) and (lower_shadow < 0.2 * total_range) and (c3['Close'] < c3['Open'])
        
        is_bullish_engulfing = (c2['color'] == 'red') and (c3['color'] == 'green') and \
                                (c3['Close'] > c2['Open']) and (c3['Open'] < c2['Close'])
                                
        is_bearish_engulfing = (c2['color'] == 'green') and (c3['color'] == 'red') and \
                                (c3['Close'] < c2['Open']) and (c3['Open'] > c2['Close'])
                                
        is_morning_star = (c1['color'] == 'red') and (abs(c1['Close'] - c1['Open']) > 0.4 * (c1['High'] - c1['Low'])) and \
                          (abs(c2['Close'] - c2['Open']) < 0.2 * (c2['High'] - c2['Low'])) and \
                          (c3['color'] == 'green') and (c3['Close'] > (c1['Open'] + c1['Close']) / 2)

        is_evening_star = (c1['color'] == 'green') and (abs(c1['Close'] - c1['Open']) > 0.4 * (c1['High'] - c1['Low'])) and \
                          (abs(c2['Close'] - c2['Open']) < 0.2 * (c2['High'] - c2['Low'])) and \
                          (c3['color'] == 'red') and (c3['Close'] < (c1['Open'] + c1['Close']) / 2)

        if is_morning_star:
            score += 0.4
            explanations.append("Morning Star pattern detected (strong bullish reversal signal).")
        elif is_evening_star:
            score -= 0.4
            explanations.append("Evening Star pattern detected (strong bearish reversal signal).")
            
        if is_bullish_engulfing:
            score += 0.3
            explanations.append("Bullish Engulfing pattern detected (bullish trend breakout).")
        elif is_bearish_engulfing:
            score -= 0.3
            explanations.append("Bearish Engulfing pattern detected (bearish trend breakdown).")
            
        if is_hammer:
            score += 0.25
            explanations.append("Hammer candle detected (bullish price rejection).")
        elif is_shooting_star:
            score -= 0.25
            explanations.append("Shooting Star candle detected (bearish price rejection).")
            
        if is_doji:
            explanations.append("Doji candle detected (market consolidation/indecision).")
            
        return score, explanations
