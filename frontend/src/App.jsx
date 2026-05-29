import React, { useState, useEffect } from 'react';
import ParticlesBg from './components/ParticlesBg';
import Dashboard from './components/Dashboard';
import { LineChart, ImageIcon, ShieldAlert, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

function App() {
  const [mode, setMode] = useState('landing'); // 'landing' | 'live' | 'screenshot'
  const [trainingStatus, setTrainingStatus] = useState('idle'); // 'idle' | 'training' | 'completed'
  const [backendHealth, setBackendHealth] = useState(null);

  // Check health and model status from backend on load
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

  const triggerTraining = async () => {
    setTrainingStatus('training');
    try {
      const response = await fetch(`${API_BASE}/train`, { method: 'POST' });
      const json = await response.json();
      if (json.status === 'training_started') {
        // Poll backend health for completion
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
      {/* Dynamic particles Reacting to Cursor */}
      <ParticlesBg />

      {/* Main Container */}
      <main style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Navigation / Top Bar */}
        <header style={{ 
          padding: '20px 40px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(2, 6, 23, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setMode('landing')}>
            <Sparkles style={{ color: 'var(--secondary)', width: '24px', height: '24px' }} />
            <span style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '2px', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>
              ANTIGRAVITY.TELEMETRY
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {trainingStatus === 'training' && (
              <span style={{ fontSize: '0.85rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <span className="animate-float" style={{ display: 'inline-block' }}>⚙️</span> Ingesting Datasets...
              </span>
            )}
            {trainingStatus === 'completed' && (
              <span style={{ fontSize: '0.85rem', color: 'var(--bullish)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <CheckCircle2 style={{ width: '14px', height: '14px' }} /> Calibration Complete
              </span>
            )}
            {backendHealth && backendHealth.model_status === 'not_trained (using fallback rules)' && trainingStatus === 'idle' && (
              <button 
                onClick={triggerTraining} 
                className="glass-btn" 
                style={{ padding: '8px 16px', fontSize: '0.8rem', borderColor: 'var(--secondary)' }}
              >
                <Cpu style={{ width: '14px', height: '14px', color: 'var(--secondary)' }} />
                Calibrate ML Core
              </button>
            )}
          </div>
        </header>

        {mode === 'landing' ? (
          /* Landing Screen */
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '40px 20px', 
            textAlign: 'center' 
          }}>
            <div className="animate-fade-in" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                padding: '12px 24px', 
                background: 'rgba(255, 255, 255, 0.02)', 
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 800,
                color: 'var(--text-secondary)',
                letterSpacing: '2px',
                marginBottom: '24px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'Outfit'
              }}>
                <Cpu style={{ width: '16px', height: '16px' }} />
                HIGH-PERFORMANCE MODEL DIAGNOSTIC
              </div>

              {/* Greeting */}
              <h1 style={{ fontSize: '3.8rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '20px', fontFamily: 'Outfit', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Model Diagnostic Systems. <br />
                <span className="gradient-text">Select Telemetry Mode.</span>
              </h1>
              
              <p style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '1.15rem', 
                maxWidth: '650px', 
                lineHeight: 1.6, 
                marginBottom: '45px',
                fontWeight: 500
              }}>
                Evaluate market vectors and technical trends. Ingest live ticker telemetry or stream chart graphics directly into the vision processing unit.
              </p>

              {/* Selector Cards */}
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                justifyContent: 'center', 
                gap: '24px', 
                width: '100%', 
                maxWidth: '720px' 
              }}>
                
                {/* Live Ticker Card */}
                <div 
                  className="glass-panel" 
                  onClick={() => setMode('live')}
                  style={{ 
                    flex: 1, 
                    minWidth: '280px', 
                    padding: '35px 30px', 
                    cursor: 'pointer', 
                    textAlign: 'left',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ 
                    position: 'absolute', 
                    top: '-50px', 
                    right: '-50px', 
                    width: '120px', 
                    height: '120px', 
                    background: 'radial-gradient(circle, var(--secondary-glow) 0%, rgba(0,0,0,0) 70%)',
                    pointerEvents: 'none'
                  }} />
                  
                  <div style={{ 
                    padding: '12px', 
                    background: 'rgba(255, 255, 255, 0.02)', 
                    borderRadius: '4px', 
                    width: 'fit-content',
                    border: '1px solid var(--border-color)',
                    marginBottom: '20px'
                  }}>
                    <LineChart style={{ color: 'var(--secondary)', width: '28px', height: '28px' }} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)', fontFamily: 'Outfit', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Live Ticker Telemetry
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    Stream spot prices for NSE listings (e.g. RELIANCE, TCS, TITAGARH). The ML classifier maps Moving Average slopes, MACD wicks, and RSI limits.
                  </p>
                </div>

                {/* Screenshot Card */}
                <div 
                  className="glass-panel" 
                  onClick={() => setMode('screenshot')}
                  style={{ 
                    flex: 1, 
                    minWidth: '280px', 
                    padding: '35px 30px', 
                    cursor: 'pointer', 
                    textAlign: 'left',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ 
                    position: 'absolute', 
                    top: '-50px', 
                    right: '-50px', 
                    width: '120px', 
                    height: '120px', 
                    background: 'radial-gradient(circle, var(--secondary-glow) 0%, rgba(0,0,0,0) 70%)',
                    pointerEvents: 'none'
                  }} />

                  <div style={{ 
                    padding: '12px', 
                    background: 'rgba(255, 255, 255, 0.02)', 
                    borderRadius: '4px', 
                    width: 'fit-content',
                    border: '1px solid var(--border-color)',
                    marginBottom: '20px'
                  }}>
                    <ImageIcon style={{ color: 'var(--secondary)', width: '28px', height: '28px' }} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)', fontFamily: 'Outfit', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Vision System Input
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    Ingest chart graphics. The vision engine segments candle parameters, computes pixel offsets, and scores wicks.
                  </p>
                </div>

              </div>
            </div>
          </div>
        ) : (
          /* Active Dashboard View */
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '40px 20px' }}>
            <Dashboard mode={mode} onBack={() => setMode('landing')} />
          </div>
        )}

        {/* Footer */}
        <footer style={{ 
          padding: '24px 40px', 
          textAlign: 'center', 
          borderTop: '2px solid rgba(255, 255, 255, 0.03)',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          background: 'rgba(5, 2, 15, 0.4)',
          fontWeight: 600
        }}>
          Antigravity FinTech Studio • Built using FastAPI, React, OpenCV, and Random Forest models.
        </footer>
      </main>
    </div>
  );
}

export default App;
