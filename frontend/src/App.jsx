import React, { useState, useEffect } from 'react';
import ParticlesBg from './components/ParticlesBg';
import Dashboard from './components/Dashboard';
import { LineChart, ImageIcon, Cpu, CheckCircle2, Activity, TrendingUp, TrendingDown, Eye, Layers, ChevronRight, X } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

// Iconic Swedish Ghost Squadron badge (Koenigsegg hypercar brand mark)
const GhostIcon = ({ className, style }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={className} 
    style={{ width: '32px', height: '32px', fill: 'currentColor', transition: 'all 0.3s', ...style }}
  >
    <path d="M50 12C30 12 18 28 18 48C18 57 21 68 26 75C28 77 30 78 32 78C35 78 37 75 38 71C40 66 43 62 46 61C47 61 48 62 49 63C50 64 50 64 51 63C52 62 53 61 54 61C57 62 60 66 62 71C63 75 65 78 68 78C70 78 72 77 74 75C79 68 82 57 82 48C82 28 70 12 50 12ZM38 40C38 37 40 35 43 35C46 35 48 37 48 40C48 43 46 45 43 45C40 45 38 43 38 40ZM58 40C58 37 60 35 63 35C66 35 68 37 68 40C68 43 66 45 63 45C60 45 58 43 58 40Z" />
  </svg>
);

