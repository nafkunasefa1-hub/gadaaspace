import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Bot,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Key,
  RefreshCw,
  Send,
  Brain
} from 'lucide-react';
import {
  generateGeminiRadiationForecast,
  askGeminiRadiationCopilot,
  getActiveKeyInfo,
  getCustomApiKey,
  setCustomApiKey
} from './geminiService';
import SpaceTrajectory3DViewer from './SpaceTrajectory3DViewer';

const MISSION_OPTIONS = [
  'Artemis Moon Transit (Orion)',
  'Lunar Surface Base (Shackleton Crater)',
  'Mars Transfer Cruise (Deep Space 900d)',
  'Mars Surface Habitat (Jezero Crater)'
];

const QUICK_PROMPTS = [
  { label: 'Which Moon path has lowest radiation? (Direct TLI vs Polar)', q: 'Compare the radiation dose of Direct Hohmann TLI versus the Polar High-Inclination bypass corridor for an Artemis Moon mission. Why does Polar save 63% dose?' },
  { label: 'How does Mars Fast Conjunction save astronaut lives?', q: 'How does taking a 165-day Fast Conjunction sprint to Mars reduce cumulative astronaut radiation exposure compared to a 259-day Hohmann transfer?' },
  { label: 'Are there X-rays in space? (NASA Chandra & Sources)', q: 'Are there x rays in space? What are their cosmic sources and how does NASA protect astronauts?' },
  { label: 'Why Lead fails & creates secondary neutrons?', q: 'Why does 500kg of pure lead fail in deep space and create dangerous secondary neutrons compared to 157Gd-MXene?' },
  { label: 'How does the Smart Suit Solenoid save battery?', q: 'Explain how the digital smart spacesuit solenoid shield saves battery by only turning on during radiation spikes.' },
  { label: 'Simulate an X10 Superflare on Moon', q: 'What happens to astronauts during a lunar EVA if an X10 solar flare erupts? How does Odaa-Aegis protect them?' },
  { label: 'Mars 900-day Mission Cumulative Dose', q: 'Analyze the cumulative radiation dose of a 900-day Mars mission against the NASA 600 mSv career limit.' }
];

