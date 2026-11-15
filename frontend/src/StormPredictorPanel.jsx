import React, { useMemo, useState } from 'react';
import {
  Radar,
  Satellite,
  History,
  RefreshCw,
  Radio,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Compass,
  TrendingUp,
  BookOpen,
  Brain
} from 'lucide-react';
import PlotlyChart from './PlotlyChart';
import {
  NASA_HISTORICAL_STORMS,
  NASA_MISSION_ARCHIVE,
  computeRadiationPrediction
} from './radiationPredictor';
import GeminiRadiationPanel from './GeminiRadiationPanel';
import SpaceTrajectory3DViewer from './SpaceTrajectory3DViewer';

export default function StormPredictorPanel({
  telemetry,
  isFetchingNoaa,
  onRefreshTelemetry,
  simState,
  onEngageOdaaAegis
}) {
  const [activeViewMode, setActiveViewMode] = useState('gemini_ai'); // 'gemini_ai' | 'ballistic_plots' | 'catalog'
  const [predictorMode, setPredictorMode] = useState('live'); // 'live' | 'historical_replay'
  const [selectedStormId, setSelectedStormId] = useState('oct_2003_halloween');
  const [catalogView, setCatalogView] = useState('spe'); // 'spe' | 'missions'

  const prediction = useMemo(() => {
    return computeRadiationPrediction({
      telemetry,
      mode: predictorMode,
      historicalStormId: selectedStormId,
      simState
    });
  }, [telemetry, predictorMode, selectedStormId, simState]);

  const forecastTraces = useMemo(() => {
    const s = prediction.forecastSeries;
    return [
      {
        x: s.hours,
        y: s.upperBand,
        mode: 'lines',
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'skip'
      },
      {
        x: s.hours,
        y: s.lowerBand,
        mode: 'lines',
        fill: 'tonexty',
        fillcolor: 'rgba(245, 158, 11, 0.16)',
        line: { width: 0 },
        name: '90% Analog Confidence Band'
      },
      {
        x: s.hours,
        y: s.obsFlux,
        mode: 'lines+markers',
        name: predictorMode === 'live' ? 'Observed GOES-18 (>=10 MeV pfu)' : 'Historical Precursor Rise',
        line: { color: '#38bdf8', width: 2.8 },
        marker: { size: 4 }
      },
      {
        x: s.hours,
        y: s.predFlux,
        mode: 'lines+markers',
        name: 'Predicted Proton Arrival Wave (>=10 MeV pfu)',
        line: { color: '#f59e0b', width: 3.2, dash: 'dash' },
        marker: { size: 5 }
      },
      {
        x: s.hours,
        y: s.shieldTriggerLine,
        mode: 'lines',
        name: 'NOAA S1 Auto-Defense Trigger (10 pfu)',
        line: { color: '#f43f5e', width: 2, dash: 'dot' }
      }
    ];
  }, [prediction, predictorMode]);

  const ascentZoneTraces = useMemo(() => {
    const zones = prediction.ascentForecast?.zones || [];
    const labels = zones.map(z => z.zone.split(' (')[0]);
    return [
      {
        x: labels,
        y: zones.map(z => Math.max(0.01, z.unshieldedMsvHr)),
        type: 'bar',
        name: 'Unshielded Deep-Space Exposure (mSv/hr)',
        marker: { color: '#f43f5e' }
      },
      {
        x: labels,
        y: zones.map(z => Math.max(0.01, z.passiveLeadMsvHr)),
        type: 'bar',
        name: 'Passive Metal Hull (Spallation + Bremsstrahlung)',
        marker: { color: '#fbbf24' }
      },
      {
        x: labels,
        y: zones.map(z => Math.max(0.01, z.odaaAegisMsvHr)),
        type: 'bar',
        name: 'GadaSpace Odaa-Aegis Whole-Vessel',
        marker: { color: '#10b981' }
      }
    ];
  }, [prediction.ascentForecast]);

  const cycleForecastTraces = useMemo(() => {
    const c = prediction.cycleHarmonic;
    if (!c) return [];
    return [
      {
        x: c.histLabels,
        y: c.histSsn,
        mode: 'lines',
        name: 'Observed NOAA/NASA SSN (1996–2026-10)',
        line: { color: '#38bdf8', width: 2.5 }
      },
      {
        x: c.projLabels,
        y: c.projSsn,
        mode: 'lines',
        name: 'Schwabe Harmonic Projection (2026–2036)',
        line: { color: '#fbbf24', width: 2.8, dash: 'dash' }
      },
      {
        x: [...c.histLabels, ...c.projLabels],
        y: [...c.histGcrMsvDay, ...c.projGcrMsvDay],
        mode: 'lines',
        yaxis: 'y2',
        name: 'Free-Space GCR Baseline (mSv/d, Inverse Cycle)',
        line: { color: '#a78bfa', width: 2.2 }
      }
    ];
  }, [prediction.cycleHarmonic]);

  const { parker, closestAnalog } = prediction;

  return (
    <>
      {/* Predictor Governing Physics Formula HUD */}
      <div className="formula-card">
        <div className="formula-card-top">
          <div className="f-badge">SPACE WEATHER PREDICTION &bull; PARKER SPIRAL &amp; NASA SPE ARCHIVE (1972&ndash;2024)</div>
          <div className="f-title">Flare-to-SEP Ballistic Warning &amp; Historical Analog Forecaster</div>
        </div>
        <div className="formula-display">
          <code>β(E) = &radic;[1 &minus; (1 + E/m<sub>p</sub>c&sup2;)<sup>&minus;2</sup>]</code>
          <span className="formula-sep">&bull;</span>
          <code>Δt<sub>warn</sub> = L<sub>Parker</sub>(V<sub>sw</sub>)/(β&middot;c) &minus; 8.32 min</code>
          <span className="formula-sep">&bull;</span>
          <code>T<sub>Bartels</sub> = 27.28 days</code>
        </div>
        <div className="formula-chips">
          <span className="f-chip"><strong>Early-Warning Physics:</strong> X-ray flashes arrive at light speed (8.3 min), beating 10&ndash;100 MeV protons along the {parker.lengthAu.toFixed(2)} AU Parker Spiral</span>
          <span className="f-chip"><strong>Real Inputs:</strong> GOES-18 Proton (&ge;10/&ge;100 MeV), GOES X-Ray (0.1&ndash;0.8 nm), DSCOVR L1 Wind &amp; IMF B<sub>z</sub></span>
          <span className="f-chip"><strong>Recurrence Harmonic:</strong> Active Region rotation cycle window in ~{prediction.bartelsRecurrenceDays.toFixed(1)} days</span>
        </div>
      </div>

      {/* 3-Way Top Predictor Navigation (Gemini AI / Ballistic Plots / Catalog) */}
      <div style={{ display: 'flex', gap: 8, margin: '14px 0', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`view-btn ${activeViewMode === 'gemini_ai' ? 'active' : ''}`}
          onClick={() => setActiveViewMode('gemini_ai')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            borderColor: activeViewMode === 'gemini_ai' ? '#c084fc' : undefined,
            color: activeViewMode === 'gemini_ai' ? '#e9d5ff' : undefined,
            background: activeViewMode === 'gemini_ai' ? 'rgba(167, 139, 250, 0.16)' : undefined,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 700
          }}
        >
          <Brain size={15} strokeWidth={2} style={{ color: '#c084fc' }} />
          <span>✦ Gemini AI Real-Time Heliophysics &amp; Radiation Forecaster</span>
        </button>
        <button
          type="button"
          className={`view-btn ${activeViewMode === 'trajectory_3d' ? 'active' : ''}`}
          onClick={() => setActiveViewMode('trajectory_3d')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            borderColor: activeViewMode === 'trajectory_3d' ? '#38bdf8' : undefined,
            color: activeViewMode === 'trajectory_3d' ? '#38bdf8' : undefined,
            background: activeViewMode === 'trajectory_3d' ? 'rgba(56, 189, 248, 0.16)' : undefined,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 700
          }}
        >
          <Compass size={15} strokeWidth={2} style={{ color: '#38bdf8' }} />
          <span>3D Spacecraft Trajectory Radiation Corridor (Moon &bull; Mars)</span>
        </button>
        <button
          type="button"
          className={`view-btn ${activeViewMode === 'ballistic_plots' ? 'active' : ''}`}
          onClick={() => setActiveViewMode('ballistic_plots')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', fontSize: 13 }}
        >
          <TrendingUp size={15} strokeWidth={1.75} />
          <span>Ballistic Wave Curves &amp; Parker Spiral Telemetry</span>
        </button>
        <button
          type="button"
          className={`view-btn ${activeViewMode === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveViewMode('catalog')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', fontSize: 13 }}
        >
          <BookOpen size={15} strokeWidth={1.75} />
          <span>NASA Historical SPE &amp; Mission Archive (1972–2026)</span>
        </button>
      </div>

      {/* VIEW 1: GEMINI AI REAL-TIME HELIOPHYSICS FORECASTER */}
      {activeViewMode === 'gemini_ai' && (
        <div style={{ marginBottom: 20 }}>
          <GeminiRadiationPanel
            telemetry={telemetry}
            simState={simState}
            onEngageOdaaAegis={onEngageOdaaAegis}
          />
        </div>
      )}

      {/* VIEW 2: 3D SPACECRAFT TRAJECTORY RADIATION CORRIDOR */}
      {activeViewMode === 'trajectory_3d' && (
        <div style={{ marginBottom: 20 }}>
          <SpaceTrajectory3DViewer
            telemetry={telemetry}
            simState={simState}
          />
        </div>
      )}

      {/* Predictor Controls & Live Space Weather Bar */}
      <div className="chart-card">
        <div className="card-header-bar" style={{ marginBottom: 14 }}>
          <div>
            <h3 style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radar size={16} strokeWidth={1.75} style={{ color: '#38bdf8', flexShrink: 0 }} />
              <span>Real-Data Solar Storm Predictor &amp; Historical Replay Engine</span>
            </h3>
            <p className="desc" style={{ marginBottom: 0 }}>
              Active Telemetry Source: <strong style={{ color: '#38bdf8' }}>{prediction.sourceLabel}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className={`view-btn ${predictorMode === 'live' ? 'active' : ''}`}
              onClick={() => setPredictorMode('live')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Satellite size={13} strokeWidth={1.75} />
              <span>Live NOAA Stream</span>
            </button>
            <button
              type="button"
              className={`view-btn ${predictorMode === 'historical_replay' ? 'active' : ''}`}
              onClick={() => setPredictorMode('historical_replay')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <History size={13} strokeWidth={1.75} />
              <span>Replay NASA Past Storm</span>
            </button>
            <button
              type="button"
              className="sensor-btn"
              onClick={onRefreshTelemetry}
              disabled={isFetchingNoaa}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={13} strokeWidth={1.75} />
              <span>{isFetchingNoaa ? 'Fetching NOAA...' : 'Sync NOAA SWPC'}</span>
            </button>
          </div>
        </div>

        {/* Plain-English "What Is Live NOAA" & Real Satellite Downlink Status */}
        <div
          style={{
            padding: '11px 14px',
            borderRadius: 10,
            marginBottom: 14,
            background: 'rgba(12, 17, 28, 0.85)',
            border: `1px solid ${telemetry.status === 'LIVE_NOAA_SWPC' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
            fontSize: 12,
            lineHeight: 1.5,
            color: '#cbd5e1'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
            <strong style={{ color: '#f8fafc', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Radio size={14} strokeWidth={1.75} style={{ color: '#38bdf8' }} />
              <span>What Is &ldquo;Live NOAA SWPC&rdquo; Telemetry?</span>
            </strong>
            <span className={`status-pill ${telemetry.status === 'LIVE_NOAA_SWPC' ? 'status-ok' : 'status-warn'}`}>
              {telemetry.status === 'LIVE_NOAA_SWPC'
                ? `LIVE SATELLITE UPLINK VERIFIED (${telemetry.liveStreamsCount || 6}/6 Feeds @ ${telemetry.fetchedAt})`
                : 'OFFLINE CYCLE-25 REFERENCE MODE'}
            </span>
          </div>
          <div style={{ maxWidth: '66ch' }}>
            <strong>NOAA SWPC</strong> is the U.S. government <em>Space Weather Prediction Center</em>. When GadaSpace opens, your browser connects directly to live space-weather satellites via public JSON feeds (<code>services.swpc.noaa.gov</code>):{' '}
            <strong>GOES-18</strong> (solar protons &amp; X-rays), <strong>GOES-19</strong> (Outer Van Allen electrons),{' '}
            <strong>DSCOVR at L1</strong> (solar wind speed &amp; magnetic field 1.5M km upstream), and{' '}
            <strong>1749&ndash;2026 Solar Cycle Archive</strong> ({telemetry?.solarCycleStats?.totalMonthsRecorded ?? 3334} months).
          </div>
        </div>

        {predictorMode === 'historical_replay' && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: '#090e1a', border: '1px solid rgba(251, 191, 36, 0.28)' }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#fde68a' }}>
              Select Verified Historical NASA Solar Proton Event:
            </label>
            <select
              value={selectedStormId}
              onChange={(e) => setSelectedStormId(e.target.value)}
              style={{ flex: 1, minWidth: 260, padding: '7px 10px', borderRadius: 8, background: '#0f172a', color: '#f8fafc', border: '1px solid rgba(148,163,184,0.3)', fontSize: 12.5 }}
            >
              {NASA_HISTORICAL_STORMS.map(st => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.peak10MeVPfu.toLocaleString()} pfu • {st.flareClass})
                </option>
              ))}
            </select>
            {onEngageOdaaAegis && (
              <button
                type="button"
                className="sensor-btn"
                onClick={() => onEngageOdaaAegis(prediction.selectedHistStorm)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Zap size={13} strokeWidth={1.75} />
                <span>Engage Odaa-Aegis vs. This Historical Storm</span>
              </button>
            )}
          </div>
        )}

        {/* Live Telemetry Summary Strip (6 Real NOAA/NASA Streams + OLS Fit) */}
        <div className="sensor-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: 14 }}>
          <div className="sensor-stat-box">
            <span>GOES &ge;10 / &ge;100 MeV Protons</span>
            <strong className="tabular" style={{ color: '#38bdf8' }}>{prediction.inputSummary.proton10Pfu.toFixed(2)} / {prediction.inputSummary.proton100Pfu.toFixed(2)} pfu</strong>
          </div>
          <div className="sensor-stat-box">
            <span>OLS Power-Law Index &gamma; (8-Band)</span>
            <strong className="tabular" style={{ color: '#a78bfa' }}>&gamma; = {prediction.protonGammaIndex.toFixed(2)} (R&sup2;={prediction.protonFitR2.toFixed(2)})</strong>
          </div>
          <div className="sensor-stat-box">
            <span>GOES-19 Outer Belt (&ge;2 MeV e⁻)</span>
            <strong className="tabular" style={{ color: prediction.electron2MeVPfu >= 1000 ? '#f43f5e' : '#34d399' }}>
              {prediction.electron2MeVPfu.toLocaleString(undefined, { maximumFractionDigits: 1 })} pfu
            </strong>
          </div>
          <div className="sensor-stat-box">
            <span>Cycle 25 F10.7 / GCR &Phi;</span>
            <strong className="tabular" style={{ color: '#fbbf24' }}>
              {(telemetry?.solarCycleStats?.latestF107 ?? 108.5).toFixed(1)} sfu / {prediction.phiLiveMv.toFixed(0)} MV
            </strong>
          </div>
          <div className="sensor-stat-box">
            <span>24h Peak X-Ray / Wind / B<sub>z</sub></span>
            <strong className="tabular" style={{ color: '#34d399' }}>
              {prediction.inputSummary.flareClass} &bull; {prediction.inputSummary.solarWindKms.toFixed(0)} km/s ({prediction.inputSummary.bzNt.toFixed(1)} nT)
            </strong>
          </div>
          <div className="sensor-stat-box">
            <span>Stream Provenance</span>
            <strong style={{ color: telemetry.status === 'LIVE_NOAA_SWPC' && predictorMode === 'live' ? '#10b981' : '#fbbf24', fontSize: 12 }}>
              {predictorMode === 'historical_replay' ? 'HISTORICAL CATALOG' : `${telemetry.status} (${telemetry.liveStreamsCount || 0}/6)`}
            </strong>
          </div>
        </div>

        {/* Prediction Outputs Row */}
        <div className="dna-kinetics-row">
          <div className="dna-stat-box">
            <div className="dna-lbl">24h / 72h Storm Probability</div>
            <div className="dna-val tabular">{prediction.p24hStormPct.toFixed(1)}% <span style={{ fontSize: 12 }}>(24h)</span></div>
            <div className="dna-sub">72h Severe S3+ Hazard Risk: {prediction.p72hMajorPct.toFixed(1)}%</div>
          </div>
          <div className="dna-stat-box amber">
            <div className="dna-lbl">Early-Warning Action Window</div>
            <div className="dna-val tabular">{parker.advanceWarningMin.toFixed(0)} min</div>
            <div className="dna-sub">100 MeV hits in {parker.arrival100MeVMin.toFixed(0)}m; 10 MeV peak in {(parker.arrival10MeVMin / 60).toFixed(2)}h after X-ray</div>
          </div>
          <div className="dna-stat-box red">
            <div className="dna-lbl">Predicted Peak Flux &amp; Class</div>
            <div className="dna-val tabular" style={{ color: prediction.predictedScale.color }}>
              {prediction.predictedPeakPfu >= 1000 ? `${(prediction.predictedPeakPfu / 1000).toFixed(1)}k` : prediction.predictedPeakPfu.toFixed(1)} pfu
            </div>
            <div className="dna-sub">NOAA Scale: {prediction.predictedScale.label}</div>
          </div>
          <div className="dna-stat-box purple">
            <div className="dna-lbl">Closest Historical Analog</div>
            <div className="dna-val tabular" style={{ fontSize: 15 }}>{closestAnalog.date}</div>
            <div className="dna-sub">{closestAnalog.flareClass} &bull; {closestAnalog.peak10MeVPfu.toLocaleString()} pfu</div>
          </div>
          <div className="dna-stat-box green">
            <div className="dna-lbl">Protected vs. Unshielded Peak</div>
            <div className="dna-val tabular">{prediction.predictedProtectedPeakMsvDay.toFixed(2)} <span style={{ fontSize: 12 }}>mSv/d</span></div>
            <div className="dna-sub">vs {prediction.predictedUnshieldedPeakMsvDay.toFixed(1)} mSv/d unshielded ({prediction.doseReductionFactor.toFixed(1)}x cut)</div>
          </div>
        </div>

        {/* Auto-Defense Recommendation Banner */}
        <div
          style={{
            padding: '12px 15px',
            borderRadius: 10,
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            background: prediction.autoTriggerRecommended ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${prediction.autoTriggerRecommended ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.35)'}`
          }}
        >
          <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#e2e8f0' }}>
            <strong style={{ color: prediction.autoTriggerRecommended ? '#fda4af' : '#6ee7b7', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              {prediction.autoTriggerRecommended
                ? <AlertTriangle size={14} strokeWidth={1.75} />
                : <CheckCircle2 size={14} strokeWidth={1.75} />}
              <span>
                {prediction.autoTriggerRecommended
                  ? `AUTO-DEFENSE ALERT: Incoming SEP arrival predicted in ~${(parker.arrival10MeVMin / 60).toFixed(1)} hrs`
                  : 'SPACE WEATHER NOMINAL: Continuous GOES-18 + GOES-19 + DSCOVR Early-Warning Watch Active'}
              </span>
            </strong>
            <div style={{ maxWidth: '66ch' }}>
              {prediction.autoTriggerRecommended
                ? `GadaSpace recommends pumping crew Life-Support ¹⁰B-Water to perimeter bladders + ramping ReBCO magnetosphere (${simState.shieldingAdvanced?.magPowerKw > 0 ? 'currently ACTIVE' : 'currently OFF'}) before main 10 MeV wave strikes.`
                : `Nearest pattern match: ${closestAnalog.name}. Live Outer Belt >=2 MeV Electrons: ${prediction.electron2MeVPfu.toFixed(0)} pfu (${prediction.electron2MeVPfu >= 1000 ? 'ELEVATED GEO BREMSSTRAHLUNG' : 'Quiet'}).`}
            </div>
          </div>
          {onEngageOdaaAegis && (
            <button
              type="button"
              className="sensor-btn"
              onClick={() => onEngageOdaaAegis(predictorMode === 'historical_replay' ? prediction.selectedHistStorm : null)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Zap size={13} strokeWidth={1.75} />
              <span>Test Odaa-Aegis Auto-Defense Response</span>
            </button>
          )}
        </div>

        <PlotlyChart
          id="chartStormPredictor"
          traces={forecastTraces}
          layout={{
            xaxis: { automargin: true, title: { text: 'Forecast Timeline (Hours Relative to Present / Warning Flash: -48h to +72h)', standoff: 20 } },
            yaxis: { automargin: true, type: 'log', title: { text: 'Integral Proton Flux >=10 MeV (pfu, log10 scale)', standoff: 24 } }
          }}
        />
      </div>

      {/* WHERE, WHEN, AND HOW MUCH: Ascent & Deep-Space Trajectory Predictor */}
      {prediction.ascentForecast && (
        <div className="chart-card">
          <div className="card-header-bar" style={{ marginBottom: 14 }}>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Compass size={16} strokeWidth={1.75} style={{ color: '#38bdf8', flexShrink: 0 }} />
                <span>WHERE, WHEN &amp; HOW MUCH: Spatiotemporal Ascent &amp; Deep-Space Dose Predictor</span>
              </h3>
              <p className="desc" style={{ marginBottom: 0, maxWidth: '66ch' }}>
                Combines <strong>GOES-18 OLS Spectral Index (&gamma;={prediction.protonGammaIndex.toFixed(2)})</strong> + <strong>LIVE GOES-19 &ge;2 MeV Electrons ({prediction.electron2MeVPfu.toFixed(0)} pfu)</strong> + <strong>Cycle 25 &Phi;={prediction.phiLiveMv.toFixed(0)} MV</strong> across every mission altitude corridor.
              </p>
            </div>
            <div className="table-stats-badge tabular">
              75h TLI Cumulative: <strong style={{ color: '#34d399' }}>{prediction.ascentForecast.cumulative75hOdaaAegisMsv} mSv</strong> vs {prediction.ascentForecast.cumulative75hUnshieldedMsv} mSv raw
            </div>
          </div>

          <PlotlyChart
            id="chartAscentZones"
            traces={ascentZoneTraces}
            layout={{
              barmode: 'group',
              xaxis: { automargin: true, title: { text: 'Mission Altitude Corridor (WHERE)', standoff: 18 } },
              yaxis: { automargin: true, type: 'log', title: { text: 'Expected Equivalent Dose Rate (mSv/hour, Log Scale)', standoff: 22 } }
            }}
          />

          <div className="data-table-wrap" style={{ marginTop: 14 }}>
            <table className="sci-table">
              <thead>
                <tr>
                  <th>WHERE (Spatial Altitude Zone)</th>
                  <th>WHEN (Timing Window)</th>
                  <th>Physical Driver (Live Data)</th>
                  <th>Unshielded</th>
                  <th>Passive Lead/Al</th>
                  <th>Odaa-Aegis Whole-Vessel</th>
                  <th>Alert</th>
                </tr>
              </thead>
              <tbody>
                {prediction.ascentForecast.zones.map(z => (
                  <tr key={z.zone}>
                    <td><strong>{z.zone}</strong></td>
                    <td><code>{z.whenWindow}</code></td>
                    <td style={{ fontSize: 12, color: '#cbd5e1' }}>{z.whereDriver}</td>
                    <td className="tabular" style={{ color: '#fda4af' }}><strong>{z.unshieldedMsvHr} mSv/hr</strong></td>
                    <td className="tabular" style={{ color: '#fde68a' }}>{z.passiveLeadMsvHr} mSv/hr</td>
                    <td className="tabular" style={{ color: '#6ee7b7' }}><strong>{z.odaaAegisMsvHr} mSv/hr</strong></td>
                    <td>
                      <span className={`status-pill ${z.alertLevel === 'CRITICAL' ? 'status-crit' : z.alertLevel === 'ELEVATED' ? 'status-warn' : 'status-ok'}`}>
                        {z.alertLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 30-Year Real Solar Cycle Observations (1996-2026) + 2026-2036 Harmonic Projection */}
      {prediction.cycleHarmonic && (
        <div className="chart-card">
          <div className="card-header-bar" style={{ marginBottom: 14 }}>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={16} strokeWidth={1.75} style={{ color: '#fbbf24', flexShrink: 0 }} />
                <span>30-Year NASA/NOAA Solar Cycle Analysis (1996–2026) &amp; 2026–2036 GCR / SPE Outlook</span>
              </h3>
              <p className="desc" style={{ marginBottom: 0, maxWidth: '66ch' }}>
                Anchored to real NOAA/NASA <code>observed-solar-cycle-indices.json</code> ({telemetry?.solarCycleStats?.totalMonthsRecorded ?? 3334} months through <code>{telemetry?.solarCycleStats?.latestTag ?? '2026-10'}</code>) + Schwabe 11-year harmonic projection. Shows the inverse physics trap: <strong>GCR peaks at Solar Minimum ({prediction.cycleHarmonic.solarMinYear})</strong>, while <strong>SPE bursts peak at Cycle 26 ({prediction.cycleHarmonic.nextSpePeakYear})</strong>.
              </p>
            </div>
            <div className="table-stats-badge tabular">
              Cycle 25 Latest: SSN {telemetry?.solarCycleStats?.latestSsn ?? 45.7} &bull; F10.7 {telemetry?.solarCycleStats?.latestF107 ?? 108.5}
            </div>
          </div>

          <PlotlyChart
            id="chartCycleHarmonic"
            traces={cycleForecastTraces}
            layout={{
              xaxis: { automargin: true, title: { text: 'Year-Month (Real Observed 1996–2026 + Harmonic Forecast 2026–2036)', standoff: 18 } },
              yaxis: { automargin: true, title: { text: 'Monthly Sunspot Number (SSN)', standoff: 18 } },
              yaxis2: {
                automargin: true,
                overlaying: 'y',
                side: 'right',
                title: { text: 'Free-Space GCR Baseline (mSv/day)', standoff: 18 },
                showgrid: false
              }
            }}
          />
        </div>
      )}

      {/* Historical Catalog & NASA Mission Archive Switcher */}
      <div className="chart-card">
        <div className="card-header-bar">
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={16} strokeWidth={1.75} style={{ color: '#a78bfa', flexShrink: 0 }} />
              <span>
                {catalogView === 'spe'
                  ? 'Verified NASA / NOAA Benchmark Solar Proton Events (1972–2024 Catalog)'
                  : 'Historical NASA Mission Radiation Records (1972–2026 Empirical Archive)'}
              </span>
            </h3>
            <p className="desc" style={{ marginBottom: 0, maxWidth: '66ch' }}>
              {catalogView === 'spe'
                ? 'Real historical storms used to calibrate our analog matcher and stress-test whole-spacecraft protection across Solar Cycles 20–25.'
                : 'Published radiation measurements from Apollo, CRRES, ISS, LRO CRaTER, Van Allen Probes RBSP, and Curiosity MSL RAD.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`view-btn ${catalogView === 'spe' ? 'active' : ''}`}
              onClick={() => setCatalogView('spe')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Zap size={13} strokeWidth={1.75} />
              <span>SPE Storm Events ({NASA_HISTORICAL_STORMS.length})</span>
            </button>
            <button
              type="button"
              className={`view-btn ${catalogView === 'missions' ? 'active' : ''}`}
              onClick={() => setCatalogView('missions')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Satellite size={13} strokeWidth={1.75} />
              <span>Past NASA Missions ({NASA_MISSION_ARCHIVE.length})</span>
            </button>
          </div>
        </div>

        <div className="data-table-wrap" style={{ marginTop: 14 }}>
          {catalogView === 'spe' ? (
            <table className="sci-table">
              <thead>
                <tr>
                  <th>Historical Event</th>
                  <th>X-Ray Class</th>
                  <th>Peak &ge;10 MeV</th>
                  <th>Peak &ge;100 MeV</th>
                  <th>Solar Wind</th>
                  <th>NOAA Scale</th>
                  <th>Unshielded Rate</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {NASA_HISTORICAL_STORMS.map(st => (
                  <tr key={st.id}>
                    <td>
                      <strong>{st.name}</strong>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{st.impactNote}</div>
                    </td>
                    <td><code>{st.flareClass}</code></td>
                    <td><strong>{st.peak10MeVPfu.toLocaleString()} pfu</strong></td>
                    <td>{st.peak100MeVPfu.toLocaleString()} pfu</td>
                    <td>{st.solarWindKms} km/s</td>
                    <td><span className={`status-pill ${st.peak10MeVPfu >= 10000 ? 'status-crit' : 'status-warn'}`}>{st.noaaScale}</span></td>
                    <td><strong>{st.unshieldedDayMsv.toFixed(1)} mSv/d</strong></td>
                    <td>
                      <button
                        type="button"
                        className="sensor-btn"
                        onClick={() => {
                          setPredictorMode('historical_replay');
                          setSelectedStormId(st.id);
                          if (onEngageOdaaAegis) onEngageOdaaAegis(st);
                        }}
                      >
                        Replay &amp; Protect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="sci-table">
              <thead>
                <tr>
                  <th>NASA Mission &amp; Era</th>
                  <th>Spatial Regime</th>
                  <th>Flight Instrument</th>
                  <th>Measured Unshielded / Env</th>
                  <th>Primary Hazard</th>
                  <th>Engineering Proof in GadaSpace</th>
                </tr>
              </thead>
              <tbody>
                {NASA_MISSION_ARCHIVE.map(m => (
                  <tr key={m.id}>
                    <td><strong>{m.mission}</strong></td>
                    <td><code>{m.regime}</code></td>
                    <td>{m.instrument}</td>
                    <td style={{ color: '#fbbf24' }}><strong>{m.measuredUnshielded}</strong></td>
                    <td>{m.primaryHazard}</td>
                    <td style={{ fontSize: 12, color: '#cbd5e1' }}>{m.finding}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
