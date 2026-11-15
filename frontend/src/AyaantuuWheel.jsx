import React, { useState } from 'react';
import { ChevronRight, Compass } from 'lucide-react';

const GADAA_NODES = [
  {
    id: 0,
    num: '01',
    name: 'Bokkuu',
    title: 'Equitable Governance & Crew PEL Constraint',
    heritage: 'The ceremonial Oromo staff of peace, non-violence, and law upholding accountability.',
    tech: 'Enforces the 4-Way Pareto Constraint & NASA-STD-3001 (250 mSv PEL), guaranteeing launch mass savings never compromise crew safety.',
    formula: 'Score = Protection(%) − MassPenalty − SpallationPenalty',
    targetTab: 'tab-shield',
    cta: 'Inspect 4-Way Pareto Matrix'
  },
  {
    id: 1,
    num: '02',
    name: 'Gumii',
    title: 'Consensus Assembly & 5-Detector Kalman Fusion',
    heritage: 'Democratic assembly where diverse voices unite so no blind spot endangers the community.',
    tech: 'Inverse-Variance Kalman / Bayesian fusion unites Silicon, TEPC, CsI, 157Gd/3He, and TLD sensors with NASA OLTARIS priors.',
    formula: 'D̂_fused = σ² · [ D̂_prior/σ_prior² + Σ(y_i/σ_i²) ]',
    targetTab: 'tab-fusion',
    cta: 'Open Multi-Detector Kalman Lab'
  },
  {
    id: 2,
    num: '03',
    name: 'Ayaantuu',
    title: 'Celestial Timekeeping & TLI Van Allen Navigation',
    heritage: 'Indigenous Oromo astronomers tracking moon-star alignments across multi-year horizons.',
    tech: 'Models Vis-Viva radial orbital velocities & Simpson 1/3 trajectory integration through Earth’s Inner & Outer Van Allen Belts.',
    formula: 'D_transit = N · ∫ [ Ḋ(L(r,i), x) / v_r(r) ] dr',
    targetTab: 'tab-orbital',
    cta: 'Simulate Van Allen Transit'
  },
  {
    id: 3,
    num: '04',
    name: 'Safuu',
    title: 'Ecological Balance & Bio-Hybrid Self-Healing',
    heritage: 'Sacred ethical harmony between humanity, living ecosystems, and the cosmos.',
    tech: 'Pairs extremophile Chernobyl Radiotrophic Melanin with 2D 157Gd-MXene nanosheets to capture neutrons & self-heal at 0 W survival power.',
    formula: 'σ_γ(157Gd) = 255,000 barns (65× Boron-10)',
    targetTab: 'tab-3d',
    cta: 'Explore 3D Cutaway Armor'
  },
  {
    id: 4,
    num: '05',
    name: 'Odaa',
    title: 'Canopy of Protection & Storm Shelter Architecture',
    heritage: 'The sacred broad sycamore tree sheltering assemblies from harsh sun and storm.',
    tech: 'Constructs a 3-Layer Graded-Z storm shelter zone inside the crew cabin reducing solar particle storm dose by over 60%.',
    formula: 'Pb/Al (<1g/cm²) → HDPE → 157Gd-MXene+Melanin',
    targetTab: 'tab-bio',
    cta: 'View Cabin Spatial Distribution'
  },
  {
    id: 5,
    num: '06',
    name: 'Luba',
    title: 'Generational Continuity & Long-Duration Dosimetry',
    heritage: 'Structured 8-year rotational generations preserving wisdom and resilience across decades.',
    tech: 'Tracks lifetime cumulative Equivalent Dose H and DNA Double-Strand Breaks across 180–730 day Moon & Mars campaigns.',
    formula: 'D = E/m → Q(LET) → H = D × Q(L) [Sv]',
    targetTab: 'tab-bio',
    cta: 'Verify ICRP-60 Bio-Dosimetry'
  },
  {
    id: 6,
    num: '07',
    name: 'Nagaa',
    title: 'Atmospheric Haven & Mars Crustal Field Advantage',
    heritage: 'Universal well-being and cosmic serenity protecting life across hostile frontiers.',
    tech: 'Quantifies using LRO CRaTER & Curiosity MSL RAD why Mars’s CO2 column & 1,500 nT Terra Sirenum anomalies make Mars 35–56% safer than the Moon.',
    formula: 'ΔH_Mars_vs_Moon ≈ −35% to −56%',
    targetTab: 'tab-orbital',
    cta: 'Compare Moon vs. Mars Surface'
  },
  {
    id: 7,
    num: '08',
    name: 'Tokkummaa',
    title: 'Unity & Neuro-Symbolic NASA Data Integration',
    heritage: 'Solidarity and strength through unified purpose — inscribed around the GadaSpace seal.',
    tech: 'Synchronizes NOAA SWPC GOES-18 live proton streams with NASA RBSP, OLTARIS, CRaTER, and MSL RAD inside one AI Mission Co-Pilot.',
    formula: 'Grounded Synthesis + Zero Hallucination',
    targetTab: 'tab-ai',
    cta: 'Consult AI Mission Co-Pilot'
  }
];