function GeminiStructuredResponse({ text }) {
  if (!text) return null;

  // Clean any stray asterisks, hashes, backslashes
  const clean = text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\/g, '')
    .trim();

  // Split into raw paragraphs / sections
  const rawParagraphs = clean.split(/\n\s*\n/);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rawParagraphs.map((para, pIdx) => {
        const lines = para.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return null;

        const firstLine = lines[0];
        const isHeader =
          firstLine.length < 55 &&
          /^[A-Z0-9\s&—–:.-]+$/.test(firstLine) &&
          firstLine.replace(/[^A-Z]/g, '').length >= 3;

        if (isHeader) {
          const headerTitle = firstLine.replace(/:$/, '');
          const bodyLines = lines.slice(1);

          // Determine theme color & icon based on section type
          let themeBorder = 'rgba(56, 189, 248, 0.35)';
          let themeBg = 'rgba(56, 189, 248, 0.06)';
          let titleColor = '#38bdf8';
          let IconComp = Sparkles;

          if (headerTitle.includes('SOURCE') || headerTitle.includes('SOLAR') || headerTitle.includes('MECHANISM')) {
            themeBorder = 'rgba(212, 175, 55, 0.35)';
            themeBg = 'rgba(212, 175, 55, 0.06)';
            titleColor = '#fde68a';
            IconComp = Zap;
          } else if (headerTitle.includes('OBSERVATION') || headerTitle.includes('MISSION') || headerTitle.includes('CHANDRA') || headerTitle.includes('CAPABILITY') || headerTitle.includes('TELESCOPE')) {
            themeBorder = 'rgba(167, 139, 250, 0.35)';
            themeBg = 'rgba(167, 139, 250, 0.06)';
            titleColor = '#c084fc';
            IconComp = Brain;
          } else if (headerTitle.includes('PROTECTION') || headerTitle.includes('SHIELD') || headerTitle.includes('HEALTH') || headerTitle.includes('ADVISORY') || headerTitle.includes('TAKEAWAY')) {
            themeBorder = 'rgba(16, 185, 129, 0.35)';
            themeBg = 'rgba(16, 185, 129, 0.06)';
            titleColor = '#6ee7b7';
            IconComp = Shield;
          }

          return (
            <div
              key={pIdx}
              style={{
                background: themeBg,
                border: `1px solid ${themeBorder}`,
                borderRadius: 9,
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, fontSize: 13, color: titleColor }}>
                <IconComp size={14} style={{ color: titleColor, flexShrink: 0 }} />
                <span>{headerTitle}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {bodyLines.map((line, lIdx) => {
                  const numMatch = line.match(/^(\d+)\.\s*(.*)/);
                  if (numMatch) {
                    const num = numMatch[1];
                    const content = numMatch[2];
                    const colonIdx = content.indexOf(':');
                    const label = colonIdx > -1 ? content.slice(0, colonIdx) : '';
                    const desc = colonIdx > -1 ? content.slice(colonIdx + 1).trim() : content;

                    return (
                      <div key={lIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, lineHeight: 1.5, color: '#e2e8f0' }}>
                        <span
                          style={{
                            background: titleColor,
                            color: '#030712',
                            borderRadius: '50%',
                            width: 18,
                            height: 18,
                            fontSize: 10.5,
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: 2
                          }}
                        >
                          {num}
                        </span>
                        <div>
                          {label && <strong style={{ color: '#ffffff', marginRight: 4 }}>{label}:</strong>}
                          <span>{desc}</span>
                        </div>
                      </div>
                    );
                  }

                  if (line.startsWith('•') || line.startsWith('-')) {
                    const cleanLine = line.replace(/^[•-]\s*/, '');
                    return (
                      <div key={lIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, lineHeight: 1.5, color: '#e2e8f0' }}>
                        <span style={{ color: titleColor, fontSize: 14, lineHeight: '18px', flexShrink: 0 }}>•</span>
                        <span>{cleanLine}</span>
                      </div>
                    );
                  }

                  return (
                    <p key={lIdx} style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: '#cbd5e1' }}>
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          );
        }

        // Non-header paragraph
        return (
          <div key={pIdx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lines.map((line, lIdx) => {
              const numMatch = line.match(/^(\d+)\.\s*(.*)/);
              if (numMatch) {
                const num = numMatch[1];
                const content = numMatch[2];
                const colonIdx = content.indexOf(':');
                const label = colonIdx > -1 ? content.slice(0, colonIdx) : '';
                const desc = colonIdx > -1 ? content.slice(colonIdx + 1).trim() : content;

                return (
                  <div key={lIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, lineHeight: 1.5, color: '#e2e8f0' }}>
                    <span
                      style={{
                        background: 'rgba(56, 189, 248, 0.25)',
                        color: '#38bdf8',
                        borderRadius: '50%',
                        width: 18,
                        height: 18,
                        fontSize: 10.5,
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2
                      }}
                    >
                      {num}
                    </span>
                    <div>
                      {label && <strong style={{ color: '#ffffff', marginRight: 4 }}>{label}:</strong>}
                      <span>{desc}</span>
                    </div>
                  </div>
                );
              }

              return (
                <p key={lIdx} style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: '#cbd5e1' }}>
                  {line}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function GeminiRadiationPanel({
  telemetry,
  simState,
  onEngageOdaaAegis
}) {
  const [mission, setMission] = useState(MISSION_OPTIONS[0]);
  const [isForecasting, setIsForecasting] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [customKey, setCustomKeyState] = useState(getCustomApiKey());
  const [showKeyDrawer, setShowKeyDrawer] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: `EXECUTIVE BRIEFING: GEMINI AI SPACE RADIATION COPILOT

Welcome to GadaSpace. I am actively connected to your live NOAA GOES-18 satellite feeds and deep-space telemetry.

CAPABILITIES
1. Real-Time Telemetry Diagnosis: Live analysis of proton flux, solar wind velocity, and spacecraft cabin dose.
2. Space Environment & Heliophysics: Ask about solar flares, cosmic X-rays, coronal mass ejections, or deep-space physics.
3. Astronaut Medicine & Shielding: Evaluation of 157Gd-MXene, secondary neutron spallation suppression, and NASA career PEL limits.`,
      engine: 'Gemini AI'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [keyInfo, setKeyInfo] = useState(getActiveKeyInfo());

  // Generate initial forecast on component mount
  const runForecast = useCallback(async () => {
    setIsForecasting(true);
    try {
      const result = await generateGeminiRadiationForecast({
        telemetry,
        simState,
        selectedMission: mission
      });
      setForecast(result);
      setKeyInfo(getActiveKeyInfo());
    } finally {
      setIsForecasting(false);
    }
  }, [telemetry, simState, mission]);

  useEffect(() => {
    runForecast();
  }, [runForecast]);

  const handleSaveCustomKey = (e) => {
    e.preventDefault();
    setCustomApiKey(customKey);
    setKeyInfo(getActiveKeyInfo());
    setShowKeyDrawer(false);
    runForecast();
  };

  const handleSendChat = async (questionText = null) => {
    const q = questionText || chatInput;
    if (!q.trim() || isAsking) return;

    const userMsg = { role: 'user', text: q };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!questionText) setChatInput('');
    setIsAsking(true);

    try {
      const response = await askGeminiRadiationCopilot({
        userQuestion: q,
        telemetry,
        simState
      });
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: response.answer,
          engine: response.engine
        }
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Unable to connect to Gemini endpoint. Telemetry remains safely guarded by local Kalman filters.',
          engine: 'Gemini Fallback'
        }
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top AI Status Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.12), rgba(56, 189, 248, 0.08), rgba(212, 175, 55, 0.12))',
          border: '1px solid rgba(167, 139, 250, 0.35)',
          borderRadius: 14,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(167, 139, 250, 0.22)',
              border: '1px solid rgba(167, 139, 250, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc',
              boxShadow: '0 0 16px rgba(167, 139, 250, 0.3)'
            }}
          >
            <Brain size={20} strokeWidth={2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
                Gemini AI Space Weather &amp; Radiation Forecasting Engine
              </h3>
              <span className="badge-purple" style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 999 }}>
                Google AI Studio Integrated
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
              Autonomous deep-space heliophysics inference combining real-time NOAA GOES streams with NASA flight surgeon models.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: '#cbd5e1',
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid var(--border-hairline)',
              padding: '5px 10px',
              borderRadius: 6
            }}
            title="Multi-key pool with automated failover"
          >
            🔑 {keyInfo.type === 'CUSTOM_USER_KEY' ? `Custom Key (${keyInfo.keyPreview})` : `Pool Key #${keyInfo.poolIndex} (${keyInfo.keyPreview})`}
          </span>

          <button
            type="button"
            className="cmd-btn"
            onClick={() => setShowKeyDrawer((v) => !v)}
            style={{ borderColor: 'rgba(167, 139, 250, 0.4)' }}
            title="Configure or enter custom Google AI Studio Gemini API Key"
          >
            <Key size={13} strokeWidth={1.75} style={{ color: '#c084fc' }} />
            <span>{showKeyDrawer ? 'Close Key Setup' : 'Key Settings'}</span>
          </button>
        </div>
      </div>

      {/* Optional Custom API Key Drawer */}
      {showKeyDrawer && (
        <form
          onSubmit={handleSaveCustomKey}
          style={{
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border-hover)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>
              Google AI Studio API Key Configuration
            </span>
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
              5 built-in keys active. You may also enter your personal key for unmetered testing.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="password"
              placeholder="Paste your Gemini API key (AQ.Ab8... or AIzaSy...)"
              value={customKey}
              onChange={(e) => setCustomKeyState(e.target.value)}
              style={{
                flex: 1,
                background: 'var(--surface-canvas)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 7,
                padding: '8px 12px',
                color: '#f8fafc',
                fontSize: 12.5,
                fontFamily: 'var(--font-mono)'
              }}
            />
            <button type="submit" className="cmd-btn primary">
              Save &amp; Re-run
            </button>
            {customKey && (
              <button
                type="button"
                className="cmd-btn"
                onClick={() => {
                  setCustomKeyState('');
                  setCustomApiKey('');
                  setKeyInfo(getActiveKeyInfo());
                }}
              >
                Reset to Built-in Pool
              </button>
            )}
          </div>
        </form>
      )}

      {/* Control Bar: Mission Selection & Forecast Trigger */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          background: 'var(--surface-panel)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 12,
          padding: '12px 16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Target Mission Context:</label>
          <select
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            style={{
              background: 'var(--surface-canvas)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 6,
              padding: '6px 12px',
              color: '#f8fafc',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {MISSION_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="cmd-btn primary"
          onClick={runForecast}
          disabled={isForecasting}
          style={{
            background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
            borderColor: '#c084fc',
            padding: '0 16px',
            height: 34
          }}
        >
          <RefreshCw size={14} className={isForecasting ? 'spin-icon' : ''} />
          <span>{isForecasting ? 'Running Gemini AI Inference...' : '⚡ Run Real-Time Gemini AI Forecast'}</span>
        </button>
      </div>

      {/* Structured Forecast Results Card */}
      {forecast && (
        <div
          style={{
            background: 'var(--surface-panel)',
            border: '1px solid var(--border-hover)',
            borderRadius: 14,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: '#c084fc',
                  background: 'rgba(167, 139, 250, 0.15)',
                  padding: '3px 8px',
                  borderRadius: 5
                }}
              >
                ✦ {forecast.engine}
              </span>
              <h3 style={{ margin: '8px 0 2px', fontSize: 17, fontWeight: 700, color: '#f8fafc' }}>
                Heliophysics Radiation Assessment &bull; {mission}
              </h3>
              <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
                Generated at {forecast.timestamp} from live GOES-18 ({((telemetry?.proton10MeVPfu ?? 1.15)).toFixed(2)} pfu) &amp; DSCOVR ({Math.round(telemetry?.solarWindSpeedKms ?? 435)} km/s)
              </span>
            </div>

            {/* Shelter Advisory Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '6px 14px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                background:
                  forecast.astronautShelterAdvisory === 'SHELTER_IMMEDIATE_ODAA_AEGIS'
                    ? 'rgba(244, 63, 94, 0.18)'
                    : forecast.astronautShelterAdvisory === 'STANDBY_ALERT_RESTRICT_EVA'
                    ? 'rgba(245, 158, 11, 0.18)'
                    : 'rgba(16, 185, 129, 0.18)',
                border:
                  forecast.astronautShelterAdvisory === 'SHELTER_IMMEDIATE_ODAA_AEGIS'
                    ? '1px solid rgba(244, 63, 94, 0.5)'
                    : forecast.astronautShelterAdvisory === 'STANDBY_ALERT_RESTRICT_EVA'
                    ? '1px solid rgba(245, 158, 11, 0.5)'
                    : '1px solid rgba(16, 185, 129, 0.5)',
                color:
                  forecast.astronautShelterAdvisory === 'SHELTER_IMMEDIATE_ODAA_AEGIS'
                    ? '#fda4af'
                    : forecast.astronautShelterAdvisory === 'STANDBY_ALERT_RESTRICT_EVA'
                    ? '#fde68a'
                    : '#a7f3d0'
              }}
            >
              {forecast.astronautShelterAdvisory === 'SHELTER_IMMEDIATE_ODAA_AEGIS' ? (
                <AlertTriangle size={14} />
              ) : (
                <CheckCircle2 size={14} />
              )}
              <span>{forecast.astronautShelterAdvisory.replace(/_/g, ' ')}</span>
            </div>
          </div>

          {/* 4-Column Key Threat Indicators */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12
            }}
          >
            <div className="kpi-card purple" style={{ padding: 14 }}>
              <div className="k-label">
                <span className="k-dot" style={{ background: 'var(--accent-purple)' }} />
                <span>Solar Flare Prob (24h)</span>
              </div>
              <div className="k-val" style={{ color: 'var(--accent-purple)', fontSize: 24 }}>
                {forecast.flareRisk24hPct}%
              </div>
              <div className="k-sub">6h: {forecast.flareRisk6hPct}% &bull; 48h: {forecast.flareRisk48hPct}%</div>
            </div>

            <div className="kpi-card amber" style={{ padding: 14 }}>
              <div className="k-label">
                <span className="k-dot" style={{ background: 'var(--status-amber)' }} />
                <span>Predicted Peak Wave</span>
              </div>
              <div className="k-val" style={{ color: 'var(--status-amber)', fontSize: 24 }}>
                {forecast.predictedPeakFluxPfu} <span style={{ fontSize: 13 }}>pfu</span>
              </div>
              <div className="k-sub">Severity: <strong>{forecast.speSeverity}</strong> &bull; ETA: +{forecast.arrivalEtaHours}h</div>
            </div>

            <div className="kpi-card cyan" style={{ padding: 14 }}>
              <div className="k-label">
                <span className="k-dot" style={{ background: 'var(--accent-cyan)' }} />
                <span>Est 48h Crew Dose</span>
              </div>
              <div className="k-val" style={{ color: 'var(--accent-cyan)', fontSize: 24 }}>
                {forecast.crewDoseEstimate48hMsv} <span style={{ fontSize: 13 }}>mSv</span>
              </div>
              <div className="k-sub">Shielded by {simState?.m1?.name?.split(' ')[0] ?? 'Odaa-Aegis'}</div>
            </div>

            <div className="kpi-card green" style={{ padding: 14 }}>
              <div className="k-label">
                <span className="k-dot" style={{ background: 'var(--status-nominal)' }} />
                <span>DNA Lesion Risk</span>
              </div>
              <div className="k-val" style={{ color: 'var(--status-nominal)', fontSize: 24 }}>
                {forecast.dnaDsbRiskScore} / 100
              </div>
              <div className="k-sub">Melanin enzymatic repair active</div>
            </div>
          </div>

          {/* Scientific Synopsis */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 10,
              padding: 14,
              fontSize: 13,
              color: '#cbd5e1',
              lineHeight: 1.55
            }}
          >
            <strong style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Sparkles size={14} style={{ color: '#c084fc' }} />
              <span>Gemini AI Heliophysics &amp; Aerospace Medical Synopsis:</span>
            </strong>
            {forecast.scientificSynopsis}
          </div>

          {/* Autonomous Shield Reconfiguration Directives */}
          <div
            style={{
              background: 'rgba(212, 175, 55, 0.06)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: 10,
              padding: 14
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              <strong style={{ color: '#fde68a', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <Shield size={14} style={{ color: '#d4af37' }} />
                <span>Autonomous Shield Directives Generated by Gemini:</span>
              </strong>
              {onEngageOdaaAegis && (
                <button
                  type="button"
                  className="cmd-btn"
                  onClick={() => onEngageOdaaAegis()}
                  style={{
                    borderColor: 'rgba(212, 175, 55, 0.45)',
                    background: 'rgba(212, 175, 55, 0.15)',
                    color: '#fde68a'
                  }}
                  title="Automatically configure spacecraft shielding to optimal parameters"
                >
                  <Zap size={13} strokeWidth={1.75} />
                  <span>Execute Optimal Odaa-Aegis Reconfiguration</span>
                </button>
              )}
            </div>

            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: '#e2e8f0' }}>
              {forecast.shieldDirectives?.map((dir, idx) => (
                <li key={idx}>{dir}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 3D Spacecraft Trajectory Radiation Corridor & Path Optimization Studio */}
      <SpaceTrajectory3DViewer
        telemetry={telemetry}
        simState={simState}
      />

      {/* Interactive Space Radiation Co-Pilot & Flight Surgeon Chat */}
      <div
        style={{
          background: 'var(--surface-panel)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 14,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bot size={18} style={{ color: '#38bdf8' }} />
              <span>Interactive Gemini Space Radiation Co-Pilot</span>
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>
              Ask deep questions about heliophysics, secondary neutron spallation, NASA PEL limits, or test the smart spacesuit.
            </p>
          </div>
          <span className="badge-gold" style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6 }}>
            Ask Me Anything (Live Q&amp;A for Judges)
          </span>
        </div>

        {/* Quick Question Pills for Judges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {QUICK_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              className="view-btn"
              onClick={() => handleSendChat(p.q)}
              disabled={isAsking}
              style={{
                fontSize: 11.5,
                padding: '4px 10px',
                background: 'var(--surface-canvas)',
                borderColor: 'var(--border-hairline)',
                color: '#cbd5e1'
              }}
            >
              ✦ {p.label}
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div
          style={{
            maxHeight: 340,
            overflowY: 'auto',
            background: 'var(--surface-canvas)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 10,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: msg.role === 'user' ? '82%' : '94%',
                background: msg.role === 'user' ? 'rgba(56, 189, 248, 0.15)' : 'var(--surface-elevated)',
                border: msg.role === 'user' ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid var(--border-hairline)',
                borderRadius: 10,
                padding: '12px 16px',
                fontSize: 12.5,
                lineHeight: 1.5,
                color: '#f8fafc'
              }}
            >
              {msg.role === 'assistant' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: '#38bdf8',
                      background: 'rgba(56, 189, 248, 0.12)',
                      padding: '2px 6px',
                      borderRadius: 4
                    }}
                  >
                    {msg.engine || 'Gemini AI'}
                  </span>
                </div>
              )}
              {msg.role === 'user' ? (
                <div style={{ fontSize: 13, fontWeight: 500 }}>{msg.text}</div>
              ) : (
                <GeminiStructuredResponse text={msg.text} />
              )}
            </div>
          ))}

          {isAsking && (
            <div
              style={{
                alignSelf: 'flex-start',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: 12,
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <RefreshCw size={12} className="spin-icon" />
              <span>Gemini is analyzing space radiation physics...</span>
            </div>
          )}
        </div>

        {/* Chat Input Field */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Type any radiation question (e.g., 'What happens to human DNA during an X-class flare?')..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendChat();
            }}
            disabled={isAsking}
            style={{
              flex: 1,
              background: 'var(--surface-canvas)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 8,
              padding: '9px 14px',
              color: '#f8fafc',
              fontSize: 13
            }}
          />
          <button
            type="button"
            className="cmd-btn primary"
            onClick={() => handleSendChat()}
            disabled={isAsking || !chatInput.trim()}
            style={{
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              borderColor: '#38bdf8',
              height: 38,
              padding: '0 16px'
            }}
          >
            <Send size={14} />
            <span>Ask Gemini</span>
          </button>
        </div>
      </div>
    </div>
  );
}
