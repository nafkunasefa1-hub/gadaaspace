import React, { useMemo, useState } from 'react';
import {
  Rocket,
  MapPin,
  Gem,
  Orbit,
  Dna,
  Atom,
  Microscope
} from 'lucide-react';
import PlotlyChart from './PlotlyChart';
import Future3DViewport from './Future3DViewport';

const ROADMAP_STAGES = [
  {
    id: 'stage2026',
    era: 'STAGE 1 • 2026 (LIVE GADASpace PROTOTYPE)',
    trl: 'TRL 6–7 (Grounded Flight Physics)',
    title: 'Odaa-Aegis Whole-Vessel Magneto-Water-Bio Architecture',
    protection: '80–90% Net Attenuation',
    mechanism: 'SiC/B4C-CFRP hull + 10B-Water/LiBH4 living-wall sleeve + 2.5 m ReBCO superconducting dipole deflection.',
    whyNot100: 'Compact 2.5 m coils cannot bend multi-GeV GCR Iron ions (magnetic rigidity R_c = B*L is still bounded by vessel scale).'
  },
  {
    id: 'stage2032',
    era: 'STAGE 2 • 2032 (CRYSTAL NANOMATERIAL COMPOUNDS)',
    trl: 'TRL 4–5 (Lab Synthesis)',
    title: 'H2@BNNT–157Gd–Graphyne Crystal Lattice + Bi2O3 Gamma Trap',
    protection: '94.5% Secondary & Neutron Elimination',
    mechanism: 'Compressing >20 wt% hydrogen inside Boron Nitride Nanotubes doped with isotopic 157Gd and trace Bi2O3 internally stops slow neutrons and capture gammas at ultra-low spallation Z_eff ≈ 3.1.',
    whyNot100: 'Even zero-spallation low-Z crystals still absorb high energy from 2–10 GeV primary GCR nuclei unless paired with an external field.'
  },
  {
    id: 'stage2038',
    era: 'STAGE 3 • 2038 (M2P2 PLASMA MAGNETOSPHERE & ION RETRACEMENT)',
    trl: 'TRL 3–4 (NASA NIAC Concept)',
    title: '500 m Mini-Magnetosphere Plasma Bubble & Pre-Hull Deflection',
    protection: '98.8% Pre-Hull Deflection + Retracement',
    mechanism: 'Injecting tenuous magnetized Hydrogen plasma inflates the effective standoff radius L from 2.5 m to 250–600 m (R_c = B*L increases ~200x), bending and retracing GeV ions BEFORE they touch the spacecraft wall.',
    whyNot100: 'Polar cusp leakage and ultra-high-rigidity (>15 GeV) cosmic rays (~0.1% tail flux) still trickle down the magnetic axis.'
  },
  {
    id: 'stage2045',
    era: 'STAGE 4 • 2045+ (BIO-CELLULAR DNA IMMUNITY)',
    trl: 'TRL 2–3 (Frontier Radiobiology)',
    title: 'Tardigrade Dsup Chromatin Armor + Synthetic Melanin ROS Scavenging',
    protection: '99.91% Effective Clinical DNA Immunity',
    mechanism: 'Any tiny ~0.1% cosmic particle slipping through the M2P2 plasma bubble + H2-Crystal hull meets tardigrade Damage Suppressor (Dsup) nucleosome shielding + cellular radical scavengers, slashing lethal DSB chromosome breaks by >80%.',
    whyNot100: 'Completes the 4-barrier shield + field + cellular immunity bridge toward near-100% safe interplanetary travel.'
  }
];