function App() {
  const [activeModal, setActiveModal] = useState(null); // null | 'live' | 'screenshot' | 'highlights' | 'speculator'
  const [trainingStatus, setTrainingStatus] = useState('idle'); // 'idle' | 'training' | 'completed'
  const [backendHealth, setBackendHealth] = useState(null);
  
  // Market states
  const [marketData, setMarketData] = useState(null);
  const [speculatorTab, setSpeculatorTab] = useState('1W'); // '1W' | '1M' | '1Y' | '10Y'
  const [speculatorPrices, setSpeculatorPrices] = useState({});
  const [speculatorLoading, setSpeculatorLoading] = useState(false);

  // Mouse coordinates tracker
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fetch initial calibration details
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_BASE}/health`);
        const json = await response.json();
        setBackendHealth(json);
      } catch (err) {
        console.warn('Backend not yet reachable:', err);
      }
    };
    checkBackend();
  }, []);

  // Fetch general NSE market gainers/losers
  const fetchMarketData = async () => {
    try {
      const response = await fetch(`${API_BASE}/market/gainers-losers`);
      const json = await response.json();
      if (json.success) {
        setMarketData(json);
      }
    } catch (err) {
      console.warn('Failed to fetch market data:', err);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  // Define recommendations dictionary
  const recommendations = {
    '1W': [
      { symbol: 'TITAGARH', name: 'Titagarh Rail Systems', target: 'Bullish', rationale: 'Strong technical momentum, RSI rebound & volume breakout. Ideal for 1-week tactical long setups.' },
      { symbol: 'TATAMOTORS', name: 'Tata Motors', target: 'Bullish', rationale: 'Moving averages indicate a bullish crossover on daily intervals. Strong short-term buying accumulation.' }
    ],
    '1M': [
      { symbol: 'SBIN', name: 'State Bank of India', target: 'Bullish', rationale: 'Price consolidating near structural support. Low volatility bands suggest a major swing breakout soon.' },
      { symbol: 'LT', name: 'Larsen & Toubro', target: 'Bullish', rationale: 'Steady volume accumulation and support at the 30-day SMA. Prime pick for a 4-week swing trade.' }
    ],
    '1Y': [
      { symbol: 'RELIANCE', name: 'Reliance Industries', target: 'Bullish', rationale: 'Scale-invariant projections suggest long-term consolidation breaks, pointing to target gains on 1-year horizons.' },
      { symbol: 'INFY', name: 'Infosys Limited', target: 'Bullish', rationale: 'Indicator metrics suggest standard valuation discount. Target recovery projected on a 12-month sequence.' }
    ],
    '10Y': [
      { symbol: 'TCS', name: 'Tata Consultancy Services', target: 'Bullish', rationale: 'Industry leader with high return on equity and consistent compounding yield. Foundational defensive reserve.' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank', target: 'Bullish', rationale: 'Dominant credit market share and core capitalization make this the ultimate generational banking reserve.' },
      { symbol: 'ITC', name: 'ITC Limited', target: 'Bullish', rationale: 'Resilient cash flow model and defensive pricing telemetry represent a reliable compounding anchor for a decade.' }
    ]
  };

  // Fetch speculator batch prices
  const fetchSpeculatorPrices = async (tab) => {
    const list = recommendations[tab].map(r => r.symbol).join(',');
    setSpeculatorLoading(true);
    try {
      const response = await fetch(`${API_BASE}/market/batch?symbols=${list}`);
      const json = await response.json();
      if (json.success) {
        setSpeculatorPrices(prev => ({ ...prev, ...json.data }));
      }
    } catch (err) {
      console.warn('Failed to fetch batch prices:', err);
    } finally {
      setSpeculatorLoading(false);
    }
  };

  useEffect(() => {
    if (activeModal === 'speculator') {
      fetchSpeculatorPrices(speculatorTab);
    }
  }, [activeModal, speculatorTab]);

  const triggerTraining = async () => {
    setTrainingStatus('training');
    try {
      const response = await fetch(`${API_BASE}/train`, { method: 'POST' });
      const json = await response.json();
      if (json.status === 'training_started') {
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          try {
            const res = await fetch(`${API_BASE}/health`);
            const hData = await res.json();
            if (hData.model_status === 'trained' || attempts > 20) {
              setBackendHealth(hData);
              setTrainingStatus('completed');
              clearInterval(interval);
            }
          } catch (e) {
            console.error('Error polling training:', e);
          }
        }, 5000);
      }
    } catch (err) {
      console.error('Failed to trigger training:', err);
      setTrainingStatus('idle');
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100vw', overflowX: 'hidden' }}>
      {/* Floating HUD Telemetry Cursor Tag */}
      <div className="cursor-telemetry-tag" style={{ left: mousePos.x, top: mousePos.y }}>
        X: {mousePos.x}px | Y: {mousePos.y}px <br />
        SYS_STATUS: CONNECTED <br />
        ACTIVE_HUD: {activeModal ? activeModal.toUpperCase() : 'STANDBY'}
      </div>

      {/* Dynamic particles Reacting to Cursor */}
      <ParticlesBg />

      {/* Main Container */}
      <main style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Navigation / Top Bar */}
        <header style={{ 
          padding: '24px 40px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(5, 6, 8, 0.4)',
          backdropFilter: 'blur(16px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveModal(null)}>
            <GhostIcon style={{ color: 'var(--secondary)' }} />
            <span className="tech-label" style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>
              ANTIGRAVITY.TELEMETRY
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {trainingStatus === 'training' && (
              <span className="tech-label" style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="animate-float" style={{ display: 'inline-block' }}>⚙️</span> CALIBRATING CORE...
              </span>
            )}
            {trainingStatus === 'completed' && (
              <span className="tech-label" style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px' }} /> CALIBRATION COMPLETE
              </span>
            )}
            {backendHealth && backendHealth.model_status === 'not_trained (using fallback rules)' && trainingStatus === 'idle' && (
              <button 
                onClick={triggerTraining} 
                className="glass-btn" 
                style={{ padding: '8px 16px', fontSize: '0.75rem', borderColor: 'var(--secondary)' }}
              >
                <Cpu style={{ width: '14px', height: '14px', color: 'var(--secondary)' }} />
                CALIBRATE ML CORE
              </button>
            )}
          </div>
        </header>

        {/* Cockpit Landing Panel */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '60px 20px', 
          position: 'relative'
        }}>
          
          {/* Huge low opacity Ghost logo as background watermark */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 0,
            pointerEvents: 'none',
            opacity: 0.012,
            color: '#ffffff'
          }}>
            <GhostIcon style={{ width: '450px', height: '450px' }} />
          </div>

          <div className="animate-fade-in" style={{ zIndex: 1, maxWidth: '850px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ 
              padding: '8px 18px', 
              background: 'rgba(255, 255, 255, 0.01)', 
              border: '1px solid var(--border-color)',
              borderRadius: '2px',
              marginBottom: '30px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Cpu style={{ width: '14px', height: '14px', color: 'var(--secondary)' }} />
              <span className="tech-label" style={{ fontSize: '0.7rem' }}>HIGH-PERFORMANCE MODEL CONSOLE</span>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: '3.6rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px', fontFamily: 'Outfit', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              HUD TELEMETRY COCKPIT. <br />
              <span className="gradient-text">ACTIVATE CONSOLE MODULE.</span>
            </h1>
            
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '1.05rem', 
              maxWidth: '600px', 
              lineHeight: 1.6, 
              marginBottom: '50px',
              fontWeight: 500
            }}>
              Deploy floating diagnostic overlays. Analyze live Indian market pricing, compile CV pixel coordinate shapes, or review predictive recommendations calibrated by ML horizons.
            </p>

            {/* Modular Cockpit Console Dials */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px', 
              width: '100%', 
              maxWidth: '820px',
            }}>
              
              {/* Dial 1: Live Ticker Telemetry */}
              <div 
                className="glass-panel" 
                onClick={() => setActiveModal('live')}
                style={{ 
                  padding: '30px 24px', 
                  cursor: 'pointer', 
                  textAlign: 'left',
                  borderLeft: '2px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <LineChart style={{ color: 'var(--secondary)', width: '22px', height: '22px' }} />
                  <ChevronRight style={{ color: 'var(--text-muted)', width: '16px', height: '16px' }} />
                </div>
                <h3 className="tech-label" style={{ fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Live Ticker Diagnostic
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                  Ingest spot values for NSE listings (TCS, TITAGARH). Evaluates scale-invariant indicators and Random Forest classes.
                </p>
              </div>

              {/* Dial 2: Vision Graphics Scanner */}
              <div 
                className="glass-panel" 
                onClick={() => setActiveModal('screenshot')}
                style={{ 
                  padding: '30px 24px', 
                  cursor: 'pointer', 
                  textAlign: 'left',
                  borderLeft: '2px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <ImageIcon style={{ color: 'var(--secondary)', width: '22px', height: '22px' }} />
                  <ChevronRight style={{ color: 'var(--text-muted)', width: '16px', height: '16px' }} />
                </div>
                <h3 className="tech-label" style={{ fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Vision System Diagnostic
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                  Scan chart image wicks and contour matrices. Segment daily price levels using custom computer vision filters.
                </p>
              </div>

              {/* Dial 3: Today's Market Highlights */}
              <div 
                className="glass-panel" 
                onClick={() => { setActiveModal('highlights'); fetchMarketData(); }}
                style={{ 
                  padding: '30px 24px', 
                  cursor: 'pointer', 
                  textAlign: 'left',
                  borderLeft: '2px solid var(--secondary)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <Activity style={{ color: 'var(--secondary)', width: '22px', height: '22px' }} />
                  <ChevronRight style={{ color: 'var(--text-muted)', width: '16px', height: '16px' }} />
                </div>
                <h3 className="tech-label" style={{ fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Market Performance Highlights
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                  Telemetry display of today's highest gainers and losers in the Indian market. Scans active trend metrics.
                </p>
              </div>

              {/* Dial 4: Predictive Stock Speculator */}
              <div 
                className="glass-panel" 
                onClick={() => setActiveModal('speculator')}
                style={{ 
                  padding: '30px 24px', 
                  cursor: 'pointer', 
                  textAlign: 'left',
                  borderLeft: '2px solid var(--secondary)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <Layers style={{ color: 'var(--secondary)', width: '22px', height: '22px' }} />
                  <ChevronRight style={{ color: 'var(--text-muted)', width: '16px', height: '16px' }} />
                </div>
                <h3 className="tech-label" style={{ fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Predictive Speculator Model
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                  Investment suggestion console. Evaluates support levels and projects targets across multi-time horizons.
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* MODAL 1: Live Telemetry Modal */}
        {activeModal === 'live' && (
          <div className="hud-modal-overlay">
            <div className="hud-modal-content">
              <div style={{ padding: '20px 40px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0c0f' }}>
                <span className="tech-label" style={{ fontSize: '0.8rem' }}>MODULE: LIVE TELEMETRY</span>
                <button className="glass-btn" style={{ padding: '6px 12px', fontSize: '0.7rem' }} onClick={() => setActiveModal(null)}>
                  <X style={{ width: '14px', height: '14px' }} /> CLOSE [ESC]
                </button>
              </div>
              <div style={{ padding: '40px', background: '#07090b' }}>
                <Dashboard mode="live" onBack={() => setActiveModal(null)} />
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: Vision Telemetry Modal */}
        {activeModal === 'screenshot' && (
          <div className="hud-modal-overlay">
            <div className="hud-modal-content">
              <div style={{ padding: '20px 40px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0c0f' }}>
                <span className="tech-label" style={{ fontSize: '0.8rem' }}>MODULE: VISION SCANNER</span>
                <button className="glass-btn" style={{ padding: '6px 12px', fontSize: '0.7rem' }} onClick={() => setActiveModal(null)}>
                  <X style={{ width: '14px', height: '14px' }} /> CLOSE [ESC]
                </button>
              </div>
              <div style={{ padding: '40px', background: '#07090b' }}>
                <Dashboard mode="screenshot" onBack={() => setActiveModal(null)} />
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: Market Highlights Overlay */}
        {activeModal === 'highlights' && (
          <div className="hud-modal-overlay">
            <div className="hud-modal-content" style={{ maxWidth: '800px' }}>
              <div style={{ padding: '20px 40px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0c0f' }}>
                <span className="tech-label" style={{ fontSize: '0.8rem' }}>MODULE: MARKET HIGHLIGHTS</span>
                <button className="glass-btn" style={{ padding: '6px 12px', fontSize: '0.7rem' }} onClick={() => setActiveModal(null)}>
                  <X style={{ width: '14px', height: '14px' }} /> CLOSE [ESC]
                </button>
              </div>
              <div style={{ padding: '40px', background: '#07090b', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <Activity style={{ width: '16px', height: '16px', color: 'var(--secondary)' }} />
                  <span className="tech-label" style={{ fontSize: '0.85rem' }}>TODAY'S MARKET LEADERBOARD (NSE)</span>
                </div>

                {!marketData ? (
                  <p className="tech-value" style={{ textAlign: 'center', padding: '30px' }}>FETCHING TELEMETRY PRICE STREAM...</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }} className="responsive-grid">
                    
                    {/* Top Performers */}
                    <div className="glass-panel" style={{ padding: '24px', background: 'rgba(10,12,16,0.3)' }}>
                      <h4 className="tech-label" style={{ color: 'var(--bullish)', fontSize: '0.75rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp style={{ width: '14px', height: '14px' }} /> TOP PERFORMERS
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {marketData.gainers.map((gainer, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                            <span className="tech-value" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{gainer.symbol}</span>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'baseline' }}>
                              <span className="tech-value" style={{ fontSize: '0.85rem' }}>₹{gainer.price.toFixed(2)}</span>
                              <span className="tech-value" style={{ fontSize: '0.75rem', color: 'var(--bullish)', fontWeight: 700 }}>+{gainer.change_pct.toFixed(2)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Under Performers */}
                    <div className="glass-panel" style={{ padding: '24px', background: 'rgba(10,12,16,0.3)' }}>
                      <h4 className="tech-label" style={{ color: 'var(--bearish)', fontSize: '0.75rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingDown style={{ width: '14px', height: '14px' }} /> UNDER PERFORMERS
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {marketData.losers.map((loser, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                            <span className="tech-value" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{loser.symbol}</span>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'baseline' }}>
                              <span className="tech-value" style={{ fontSize: '0.85rem' }}>₹{loser.price.toFixed(2)}</span>
                              <span className="tech-value" style={{ fontSize: '0.75rem', color: 'var(--bearish)', fontWeight: 700 }}>{loser.change_pct.toFixed(2)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: Predictive Speculator Overlay */}
        {activeModal === 'speculator' && (
          <div className="hud-modal-overlay">
            <div className="hud-modal-content" style={{ maxWidth: '820px' }}>
              <div style={{ padding: '20px 40px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0c0f' }}>
                <span className="tech-label" style={{ fontSize: '0.8rem' }}>MODULE: PREDICTIVE SPECULATOR</span>
                <button className="glass-btn" style={{ padding: '6px 12px', fontSize: '0.7rem' }} onClick={() => setActiveModal(null)}>
                  <X style={{ width: '14px', height: '14px' }} /> CLOSE [ESC]
                </button>
              </div>
              <div style={{ padding: '40px', background: '#07090b', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                
                {/* Horizon Tab Controls */}
                <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
                  {['1W', '1M', '1Y', '10Y'].map((tab) => {
                    const labelMap = { '1W': '1 WEEK (MOMENTUM)', '1M': '1 MONTH (SWING)', '1Y': '1 YEAR (GROWTH)', '10Y': '10 YEARS (BLUE CHIP)' };
                    const isActive = speculatorTab === tab;
                    return (
                      <button 
                        key={tab} 
                        onClick={() => setSpeculatorTab(tab)} 
                        className="glass-btn"
                        style={{ 
                          padding: '10px 16px', 
                          fontSize: '0.75rem', 
                          borderColor: isActive ? 'var(--secondary)' : 'var(--border-color)',
                          color: isActive ? 'var(--secondary)' : 'var(--text-secondary)',
                          background: isActive ? 'rgba(223, 183, 108, 0.03)' : 'transparent'
                        }}
                      >
                        {labelMap[tab]}
                      </button>
                    );
                  })}
                </div>

                {/* Speculator Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <Layers style={{ width: '16px', height: '16px', color: 'var(--secondary)' }} />
                    <span className="tech-label" style={{ fontSize: '0.8rem' }}>Curated Technical Recommendations</span>
                  </div>

                  {speculatorLoading && Object.keys(speculatorPrices).length === 0 ? (
                    <p className="tech-value" style={{ textAlign: 'center', padding: '30px' }}>RUNNING TARGET PROJECTIONS...</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {recommendations[speculatorTab].map((rec, index) => {
                        const priceInfo = speculatorPrices[rec.symbol];
                        return (
                          <div key={index} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(10,12,16,0.3)', borderLeft: '3px solid var(--secondary)' }}>
                            
                            {/* Symbol Name Price Block */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                              <div>
                                <h3 className="tech-value" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--secondary)' }}>{rec.symbol}</h3>
                                <span className="tech-label" style={{ fontSize: '0.65rem' }}>{rec.name}</span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                {priceInfo ? (
                                  <>
                                    <h4 className="tech-value" style={{ fontSize: '1.25rem' }}>₹{priceInfo.price.toFixed(2)}</h4>
                                    <span className="tech-value" style={{ fontSize: '0.75rem', color: priceInfo.change >= 0 ? 'var(--bullish)' : 'var(--bearish)', fontWeight: 700 }}>
                                      {priceInfo.change >= 0 ? '+' : ''}{priceInfo.change_pct.toFixed(2)}% TODAY
                                    </span>
                                  </>
                                ) : (
                                  <span className="tech-value" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>FETCHING QUOTE...</span>
                                )}
                              </div>
                            </div>

                            {/* Classification and Rationale */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '20px' }} className="responsive-grid">
                              <div style={{ padding: '10px', background: '#07090b', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRadius: '2px' }}>
                                <span className="tech-label" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>DIAG_RESULT</span>
                                <span className="tech-value" style={{ color: 'var(--bullish)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                  <Eye style={{ width: '12px', height: '12px' }} /> {rec.target.toUpperCase()}
                                </span>
                              </div>
                              <p className="tech-value" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                {rec.rationale}
                              </p>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer style={{ 
          padding: '24px 40px', 
          textAlign: 'center', 
          borderTop: '1px solid var(--border-color)',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          background: 'rgba(5, 6, 8, 0.4)',
          fontWeight: 700,
          fontFamily: 'Outfit',
          letterSpacing: '0.1em'
        }}>
          ANTIGRAVITY TELEMETRY SYSTEMS • POWERED BY FASTAPI, REACT & RANDOM FOREST CLASSIFIERS
        </footer>
      </main>
    </div>
  );
}

export default App;