export default function AyaantuuWheel({ onLaunchApp }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const current = GADAA_NODES[selectedIdx];

  const cx = 190;
  const cy = 190;
  const radius = 136;

  return (
    <div className="ayaantuu-container glass-panel aos-reveal">
      <div className="ayaantuu-header">
        <div className="ay-badge">
          <Compass size={14} />
          <span>UNIQUE INNOVATION &bull; INTERACTIVE 8-CYCLE GADAA–AYAANTUU CELESTIAL ASTROLABE</span>
        </div>
        <h3>
          Tap Any Heritage Node to Trace How <span className="grad-gold">Oromo Philosophy</span> Drives <span className="grad-cyan">Aerospace Code</span>
        </h3>
      </div>

      <div className="ayaantuu-grid">
        {/* Interactive Rotating Astrolabe Wheel */}
        <div className="astrolabe-wrap">
          <svg viewBox="0 0 380 380" className="astrolabe-svg" role="img" aria-label="Interactive Gadaa 8-Cycle Celestial Engineering Wheel">
            <defs>
              <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(212, 175, 55, 0.35)" />
                <stop offset="60%" stopColor="rgba(56, 189, 248, 0.12)" />
                <stop offset="100%" stopColor="rgba(3, 7, 18, 0)" />
              </radialGradient>
            </defs>

            {/* Ambient Center Halo */}
            <circle cx={cx} cy={cy} r="158" fill="url(#coreGlow)" />

            {/* Outer Slowly Rotating Azimuth Ticks */}
            <g className="astrolabe-spin-slow">
              <circle cx={cx} cy={cy} r="168" fill="none" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1" strokeDasharray="3 8" />
              <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(212, 175, 55, 0.35)" strokeWidth="1.5" />
            </g>

            {/* Inner Rotating Sacred Geometry Octagon */}
            <g className="astrolabe-spin-rev">
              <circle cx={cx} cy={cy} r="76" fill="none" stroke="rgba(56, 189, 248, 0.32)" strokeWidth="1" strokeDasharray="6 6" />
              <polygon
                points={GADAA_NODES.map((_, i) => {
                  const a = (i * Math.PI) / 4 - Math.PI / 2;
                  return `${cx + Math.cos(a) * 76},${cy + Math.sin(a) * 76}`;
                }).join(' ')}
                fill="none"
                stroke="rgba(212, 175, 55, 0.25)"
                strokeWidth="1"
              />
            </g>

            {/* Connecting Spokes from Center Core to All 8 Nodes */}
            {GADAA_NODES.map((node, i) => {
              const angle = (i * Math.PI) / 4 - Math.PI / 2;
              const nx = cx + Math.cos(angle) * radius;
              const ny = cy + Math.sin(angle) * radius;
              const isSelected = i === selectedIdx;
              return (
                <line
                  key={`spoke-${node.id}`}
                  x1={cx}
                  y1={cy}
                  x2={nx}
                  y2={ny}
                  stroke={isSelected ? '#D4AF37' : 'rgba(148, 163, 184, 0.18)'}
                  strokeWidth={isSelected ? '2.2' : '1'}
                  strokeDasharray={isSelected ? undefined : '3 4'}
                />
              );
            })}

            {/* Center Bokkuu Seal Core */}
            <circle cx={cx} cy={cy} r="44" fill="#0B192C" stroke="#D4AF37" strokeWidth="2" />
            <circle cx={cx} cy={cy} r="36" fill="none" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.55" />
            <text x={cx} y={cy - 4} textAnchor="middle" fill="#FDE68A" fontSize="11" fontWeight="700" fontFamily="Space Grotesk, sans-serif">
              GADAA-8
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill="#38BDF8" fontSize="8.5" fontWeight="700" fontFamily="IBM Plex Mono, monospace">
              CYCLE CORE
            </text>

            {/* 8 Clickable Orbital Nodes */}
            {GADAA_NODES.map((node, i) => {
              const angle = (i * Math.PI) / 4 - Math.PI / 2;
              const nx = cx + Math.cos(angle) * radius;
              const ny = cy + Math.sin(angle) * radius;
              const isSelected = i === selectedIdx;
              return (
                <g
                  key={node.id}
                  className="astrolabe-node-group"
                  onClick={() => setSelectedIdx(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedIdx(i)}
                >
                  {isSelected && (
                    <circle cx={nx} cy={ny} r="31" fill="rgba(212, 175, 55, 0.18)" stroke="#FDE68A" strokeWidth="1.2" />
                  )}
                  <circle
                    cx={nx}
                    cy={ny}
                    r="23"
                    fill={isSelected ? '#D4AF37' : '#0f172a'}
                    stroke={isSelected ? '#FEF3C7' : '#38BDF8'}
                    strokeWidth={isSelected ? '2' : '1.4'}
                  />
                  <text
                    x={nx}
                    y={ny - 2}
                    textAnchor="middle"
                    fill={isSelected ? '#030712' : '#D4AF37'}
                    fontSize="8.5"
                    fontWeight="700"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {node.num}
                  </text>
                  <text
                    x={nx}
                    y={ny + 10}
                    textAnchor="middle"
                    fill={isSelected ? '#030712' : '#f8fafc'}
                    fontSize="7.5"
                    fontWeight="700"
                    fontFamily="Space Grotesk, sans-serif"
                  >
                    {node.name.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Node Detailed Briefing Card */}
        <div className="astrolabe-detail-card">
          <div className="ad-top">
            <span className="ad-step">CYCLE {current.num} / 08 &bull; {current.name.toUpperCase()}</span>
            <span className="ad-live-tag">ACTIVE MODULE BRIDGE</span>
          </div>

          <h4 className="ad-title">{current.title}</h4>

          <div className="ad-dual-blocks">
            <div className="ad-block gold-border">
              <span className="ad-blk-lbl">🏛️ Oromo Gadaa Heritage Root</span>
              <p>{current.heritage}</p>
            </div>
            <div className="ad-block cyan-border">
              <span className="ad-blk-lbl">🛰️ GadaSpace Engineering Translation</span>
              <p>{current.tech}</p>
            </div>
          </div>

          <div className="ad-formula-strip">
            <span>Governing Formulation:</span>
            <code>{current.formula}</code>
          </div>

          <div className="ad-actions">
            <div className="ad-quick-dots">
              {GADAA_NODES.map((n, idx) => (
                <button
                  key={n.id}
                  type="button"
                  className={`ad-q-btn ${idx === selectedIdx ? 'active' : ''}`}
                  onClick={() => setSelectedIdx(idx)}
                  title={`${n.num} ${n.name}`}
                >
                  {n.num}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn-launch-inline"
              onClick={() => onLaunchApp(current.targetTab)}
            >
              <span>{current.cta}</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
