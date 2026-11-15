import React, { useEffect, useRef, useState } from 'react';
import { Activity, AlertTriangle, Camera, Cpu, Power, Radio, Usb } from 'lucide-react';

/**
 * Parses a line from an external USB/Serial radiation sensor (Arduino, ESP32, GMC-300, PocketGeiger).
 * Accepts JSON payloads, tagged strings (`CPM:42`, `USVH:0.24`), or bare numeric CPM values.
 */
function parseSerialTelemetryLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed);
      const cpm = Number(obj.cpm ?? obj.CPM);
      const uSvH = Number(obj.usvh ?? obj.uSvH ?? obj.microsievert_h);
      const mSvD = Number(obj.msvd ?? obj.mSvD ?? obj.rate_msv_day);
      if (Number.isFinite(mSvD)) return { cpm: Number.isFinite(cpm) ? cpm : mSvD / 0.00018, uSvH: mSvD * 41.67, mSvDay: mSvD };
      if (Number.isFinite(uSvH)) return { cpm: Number.isFinite(cpm) ? cpm : uSvH / 0.0075, uSvH, mSvDay: uSvH * 0.024 };
      if (Number.isFinite(cpm)) return { cpm, uSvH: cpm * 0.0075, mSvDay: cpm * 0.00018 };
    } catch {
      return null;
    }
  }

  const msvMatch = trimmed.match(/(?:MSVD|MSV_D|DOSE)\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (msvMatch) {
    const mSvDay = parseFloat(msvMatch[1]);
    return { cpm: mSvDay / 0.00018, uSvH: mSvDay * 41.67, mSvDay };
  }

  const usvMatch = trimmed.match(/(?:USVH|USV|RATE)\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (usvMatch) {
    const uSvH = parseFloat(usvMatch[1]);
    return { cpm: uSvH / 0.0075, uSvH, mSvDay: uSvH * 0.024 };
  }

  const cpmMatch = trimmed.match(/(?:CPM|COUNT|CPS)\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (cpmMatch) {
    const val = parseFloat(cpmMatch[1]);
    const isCps = /CPS/i.test(trimmed);
    const cpm = isCps ? val * 60.0 : val;
    return { cpm, uSvH: cpm * 0.0075, mSvDay: cpm * 0.00018 };
  }

  if (/^[0-9]+(?:\.[0-9]+)?$/.test(trimmed)) {
    const cpm = parseFloat(trimmed);
    return { cpm, uSvH: cpm * 0.0075, mSvDay: cpm * 0.00018 };
  }

  return null;
}

export default function SensorBridge({ onExternalReading, simFluxRate }) {
  const serialSupported = typeof navigator !== 'undefined' && 'serial' in navigator;
  const cameraSupported =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const [baudRate, setBaudRate] = useState(9600);
  const [serialStatus, setSerialStatus] = useState('IDLE');
  const [serialLog, setSerialLog] = useState([]);
  const [serialReading, setSerialReading] = useState(null);
  const [injectToKalman, setInjectToKalman] = useState(false);

  const serialPortRef = useRef(null);
  const serialReaderRef = useRef(null);
  const serialKeepReadingRef = useRef(false);

  const [cmosActive, setCmosActive] = useState(false);
  const [cmosPhase, setCmosPhase] = useState('IDLE');
  const [cmosError, setCmosError] = useState('');
  const [cmosThreshold, setCmosThreshold] = useState(55);
  const cmosThresholdRef = useRef(55);
  const [cmosMetrics, setCmosMetrics] = useState({
    framesProcessed: 0,
    hotMaskCount: 0,
    spikeEvents: 0,
    meanDarkLuma: 0,
    maxLumaSeen: 0,
    cpm: 0,
    lastHitAt: null
  });

  useEffect(() => {
    cmosThresholdRef.current = cmosThreshold;
  }, [cmosThreshold]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const rafRef = useRef(null);
  const cmosInternalRef = useRef({
    startTime: 0,
    framesProcessed: 0,
    hotPixels: new Set(),
    spikeTimestamps: [],
    lastSpikeFrame: -15,
    maxLumaSeen: 0
  });

  const disconnectSerial = async () => {
    serialKeepReadingRef.current = false;
    try {
      if (serialReaderRef.current) {
        await serialReaderRef.current.cancel();
        serialReaderRef.current.releaseLock();
        serialReaderRef.current = null;
      }
    } catch {
      // Ignore cancel race on closed port
    }
    try {
      if (serialPortRef.current) {
        await serialPortRef.current.close();
        serialPortRef.current = null;
      }
    } catch {
      // Ignore close race
    }
    setSerialStatus('IDLE');
    setSerialReading(null);
    if (onExternalReading && !cmosActive) onExternalReading(null);
  };

  const connectSerialGeiger = async () => {
    if (!serialSupported) return;
    try {
      setSerialStatus('CONNECTING');
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate });
      serialPortRef.current = port;
      serialKeepReadingRef.current = true;
      setSerialStatus('CONNECTED');

      const decoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(decoder.writable).catch(() => {});
      const reader = decoder.readable.getReader();
      serialReaderRef.current = reader;

      let buffer = '';
      while (serialKeepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? '';
          for (const rawLine of lines) {
            const parsed = parseSerialTelemetryLine(rawLine);
            if (parsed) {
              const ts = new Date().toLocaleTimeString();
              setSerialReading({ ...parsed, raw: rawLine.trim(), ts });
              setSerialLog(prev => [`[${ts}] ${rawLine.trim()} -> ${parsed.cpm.toFixed(1)} CPM (${parsed.uSvH.toFixed(3)} uSv/h)`, ...prev].slice(0, 6));
            }
          }
        }
      }
      await readableStreamClosed;
    } catch (err) {
      setSerialStatus(err?.name === 'NotFoundError' ? 'IDLE' : 'ERROR');
      setSerialLog(prev => [`[USB INFO] ${err?.message || 'Port selection cancelled.'}`, ...prev].slice(0, 6));
    }
  };

  const stopCmosMonitor = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCmosActive(false);
    setCmosPhase('IDLE');
  };

  const startCmosMonitor = async () => {
    if (!cameraSupported) return;
    setCmosError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 160 }, height: { ideal: 120 }, facingMode: 'environment' },
        audio: false
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      cmosInternalRef.current = {
        startTime: performance.now(),
        framesProcessed: 0,
        hotPixels: new Set(),
        spikeTimestamps: [],
        lastSpikeFrame: -15,
        maxLumaSeen: 0
      };
      setCmosActive(true);
      setCmosPhase('CALIBRATING');

      const scanFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !mediaStreamRef.current) return;

        const w = 160;
        const h = 120;
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, w, h);
        const frame = ctx.getImageData(0, 0, w, h).data;
        const state = cmosInternalRef.current;
        state.framesProcessed += 1;
        const now = performance.now();
        const elapsedSec = (now - state.startTime) / 1000.0;
        const isCalibrating = elapsedSec < 3.0;
        const thresh = cmosThresholdRef.current;

        let lumaSum = 0;
        let brightUncoveredCount = 0;
        let transientSpikePixels = 0;
        let frameMaxLuma = 0;
        const pixelCount = w * h;

        for (let i = 0; i < frame.length; i += 4) {
          const idx = i >> 2;
          const luma = 0.299 * frame[i] + 0.587 * frame[i + 1] + 0.114 * frame[i + 2];
          lumaSum += luma;
          if (luma > frameMaxLuma) frameMaxLuma = luma;
          if (luma > 95) brightUncoveredCount += 1;

          if (isCalibrating) {
            if (luma > Math.max(30, thresh - 10)) {
              state.hotPixels.add(idx);
            }
          } else if (luma > thresh && !state.hotPixels.has(idx)) {
            transientSpikePixels += 1;
          }
        }

        const meanDarkLuma = lumaSum / pixelCount;
        const lensCovered = meanDarkLuma < 22 && brightUncoveredCount < pixelCount * 0.05;
        state.maxLumaSeen = Math.max(state.maxLumaSeen, frameMaxLuma);

        if (!isCalibrating) {
          setCmosPhase(lensCovered ? 'MONITORING' : 'LENS_EXPOSED');
          if (
            lensCovered &&
            transientSpikePixels >= 1 &&
            transientSpikePixels <= 60 &&
            state.framesProcessed - state.lastSpikeFrame > 8
          ) {
            state.lastSpikeFrame = state.framesProcessed;
            state.spikeTimestamps.push(now);
          }
        } else {
          setCmosPhase('CALIBRATING');
        }

        const windowStart = now - 60000;
        state.spikeTimestamps = state.spikeTimestamps.filter(t => t >= windowStart);
        const minutesActive = Math.max(0.15, Math.min(1.0, (elapsedSec - 3.0) / 60.0));
        const cpm = elapsedSec > 3.5 ? state.spikeTimestamps.length / minutesActive : 0;

        if (state.framesProcessed % 6 === 0) {
          setCmosMetrics({
            framesProcessed: state.framesProcessed,
            hotMaskCount: state.hotPixels.size,
            spikeEvents: state.spikeTimestamps.length,
            meanDarkLuma,
            maxLumaSeen: state.maxLumaSeen,
            cpm,
            lastHitAt: state.spikeTimestamps.length ? new Date().toLocaleTimeString() : null
          });
        }

        rafRef.current = requestAnimationFrame(scanFrame);
      };

      rafRef.current = requestAnimationFrame(scanFrame);
    } catch (err) {
      setCmosPhase('ERROR');
      setCmosError(err?.message || 'Camera permission denied or no camera available.');
      stopCmosMonitor();
    }
  };

  useEffect(() => {
    if (!onExternalReading) return;
    if (!injectToKalman) {
      onExternalReading(null);
      return;
    }
    if (serialStatus === 'CONNECTED' && serialReading) {
      onExternalReading({
        source: 'USB_SERIAL_GEIGER',
        cpm: serialReading.cpm,
        uSvH: serialReading.uSvH,
        mSvDay: serialReading.mSvDay,
        ts: serialReading.ts
      });
    } else if (cmosActive && cmosPhase === 'MONITORING') {
      const mSvDay = cmosMetrics.cpm * 0.00018;
      onExternalReading({
        source: 'CMOS_DARK_FRAME',
        cpm: cmosMetrics.cpm,
        uSvH: cmosMetrics.cpm * 0.0075,
        mSvDay,
        ts: cmosMetrics.lastHitAt || new Date().toLocaleTimeString()
      });
    } else {
      onExternalReading(null);
    }
  }, [injectToKalman, serialStatus, serialReading, cmosActive, cmosPhase, cmosMetrics, onExternalReading]);

  useEffect(() => {
    return () => {
      serialKeepReadingRef.current = false;
      if (serialReaderRef.current) serialReaderRef.current.cancel().catch(() => {});
      if (serialPortRef.current) serialPortRef.current.close().catch(() => {});
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="chart-card">
      <div className="card-header-bar" style={{ marginBottom: 14 }}>
        <div>
          <h3 style={{ marginBottom: 4 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Cpu size={17} color="#38BDF8" /> Live Hardware Sensor Bridge &amp; Microchip Physics Clarifier
            </span>
          </h3>
          <p className="desc" style={{ marginBottom: 0 }}>
            Connect a physical USB Geiger/PIN-diode sensor, run an experimental covered-lens camera CMOS dark-frame test, or inspect why phone chips alone cannot monitor deep-space neutron cascades.
          </p>
        </div>
        <div className="table-stats-badge">
          Model Cabin Flux: {simFluxRate.toFixed(2)} mSv/day
        </div>
      </div>

      {/* Honest Technical Fact Banner */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 10,
          background: 'rgba(212, 175, 55, 0.09)',
          border: '1px solid rgba(212, 175, 55, 0.36)',
          marginBottom: 16,
          fontSize: '12.5px',
          lineHeight: 1.55,
          color: '#e2e8f0'
        }}
      >
        <strong style={{ color: '#fde68a' }}>Truth-in-Engineering Check:</strong>{' '}
        Clicking <strong>Geiger Audio</strong> generates real-time acoustic pulses from GadaSpace&apos;s simulated orbital dose engine (and live NOAA GOES-18 solar flare streams) — it is <strong>not</strong> reading an internal smartphone chip. Browsers cannot read baseband silicon radiation counters, and Earth&apos;s atmosphere (<code>~1,033 g/cm²</code>) blocks space protons/HZE ions. To stream real physical counts into GadaSpace, choose either genuine hardware bridge below:
      </div>

      <div className="sensor-bridge-grid">
        {/* Channel A: Real USB Serial Geiger / Microcontroller */}
        <div className="sensor-subcard">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5 }}>
              <Usb size={16} /> 1. USB Hardware Geiger / PIN Diode (Web Serial)
            </span>
            <span className={`status-pill ${serialStatus === 'CONNECTED' ? 'status-ok' : serialStatus === 'ERROR' ? 'status-crit' : 'status-warn'}`}>
              {serialStatus}
            </span>
          </div>

          <p className="desc" style={{ marginBottom: 4, fontSize: 12 }}>
            Plug in a physical Arduino, ESP32, or USB Geiger counter streaming plain text (<code>CPM:42</code>, <code>USVH:0.28</code>, or JSON) over serial.
          </p>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(Number(e.target.value))}
              disabled={serialStatus === 'CONNECTED'}
              style={{ padding: '6px 10px', borderRadius: 7, background: '#0f172a', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.3)', fontSize: 12 }}
            >
              <option value={9600}>9600 baud</option>
              <option value={115200}>115200 baud</option>
            </select>

            {serialStatus !== 'CONNECTED' ? (
              <button
                type="button"
                className="sensor-btn"
                disabled={!serialSupported}
                onClick={connectSerialGeiger}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Usb size={13} strokeWidth={1.75} />
                <span>{serialSupported ? 'Connect USB Sensor' : 'Web Serial Requires Chrome/Edge'}</span>
              </button>
            ) : (
              <button
                type="button"
                className="sensor-btn warn"
                onClick={disconnectSerial}
              >
                <Power size={14} /> Disconnect USB
              </button>
            )}
          </div>

          {serialReading ? (
            <div style={{ padding: 10, borderRadius: 8, background: 'rgba(16, 185, 129, 0.12)', fontSize: 12, color: '#a7f3d0' }}>
              <strong>Live USB Packet ({serialReading.ts}):</strong>{' '}
              <span className="tabular">{serialReading.cpm.toFixed(1)} CPM &bull; {serialReading.uSvH.toFixed(3)} µSv/h ({serialReading.mSvDay.toFixed(4)} mSv/day)</span>
            </div>
          ) : (
            <div style={{ padding: 10, borderRadius: 8, background: 'rgba(15, 23, 42, 0.55)', fontSize: 11.5, color: '#94a3b8' }}>
              Awaiting USB serial telemetry. Best option for live hardware instrumentation during hackathon demos.
            </div>
          )}

          {serialLog.length > 0 && (
            <pre style={{ margin: 0, padding: 8, borderRadius: 8, background: '#030712', color: '#7dd3fc', fontSize: 11, maxHeight: 84, overflowY: 'auto' }}>
              {serialLog.join('\n')}
            </pre>
          )}
        </div>

        {/* Channel B: Experimental Covered-Lens CMOS Chip Mode */}
        <div className="sensor-subcard gold">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#fde68a', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5 }}>
              <Camera size={16} /> 2. Covered-Lens CMOS Microchip Scan (Experimental)
            </span>
            <span className={`status-pill ${cmosPhase === 'MONITORING' ? 'status-ok' : cmosPhase === 'ERROR' ? 'status-crit' : 'status-warn'}`}>
              {cmosPhase}
            </span>
          </div>

          <p className="desc" style={{ marginBottom: 4, fontSize: 12, maxWidth: '66ch' }}>
            Tape black electrical tape tightly over a phone/webcam lens to block visible photons; samples Silicon CMOS dark frames for isolated ionization spikes after masking thermal hot pixels.
          </p>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {!cmosActive ? (
              <button
                type="button"
                className="sensor-btn"
                disabled={!cameraSupported}
                onClick={startCmosMonitor}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Camera size={13} strokeWidth={1.75} />
                <span>{cameraSupported ? 'Start Dark-Frame CMOS Scan' : 'Camera API Unavailable'}</span>
              </button>
            ) : (
              <button
                type="button"
                className="sensor-btn warn"
                onClick={stopCmosMonitor}
              >
                Stop CMOS Scan
              </button>
            )}

            <label style={{ fontSize: 11.5, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
              Spike Luma &ge; {cmosThreshold}
              <input
                type="range"
                min={25}
                max={120}
                step={5}
                value={cmosThreshold}
                onChange={(e) => setCmosThreshold(Number(e.target.value))}
                style={{ width: 82 }}
              />
            </label>
          </div>

          {cmosError && (
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(244, 63, 94, 0.14)', color: '#fecdd3', fontSize: 11.5 }}>
              {cmosError}
            </div>
          )}

          {cmosActive && cmosPhase === 'LENS_EXPOSED' && (
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(245, 158, 11, 0.16)', color: '#fde68a', fontSize: 11.5, display: 'flex', gap: 6, alignItems: 'center' }}>
              <AlertTriangle size={14} /> Ambient light detected (mean luma {cmosMetrics.meanDarkLuma.toFixed(1)}). Cover lens completely with opaque tape for dark-frame detection.
            </div>
          )}

          <div className="sensor-stat-grid">
            <div className="sensor-stat-box">
              <span>CMOS Est. Rate</span>
              <strong style={{ color: '#38bdf8' }}>{cmosMetrics.cpm.toFixed(2)} CPM</strong>
            </div>
            <div className="sensor-stat-box">
              <span>60s Pixel Bursts</span>
              <strong>{cmosMetrics.spikeEvents} hits</strong>
            </div>
            <div className="sensor-stat-box">
              <span>Masked Thermal px</span>
              <strong style={{ color: '#fde68a' }}>{cmosMetrics.hotMaskCount} px</strong>
            </div>
          </div>

          <video ref={videoRef} playsInline muted style={{ display: 'none' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>

      {/* Bottom Silicon Neutron Blind Spot Note + Kalman Overlay Toggle */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid rgba(148, 163, 184, 0.16)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          fontSize: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', maxWidth: 740 }}>
          <Radio size={15} color="#D4AF37" />
          <span>
            <strong>Why a Phone Microchip Can&apos;t Replace Space Detectors:</strong> Consumer Silicon (like <code>DET-01-SI</code>) only catches ~8% of secondary spallation neutrons (a -21.4% dose blind spot). Deep-space crews need GadaSpace&apos;s multi-detector Kalman fusion with <code>157Gd/3He</code> Neutron + TEPC chambers.
          </span>
        </div>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer', color: '#e0f2fe', fontWeight: 600 }}>
          <Activity size={15} color="#38bdf8" />
          <input
            type="checkbox"
            checked={injectToKalman}
            onChange={(e) => setInjectToKalman(e.target.checked)}
          />
          Display Connected Hardware Readout in DET-01 Row
        </label>
      </div>
    </div>
  );
}