export default function FutureRoadmapPanel({ simState, isActive = true }) {
  // Interactive Breakthrough Parameters
  const [plasmaRadiusM, setPlasmaRadiusM] = useState(420);   // 2.5 m (2026) -> 600 m (2038+)
  const [crystalHwtPct, setCrystalHwtPct] = useState(21);    // 8 wt% (Water) -> 24 wt% (H2@BNNT-Graphyne)
  const [gammaTrapEffPct, setGammaTrapEffPct] = useState(92); // 45% -> 98% internal Bi2O3 + 157Gd capture
  const [dsupBioPct, setDsupBioPct] = useState(82);          // 0% -> 85% tardigrade Dsup DNA suppression

  const applyHorizonPreset = (eraKey) => {
    if (eraKey === '2026') {
      setPlasmaRadiusM(2.5);
      setCrystalHwtPct(11);
      setGammaTrapEffPct(62);
      setDsupBioPct(0);
    } else if (eraKey === '2032') {
      setPlasmaRadiusM(12);
      setCrystalHwtPct(21);
      setGammaTrapEffPct(92);
      setDsupBioPct(20);
    } else if (eraKey === '2038') {
      setPlasmaRadiusM(420);
      setCrystalHwtPct(21);
      setGammaTrapEffPct(92);
      setDsupBioPct(35);
    } else {
      setPlasmaRadiusM(550);
      setCrystalHwtPct(24);
      setGammaTrapEffPct(97);
      setDsupBioPct(84);
    }
  };

  const cascade = useMemo(() => {
    const rawUnshielded = Math.max(0.5, simState?.stack?.unshieldedRate || 3.4);

    // Stage 1: Current 2026 Odaa-Aegis baseline attenuation (~81% of raw or current sim ratio)
    const stage1Rate = rawUnshielded * 0.19;

    // Stage 2: Quantum Crystal H2@BNNT-157Gd + Bi2O3 suppresses secondary spallation & neutrons
    const hGain = Math.min(0.68, Math.max(0, (crystalHwtPct - 8) / 22) * 0.52);
    const trapGain = (gammaTrapEffPct / 100) * 0.34;
    const stage2Factor = Math.max(0.18, 1 - (hGain + trapGain));
    const stage2Rate = stage1Rate * stage2Factor;

    // Stage 3: M2P2 Plasma Standoff Radius expansion L -> multiplies magnetic rigidity R_c = B * L
    // Logarithmic percolation deflection of trapped + GCR tails
    const rigScale = Math.log10(Math.max(1, plasmaRadiusM / 2.5)); // 0 at 2.5m, ~2.3 at 500m
    const m2p2DeflectFrac = Math.min(0.955, 1 - Math.exp(-1.28 * rigScale));
    const stage3Rate = stage2Rate * (1 - m2p2DeflectFrac);

    // Stage 4: Biological Dsup + Melanin chromatin hardening reduces surviving clinical DNA damage
    const bioProtectionFrac = Math.min(0.88, Math.max(0, dsupBioPct / 100));
    const stage4ClinicalRate = stage3Rate * (1 - bioProtectionFrac);

    const netSuppressionPct = Math.min(99.99, Math.max(0, (1 - stage4ClinicalRate / rawUnshielded) * 100));
    const safeYearsBeforePel = 250 / Math.max(0.0001, stage4ClinicalRate * 365.25);

    return {
      rawUnshielded,
      stage1Rate,
      stage2Rate,
      stage3Rate,
      stage4ClinicalRate,
      netSuppressionPct,
      safeYearsBeforePel,
      m2p2DeflectFrac: m2p2DeflectFrac * 100
    };
  }, [simState, plasmaRadiusM, crystalHwtPct, gammaTrapEffPct, dsupBioPct]);

  const waterfallTraces = useMemo(() => {
    const labels = [
      '0. Unshielded Space',
      '1. 2026 Odaa-Aegis',
      '2. 2032 H2@BNNT Crystal',
      '3. 2038 M2P2 Plasma',
      '4. 2045+ Dsup Bio-DNA'
    ];
    const values = [
      Number(cascade.rawUnshielded.toFixed(4)),
      Number(cascade.stage1Rate.toFixed(4)),
      Number(cascade.stage2Rate.toFixed(4)),
      Number(cascade.stage3Rate.toFixed(4)),
      Number(cascade.stage4ClinicalRate.toFixed(4))
    ];
    return [
      {
        x: labels,
        y: values,
        type: 'bar',
        text: values.map(v => `${v >= 0.1 ? v.toFixed(2) : v.toFixed(4)} mSv/d`),
        textposition: 'outside',
        marker: {
          color: ['#f43f5e', '#38bdf8', '#a78bfa', '#fbbf24', '#10b981']
        },
        name: 'Surviving Biological Dose Rate (mSv/day)'
      }
    ];
  }, [cascade]);

  return (
    <>
      <div className="formula-card">
        <div className="formula-card-top">
          <div className="f-badge">HORIZON 2026–2045+ ROADMAP &bull; TOWARD 99.9%+ RADIATION IMMUNITY</div>
          <div className="f-title">Solving the Remaining ~10–20% GeV Cosmic Ray Leakage Without Physics Myths</div>
        </div>
        <div className="formula-display">
          <code>R<sub>c</sub> = B<sub>eff</sub> &middot; L<sub>plasma</sub> (M2P2 200x Boost)</code>
          <span className="formula-sep">&bull;</span>
          <code>&Phi;<sub>res</sub> = &Phi;<sub>GCR</sub>&middot;(1 &minus; f<sub>M2P2</sub>)&middot;e<sup>&minus;&Sigma;<sub>H2-BNNT</sub>x</sup>&middot;(1 &minus; &eta;<sub>Dsup</sub>)</code>
        </div>
        <div className="formula-chips">
          <span className="f-chip"><strong>Honest Physics Note:</strong> Today (2026), no solid wall stops 100% of 5 GeV Iron ions, so we pair Plasma Deflection + Hydrogen Crystal + Cellular DNA Repair.</span>
          <span className="f-chip"><strong>Simulated 2045 Net Protection:</strong> {cascade.netSuppressionPct.toFixed(2)}% biological risk reduction</span>
        </div>
      </div>

      {isActive && (
        <Future3DViewport
          plasmaRadiusM={plasmaRadiusM}
          crystalHwtPct={crystalHwtPct}
          dsupBioPct={dsupBioPct}
          cascade={cascade}
        />
      )}

      {/* Interactive Near-100% Frontier Sandbox */}
      <div className="chart-card">
        <div className="card-header-bar" style={{ marginBottom: 14 }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Rocket size={16} strokeWidth={1.75} style={{ color: '#38bdf8', flexShrink: 0 }} />
              <span>2026–2045 Future Concept Simulator</span>
            </h3>
            <p className="desc" style={{ marginBottom: 0, maxWidth: '66ch' }}>
              Combine next-generation shielding materials, <strong>M2P2 Magnetized Plasma Inflation</strong>, and <strong>Tardigrade Dsup Bio-Protection</strong> to watch surviving deep-space dose collapse toward ~0.001 mSv/day.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="view-btn" onClick={() => applyHorizonPreset('2026')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={13} strokeWidth={1.75} />
              <span>2026 Odaa-Aegis</span>
            </button>
            <button type="button" className="view-btn" onClick={() => applyHorizonPreset('2032')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Gem size={13} strokeWidth={1.75} />
              <span>2032 H₂ Crystal</span>
            </button>
            <button type="button" className="view-btn" onClick={() => applyHorizonPreset('2038')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Orbit size={13} strokeWidth={1.75} />
              <span>2038 M2P2 Plasma</span>
            </button>
            <button type="button" className="view-btn active" onClick={() => applyHorizonPreset('2045')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Dna size={13} strokeWidth={1.75} />
              <span>2045 Near-100%</span>
            </button>
          </div>
        </div>

        {/* 4 Frontier Parameter Sliders */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14, marginBottom: 16 }}>
          <div className="sensor-stat-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Orbit size={13} strokeWidth={1.75} style={{ color: '#fbbf24' }} />
                <span>M2P2 Plasma Bubble Radius L</span>
              </span>
              <strong className="tabular" style={{ color: '#fbbf24' }}>{plasmaRadiusM.toFixed(1)} m</strong>
            </div>
            <input
              type="range"
              min="2.5"
              max="600"
              step="2.5"
              value={plasmaRadiusM}
              onChange={(e) => setPlasmaRadiusM(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              Pre-Hull Ion Deflection: {cascade.m2p2DeflectFrac.toFixed(1)}%
            </div>
          </div>

          <div className="sensor-stat-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Gem size={13} strokeWidth={1.75} style={{ color: '#38bdf8' }} />
                <span>Crystal H₂-BNNT Density</span>
              </span>
              <strong className="tabular" style={{ color: '#38bdf8' }}>{crystalHwtPct} wt% H</strong>
            </div>
            <input
              type="range"
              min="8"
              max="25"
              step="1"
              value={crystalHwtPct}
              onChange={(e) => setCrystalHwtPct(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              Zero-spallation nuclear stopping power
            </div>
          </div>

          <div className="sensor-stat-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Atom size={13} strokeWidth={1.75} style={{ color: '#a78bfa' }} />
                <span>¹⁵⁷Gd + Bi₂O₃ Micro-Gamma Trap</span>
              </span>
              <strong className="tabular" style={{ color: '#a78bfa' }}>{gammaTrapEffPct}%</strong>
            </div>
            <input
              type="range"
              min="40"
              max="98"
              step="1"
              value={gammaTrapEffPct}
              onChange={(e) => setGammaTrapEffPct(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              Internal capture photon scavenging
            </div>
          </div>

          <div className="sensor-stat-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Dna size={13} strokeWidth={1.75} style={{ color: '#10b981' }} />
                <span>Tardigrade Dsup DNA Hardening</span>
              </span>
              <strong className="tabular" style={{ color: '#10b981' }}>{dsupBioPct}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="88"
              step="2"
              value={dsupBioPct}
              onChange={(e) => setDsupBioPct(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              Chromatin ROS &amp; DSB break shielding
            </div>
          </div>
        </div>

        {/* Frontier Outcomes Strip */}
        <div className="dna-kinetics-row">
          <div className="dna-stat-box red">
            <div className="dna-lbl">Unshielded Raw Environment</div>
            <div className="dna-val tabular">{cascade.rawUnshielded.toFixed(2)} <span style={{ fontSize: 12 }}>mSv/d</span></div>
            <div className="dna-sub">Active mission hazard input</div>
          </div>
          <div className="dna-stat-box">
            <div className="dna-lbl">Stage 1: 2026 Odaa-Aegis</div>
            <div className="dna-val tabular">{cascade.stage1Rate.toFixed(2)} <span style={{ fontSize: 12 }}>mSv/d</span></div>
            <div className="dna-sub">Ready today (TRL 6–7 prototype)</div>
          </div>
          <div className="dna-stat-box amber">
            <div className="dna-lbl">Stage 3: Post-M2P2 Hull</div>
            <div className="dna-val tabular">{cascade.stage3Rate.toFixed(3)} <span style={{ fontSize: 12 }}>mSv/d</span></div>
            <div className="dna-sub">Pre-hull plasma GeV retracement</div>
          </div>
          <div className="dna-stat-box green">
            <div className="dna-lbl">Stage 4: Clinical Equivalent</div>
            <div className="dna-val tabular">{cascade.stage4ClinicalRate.toFixed(4)} <span style={{ fontSize: 12 }}>mSv/d</span></div>
            <div className="dna-sub">Effective Biological Suppression: <strong>{cascade.netSuppressionPct.toFixed(2)}%</strong></div>
          </div>
          <div className="dna-stat-box purple">
            <div className="dna-lbl">Continuous Safe Deep-Space Endurance</div>
            <div className="dna-val tabular">{cascade.safeYearsBeforePel >= 999 ? '999+' : cascade.safeYearsBeforePel.toFixed(0)} <span style={{ fontSize: 12 }}>yrs</span></div>
            <div className="dna-sub">Before reaching 250 mSv NASA PEL</div>
          </div>
        </div>

        <PlotlyChart
          id="chartFutureWaterfall"
          traces={waterfallTraces}
          layout={{
            xaxis: { automargin: true, title: { text: 'Multi-Generation Barrier Stack Progression', standoff: 18 } },
            yaxis: { automargin: true, type: 'log', title: { text: 'Surviving Dose Rate (mSv/day, Log Scale)', standoff: 22 } }
          }}
        />
      </div>

      {/* 4-Stage Scientific & TRL Dossier Cards */}
      <div className="chart-card">
        <div className="card-header-bar">
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Microscope size={16} strokeWidth={1.75} style={{ color: '#34d399', flexShrink: 0 }} />
              <span>4-Stage Architecture Breakdown (From 2026 Prototype to 2045+ Immunity)</span>
            </h3>
            <p className="desc" style={{ marginBottom: 0, maxWidth: '66ch' }}>
              Every stage explicitly states its physical mechanism, NASA Technology Readiness Level (TRL), and why multi-domain layering defeats the GeV GCR barrier.
            </p>
          </div>
          <div className="table-stats-badge">TRL-Labeled Transparent Vision</div>
        </div>

        <div className="dossier-grid" style={{ marginTop: 14 }}>
          {ROADMAP_STAGES.map(st => (
            <div className="dossier-card" key={st.id}>
              <div className="dossier-top">
                <span className="dossier-id"><code>{st.era}</code></span>
                <span className="status-pill status-ok">{st.trl}</span>
              </div>
              <h4 className="dossier-name">{st.title}</h4>
              <div className="dossier-instruments">
                <strong>Target Gain:</strong> <span style={{ color: '#34d399' }}>{st.protection}</span>
              </div>
              <div className="dossier-scope">
                <strong>Mechanism:</strong> {st.mechanism}
              </div>
              <div className="dossier-role">
                <strong>Honest Physics Limit:</strong> {st.whyNot100}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
