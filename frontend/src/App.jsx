import React, { useState, useEffect } from 'react';
import ParticlesBg from './components/ParticlesBg';
import Dashboard from './components/Dashboard';
import { LineChart, ImageIcon, Cpu, CheckCircle2 } from 'lucide-react';

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
          padding: '24px 40px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(5, 6, 8, 0.4)',
          backdropFilter: 'blur(16px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setMode('landing')}>
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

        {mode === 'landing' ? (
          /* Landing Screen */
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
              opacity: 0.015,
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
                <span className="tech-label" style={{ fontSize: '0.7rem' }}>HIGH-PERFORMANCE MODEL DIAGNOSTICS</span>
              </div>

              {/* Greeting */}
              <h1 style={{ fontSize: '3.6rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px', fontFamily: 'Outfit', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                Technical Telemetry. <br />
                <span className="gradient-text">Select Diagnostic Mode.</span>
              </h1>
              
              <p style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '1.05rem', 
                maxWidth: '600px', 
                lineHeight: 1.6, 
                marginBottom: '50px',
                fontWeight: 500
              }}>
                Stream technical vectors for Indian listings (NSE/BSE). Render and classify daily movement trend signals or extract candlestick wicks with the pixel scanner.
              </p>

              {/* Selector Cards */}
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                justifyContent: 'center', 
                gap: '30px', 
                width: '100%', 
                maxWidth: '780px' 
              }}>
                
                {/* Live Ticker Card */}
                <div 
                  className="glass-panel" 
                  onClick={() => setMode('live')}
                  style={{ 
                    flex: 1, 
                    minWidth: '300px', 
                    padding: '40px 32px', 
                    cursor: 'pointer', 
                    textAlign: 'left',
                    position: 'relative',
                    overflow: 'hidden',
                    borderLeft: '2px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div style={{ 
                    position: 'absolute', 
                    top: '-60px', 
                    right: '-60px', 
                    width: '140px', 
                    height: '140px', 
                    background: 'radial-gradient(circle, var(--secondary-glow) 0%, rgba(0,0,0,0) 70%)',
                    pointerEvents: 'none'
                  }} />
                  
                  <div style={{ 
                    padding: '12px', 
                    background: 'rgba(255, 255, 255, 0.01)', 
                    borderRadius: '2px', 
                    width: 'fit-content',
                    border: '1px solid var(--border-color)',
                    marginBottom: '24px'
                  }}>
                    <LineChart style={{ color: 'var(--secondary)', width: '24px', height: '24px' }} />
                  </div>
                  <h3 className="tech-label" style={{ fontSize: '1rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
                    Live Ticker Telemetry
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    Evaluate spot prices for NSE listings (e.g. RELIANCE, TCS, TITAGARH). The ML core processes normalized scale-invariant indicator matrices.
                  </p>
                </div>

                {/* Screenshot Card */}
                <div 
                  className="glass-panel" 
                  onClick={() => setMode('screenshot')}
                  style={{ 
                    flex: 1, 
                    minWidth: '300px', 
                    padding: '40px 32px', 
                    cursor: 'pointer', 
                    textAlign: 'left',
                    position: 'relative',
                    overflow: 'hidden',
                    borderLeft: '2px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div style={{ 
                    position: 'absolute', 
                    top: '-60px', 
                    right: '-60px', 
                    width: '140px', 
                    height: '140px', 
                    background: 'radial-gradient(circle, var(--secondary-glow) 0%, rgba(0,0,0,0) 70%)',
                    pointerEvents: 'none'
                  }} />

                  <div style={{ 
                    padding: '12px', 
                    background: 'rgba(255, 255, 255, 0.01)', 
                    borderRadius: '2px', 
                    width: 'fit-content',
                    border: '1px solid var(--border-color)',
                    marginBottom: '24px'
                  }}>
                    <ImageIcon style={{ color: 'var(--secondary)', width: '24px', height: '24px' }} />
                  </div>
                  <h3 className="tech-label" style={{ fontSize: '1rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
                    Vision System Input
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    Ingest chart graphics. The vision engine segments candle contours, computes pixel heights, and scores wick reversals.
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

