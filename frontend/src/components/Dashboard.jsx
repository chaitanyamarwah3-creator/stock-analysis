import React, { useState, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Upload, 
  Activity, 
  Clock, 
  ArrowLeft, 
  AlertCircle, 
  Image as ImageIcon,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const API_BASE = 'http://127.0.0.1:8000/api';

const Dashboard = ({ mode, onBack }) => {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  // Drag and drop / file upload state
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Search Live Stock Ticker
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!ticker.trim()) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      const response = await fetch(`${API_BASE}/predict/live?symbol=${ticker.trim()}`);
      const json = await response.json();
      
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || 'Failed to fetch prediction. Verify ticker.');
      }
    } catch (err) {
      setError('Connection to backend failed. Make sure FastAPI server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop event handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, JPEG).');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
    setData(null);
  };

  const uploadScreenshot = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError('');
    setData(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_BASE}/predict/screenshot`, {
        method: 'POST',
        body: formData,
      });
      const json = await response.json();

      if (json.success) {
        setData(json);
      } else {
        setError(json.error || 'Computer Vision failed to extract trend from image.');
      }
    } catch (err) {
      setError('Backend error. Make sure FastAPI server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  // Render prediction badge
  const renderPredictionBadge = (prediction, confidence) => {
    const isBullish = prediction === 'Bullish';
    const isBearish = prediction === 'Bearish';
    
    let className = 'neutral-text';
    let label = 'NEUTRAL RANGE';
    let Icon = HelpCircle;
    let bgStyle = { boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 15px rgba(0, 180, 216, 0.1)', border: '1px solid var(--neutral)' };

    if (isBullish) {
      className = 'bullish-text';
      label = 'BULLISH SIGNAL';
      Icon = TrendingUp;
      bgStyle = { boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 15px rgba(207, 162, 82, 0.15)', border: '1px solid var(--secondary)' };
    } else if (isBearish) {
      className = 'bearish-text';
      label = 'BEARISH PRESSURE';
      Icon = TrendingDown;
      bgStyle = { boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 15px rgba(255, 51, 75, 0.15)', border: '1px solid var(--bearish)' };
    }

    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', minWidth: '280px', ...bgStyle }}>
        <Icon style={{ width: '48px', height: '48px', marginBottom: '12px' }} className={className} />
        <h4 style={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Telemetry Status</h4>
        <h2 style={{ fontSize: '2.1rem', fontWeight: 800, margin: '10px 0', fontFamily: 'Outfit' }} className={className}>
          {label}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{confidence.toFixed(1)}%</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', letterSpacing: '1px', fontFamily: 'Outfit' }}>Confidence Matrix</span>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '35px' }}>
        <button className="glass-btn" onClick={onBack} style={{ padding: '10px' }}>
          <ArrowLeft style={{ width: '20px', height: '20px' }} />
        </button>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.4rem', fontWeight: 900 }}>
            {mode === 'live' ? 'Performance Diagnostic' : 'Vision System Input'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {mode === 'live' 
              ? 'Stream live market telemetry and process technical vectors through the Random Forest Classifier' 
              : 'Ingest chart graphics. The vision engine maps candlestick parameters, computes pixel offsets, and scores wicks.'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Interaction Panel */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          {mode === 'live' ? (
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', width: '20px', height: '20px' }} />
                <input 
                  type="text" 
                  placeholder="Enter NSE Ticker (e.g. RELIANCE, TCS, TITAGARH, SBIN)..." 
                  className="glass-input" 
                  style={{ width: '100%', paddingLeft: '50px' }}
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button type="submit" className="glass-btn glass-btn-primary" disabled={loading}>
                {loading ? 'Analyzing...' : 'RUN DIAGNOSTIC'}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div 
                className="glass-panel" 
                style={{ 
                  border: `2px dashed ${dragActive ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                  background: dragActive ? 'rgba(0, 242, 254, 0.05)' : 'rgba(2, 6, 23, 0.4)',
                  borderRadius: '12px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
              >
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange}
                  accept="image/*"
                />
                
                {previewUrl ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                    <img 
                      src={previewUrl} 
                      alt="Chart preview" 
                      style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} 
                    />
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{selectedFile.name}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <ImageIcon style={{ width: '36px', height: '36px', color: 'var(--primary)' }} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Drag and drop your screenshot here</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>or click to browse from files (PNG, JPG, JPEG)</p>
                  </div>
                )}
              </div>

              {selectedFile && (
                <button 
                  className="glass-btn glass-btn-primary" 
                  onClick={uploadScreenshot}
                  disabled={loading}
                  style={{ alignSelf: 'flex-end' }}
                >
                  {loading ? 'Processing Image...' : 'Run Computer Vision Predictor'}
                </button>
              )}
            </div>
          )}

          {error && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              marginTop: '20px', 
              padding: '16px', 
              background: 'rgba(244, 63, 94, 0.08)', 
              border: '1px solid rgba(244, 63, 94, 0.15)',
              borderRadius: '10px',
              color: 'var(--bearish)'
            }}>
              <AlertCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
              <span style={{ fontSize: '0.9rem' }}>{error}</span>
            </div>
          )}
        </div>

        {/* Results Presentation Panel */}
        {loading && (
          <div className="glass-panel" style={{ padding: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div className="animate-float" style={{ padding: '15px', background: 'rgba(0, 242, 254, 0.05)', borderRadius: '50%', border: '1px solid rgba(0, 242, 254, 0.15)' }}>
              <Activity style={{ width: '40px', height: '40px', color: 'var(--primary)' }} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Running Prediction Algorithms...</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '350px', textAlign: 'center' }}>
              {mode === 'live' 
                ? 'Pulling data from yfinance, engineering indicators and evaluating Random Forest rules.'
                : 'Converting pixels, applying contours extraction and measuring linear regression slopes.'}
            </p>
          </div>
        )}

        {data && !loading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
            
            {/* Top Stats Overview */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              {renderPredictionBadge(data.prediction, data.confidence)}
              
              <div className="glass-panel" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <Clock style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontWeight: 800, letterSpacing: '1px', fontSize: '0.8rem', fontFamily: 'Outfit' }}>NEXT SHIFT</span>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0', fontFamily: 'Syne' }}>
                  ~{data.changeDaysApprox} Market Days
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {mode === 'live' 
                    ? 'Time left before indicators cross over and the vibe changes.'
                    : data.changePrediction}
                </p>
              </div>

              {mode === 'live' && (
                <div className="glass-panel" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '240px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px', fontFamily: 'Outfit' }}>SPOT PRICE ({data.symbol})</span>
                  <h3 style={{ fontSize: '2rem', fontWeight: 900, margin: '4px 0', fontFamily: 'Syne', color: 'var(--primary)' }}>
                    ₹{data.currentPrice.toFixed(2)}
                  </h3>
                  <span style={{ 
                    fontSize: '1rem', 
                    fontWeight: 700, 
                    color: data.priceChange >= 0 ? 'var(--bullish)' : 'var(--bearish)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {data.priceChange >= 0 ? '+' : ''}₹{data.priceChange.toFixed(2)} ({data.priceChangePct.toFixed(2)}%)
                  </span>
                </div>
              )}
            </div>

            {/* Visual Charts & In-depth breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr lg:3fr', gap: '30px' }} className="responsive-grid">
              
              {/* Chart Block */}
              {mode === 'live' && data.chartData && (
                <div className="glass-panel" style={{ padding: '24px', gridColumn: 'span 2' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>30-Day Historical Trend & Indicators</h3>
                  <div style={{ width: '100%', height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.chartData}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={data.prediction === 'Bullish' ? 'var(--bullish)' : 'var(--bearish)'} stopOpacity={0.25}/>
                            <stop offset="95%" stopColor={data.prediction === 'Bullish' ? 'var(--bullish)' : 'var(--bearish)'} stopOpacity={0.01}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                        <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" fontSize={11} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(7, 10, 19, 0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                          labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke={data.prediction === 'Bullish' ? 'var(--bullish)' : 'var(--bearish)'} 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorPrice)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Technical / CV metrics */}
              <div className="glass-panel" style={{ padding: '24px', gridColumn: 'span 2' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '15px', fontFamily: 'Outfit', letterSpacing: '0.5px' }}>
                  {mode === 'live' ? 'CHART RECEIPTS 🧾' : 'PIXEL VISION SCAN 🔮'}
                </h3>
                
                {mode === 'live' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {data.explanations.map((exp, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `3px solid ${data.prediction === 'Bullish' ? 'var(--bullish)' : 'var(--bearish)'}` }}>
                        <CheckCircle style={{ width: '18px', height: '18px', color: data.prediction === 'Bullish' ? 'var(--bullish)' : 'var(--bearish)', marginTop: '2px', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{exp}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: '10px', padding: '16px', background: 'rgba(255, 0, 127, 0.03)', border: '2px solid rgba(255, 0, 127, 0.08)', borderRadius: '12px' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <strong>BRAIN COMPILATION 🧠:</strong> Random Forest model ran a full vibe check on historical charts to weigh up RSI, MACD crosses, and Bollinger Bands.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>SLOPE GRADIENT</span>
                        <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', fontFamily: 'Syne', color: 'var(--primary)' }}>{(data.slope * 45).toFixed(1)}°</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Mathematical slope coefficient normalized to width/height ratio.</p>
                      </div>
                      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>LATEST SWING</span>
                        <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', fontFamily: 'Syne', color: data.recentSlope >= 0 ? 'var(--bullish)' : 'var(--bearish)' }}>
                          {data.recentSlope >= 0 ? 'Upward' : 'Downward'}
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Slope measured over the final 20% interval of chart timeline.</p>
                      </div>
                      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>SAMPLED PIXELS</span>
                        <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', fontFamily: 'Syne', color: 'var(--primary)' }}>{data.pointsTraced} nodes</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Distinct horizontal coordinates evaluated by the OpenCV path scanner.</p>
                      </div>
                    </div>

                    {data.explanations && data.explanations.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '2px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', fontFamily: 'Outfit' }}>Parsed Chart Indicators & Patterns</h4>
                        {data.explanations.map((exp, index) => (
                          <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `3px solid ${data.prediction === 'Bullish' ? 'var(--bullish)' : 'var(--bearish)'}` }}>
                            <CheckCircle style={{ width: '18px', height: '18px', color: data.prediction === 'Bullish' ? 'var(--bullish)' : 'var(--bearish)', marginTop: '2px', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{exp}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
            
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
