import React, { useState, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Activity, 
  Clock, 
  ArrowLeft, 
  AlertCircle, 
  Image as ImageIcon,
  CheckCircle,
  HelpCircle,
  Cpu
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
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
    
    let colorClass = 'neutral-text';
    let label = 'NEUTRAL RANGE';
    let Icon = HelpCircle;
    let borderAccent = 'rgba(56, 189, 248, 0.4)'; // blue

    if (isBullish) {
      colorClass = 'bullish-text';
      label = 'BULLISH SIGNAL';
      Icon = TrendingUp;
      borderAccent = 'rgba(223, 183, 108, 0.5)'; // gold
    } else if (isBearish) {
      colorClass = 'bearish-text';
      label = 'BEARISH PRESSURE';
      Icon = TrendingDown;
      borderAccent = 'rgba(255, 56, 92, 0.5)'; // red
    }

    return (
      <div 
        className="glass-panel" 
        style={{ 
          padding: '30px 24px', 
          textAlign: 'center', 
          minWidth: '280px', 
          borderLeft: `3px solid ${borderAccent}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Icon style={{ width: '40px', height: '40px', marginBottom: '16px' }} className={colorClass} />
        <span className="tech-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Diagnostic Status</span>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '8px 0 16px 0', letterSpacing: '0.05em' }} className={colorClass}>
          {label}
        </h2>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span className="tech-value" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{confidence.toFixed(1)}%</span>
          <span className="tech-label" style={{ fontSize: '0.65rem' }}>Confidence Matrix</span>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '10px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
        <button className="glass-btn" onClick={onBack} style={{ padding: '10px' }}>
          <ArrowLeft style={{ width: '18px', height: '18px' }} />
        </button>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', fontWeight: 900 }}>
            {mode === 'live' ? 'Telemetry Diagnostics' : 'Vision Diagnostics'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            {mode === 'live' 
              ? 'Stream real-time Indian market data directly through the Random Forest Classifier.' 
              : 'Scan candlestick image coordinates. The cv2 path scanner maps price vectors and wick limits.'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Interaction Panel */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          {mode === 'live' ? (
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', width: '18px', height: '18px' }} />
                <input 
                  type="text" 
                  placeholder="Enter Ticker Symbol (e.g. TCS, RELIANCE, TITAGARH, SBIN)..." 
                  className="glass-input" 
                  style={{ width: '100%', paddingLeft: '50px' }}
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button type="submit" className="glass-btn glass-btn-primary" disabled={loading}>
                {loading ? 'CALCULATING...' : 'ENGAGE DIAGNOSTIC'}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div 
                className="glass-panel" 
                style={{ 
                  border: `1px dashed ${dragActive ? 'var(--secondary)' : 'var(--border-color)'}`,
                  background: dragActive ? 'rgba(223, 183, 108, 0.02)' : '#07090b',
                  borderRadius: '2px',
                  padding: '50px 20px',
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
                      style={{ maxHeight: '220px', maxWidth: '100%', borderRadius: '2px', border: '1px solid var(--border-color)' }} 
                    />
                    <p className="tech-value" style={{ fontSize: '0.85rem' }}>{selectedFile.name}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)' }}>
                      <ImageIcon style={{ width: '30px', height: '30px', color: 'var(--secondary)' }} />
                    </div>
                    <h3 className="tech-label" style={{ fontSize: '0.85rem' }}>DRAG AND DROP CHART TELEMETRY</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>or click to browse from local storage (PNG, JPG, JPEG)</p>
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
                  {loading ? 'SCANNING COORDINATES...' : 'ENGAGE VISION DETECTOR'}
                </button>
              )}
            </div>
          )}

          {error && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginTop: '20px', 
              padding: '16px', 
              background: 'rgba(255, 56, 92, 0.05)', 
              border: '1px solid rgba(255, 56, 92, 0.1)',
              borderRadius: '2px',
              color: 'var(--bearish)'
            }}>
              <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
              <span className="tech-value" style={{ fontSize: '0.85rem' }}>{error}</span>
            </div>
          )}
        </div>

        {/* Results Presentation Panel */}
        {loading && (
          <div className="glass-panel" style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div className="animate-float" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--secondary)' }}>
              <Activity style={{ width: '36px', height: '36px', color: 'var(--secondary)' }} />
            </div>
            <h3 className="tech-label" style={{ fontSize: '0.85rem' }}>PROCESSING TELEMETRY VECTOR FIELDS...</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '400px', textAlign: 'center', lineHeight: 1.6 }}>
              {mode === 'live' 
                ? 'Requesting NSE datasets, compiling rolling technical matrices, and performing classification runs.'
                : 'Mapping colored pixel matrices, extracting contours, and tracing trend coefficients.'}
            </p>
          </div>
        )}

        {data && !loading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
            
            {/* Top Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
              {renderPredictionBadge(data.prediction, data.confidence)}
              
              {/* Technical Specifications Sheet */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  <Cpu style={{ width: '16px', height: '16px', color: 'var(--secondary)' }} />
                  <span className="tech-label" style={{ fontSize: '0.75rem' }}>TELEMETRY VECTORS</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Symbol / Identifier */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                    <span className="tech-label" style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Identifier Ticker</span>
                    <span className="tech-value" style={{ fontWeight: 700 }}>{data.symbol || 'CV_INPUT'}</span>
                  </div>

                  {/* Spot Price */}
                  {mode === 'live' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                      <span className="tech-label" style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Spot Price</span>
                      <span className="tech-value" style={{ fontWeight: 700, color: 'var(--secondary)' }}>
                        ₹{data.currentPrice.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Price Change */}
                  {mode === 'live' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                      <span className="tech-label" style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Delta Delta</span>
                      <span className="tech-value" style={{ 
                        fontWeight: 700, 
                        color: data.priceChange >= 0 ? 'var(--bullish)' : 'var(--bearish)'
                      }}>
                        {data.priceChange >= 0 ? '+' : ''}₹{data.priceChange.toFixed(2)} ({data.priceChangePct.toFixed(2)}%)
                      </span>
                    </div>
                  )}

                  {/* Est Shift Time */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                    <span className="tech-label" style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Trend Duration</span>
                    <span className="tech-value" style={{ fontWeight: 700 }}>
                      ~{data.changeDaysApprox} Market Days
                    </span>
                  </div>
                  
                </div>
              </div>

              {/* Koenigsegg Squadron Notes / Trend Advice */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  <Clock style={{ width: '16px', height: '16px', color: 'var(--secondary)' }} />
                  <span className="tech-label" style={{ fontSize: '0.75rem' }}>SYSTEM SPECIFICATION</span>
                </div>
                <h4 className="tech-label" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Estimated Trend Calibration
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  {mode === 'live' 
                    ? 'Indicator crossover signals state boundary. Keep telemetry calibrated.'
                    : data.changePrediction}
                </p>
              </div>
            </div>

            {/* Visual Charts & In-depth breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
              
              {/* Chart Block */}
              {mode === 'live' && data.chartData && (
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 className="tech-label" style={{ fontSize: '0.85rem', marginBottom: '20px' }}>Telemetry Graphics (30-day index timeline)</h3>
                  <div style={{ width: '100%', height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.chartData}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={data.prediction === 'Bullish' ? 'var(--bullish)' : 'var(--bearish)'} stopOpacity={0.15}/>
                            <stop offset="95%" stopColor={data.prediction === 'Bullish' ? 'var(--bullish)' : 'var(--bearish)'} stopOpacity={0.00}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255, 255, 255, 0.015)" strokeDasharray="3 3" />
                        <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} tickLine={false} style={{ fontFamily: 'JetBrains Mono' }} />
                        <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} style={{ fontFamily: 'JetBrains Mono' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(5, 6, 8, 0.98)', border: '1px solid var(--border-color)', borderRadius: '2px' }}
                          labelStyle={{ color: 'var(--text-primary)', fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.8rem' }}
                          itemStyle={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke={data.prediction === 'Bullish' ? 'var(--bullish)' : 'var(--bearish)'} 
                          strokeWidth={1.5}
                          fillOpacity={1} 
                          fill="url(#colorPrice)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Technical / CV metrics */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 className="tech-label" style={{ fontSize: '0.85rem', marginBottom: '20px' }}>
                  {mode === 'live' ? 'DIAGNOSTIC CRITERIA MATRIX' : 'VISION SYSTEM SIGNAL PATH'}
                </h3>
                
                {mode === 'live' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {data.explanations.map((exp, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', background: '#07090b', borderLeft: `2px solid ${data.prediction === 'Bullish' ? 'var(--bullish)' : 'var(--bearish)'}` }}>
                        <CheckCircle style={{ width: '16px', height: '16px', color: data.prediction === 'Bullish' ? 'var(--bullish)' : 'var(--bearish)', marginTop: '2px', flexShrink: 0 }} />
                        <span className="tech-value" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{exp}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: '10px', padding: '16px', background: 'rgba(223, 183, 108, 0.01)', border: '1px solid var(--border-color)' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <strong>CALIBRATION RUN:</strong> Multi-layered Random Forest logic computed and scaled technical vectors (SMA/EMA ratios, MACD deviations, RSI limits) to yield this state classification.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                      <div style={{ padding: '18px', background: '#07090b', border: '1px solid var(--border-color)' }}>
                        <span className="tech-label" style={{ fontSize: '0.65rem' }}>SLOPE GRADIENT</span>
                        <h4 className="tech-value" style={{ fontSize: '1.4rem', fontWeight: 750, marginTop: '6px', color: 'var(--secondary)' }}>{(data.slope * 45).toFixed(1)}°</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>Mathematical slope coefficient normalized to width/height ratio.</p>
                      </div>
                      <div style={{ padding: '18px', background: '#07090b', border: '1px solid var(--border-color)' }}>
                        <span className="tech-label" style={{ fontSize: '0.65rem' }}>LATEST SWING</span>
                        <h4 className="tech-value" style={{ fontSize: '1.4rem', fontWeight: 750, marginTop: '6px', color: data.recentSlope >= 0 ? 'var(--bullish)' : 'var(--bearish)' }}>
                          {data.recentSlope >= 0 ? 'UPWARD' : 'DOWNWARD'}
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>Slope measured over the final 30% interval of chart timeline.</p>
                      </div>
                      <div style={{ padding: '18px', background: '#07090b', border: '1px solid var(--border-color)' }}>
                        <span className="tech-label" style={{ fontSize: '0.65rem' }}>SAMPLED COORDINATES</span>
                        <h4 className="tech-value" style={{ fontSize: '1.4rem', fontWeight: 750, marginTop: '6px' }}>{data.pointsTraced} NODES</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>Distinct horizontal coordinates evaluated by the OpenCV path scanner.</p>
                      </div>
                    </div>

                    {data.explanations && data.explanations.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        <h4 className="tech-label" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Parsed Chart Indicators & Patterns</h4>
                        {data.explanations.map((exp, index) => (
                          <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: '#07090b', borderLeft: `3px solid ${data.prediction === 'Bullish' ? 'var(--bullish)' : 'var(--bearish)'}` }}>
                            <CheckCircle style={{ width: '16px', height: '16px', color: data.prediction === 'Bullish' ? 'var(--bullish)' : 'var(--bearish)', marginTop: '2px', flexShrink: 0 }} />
                            <span className="tech-value" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{exp}</span>
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
