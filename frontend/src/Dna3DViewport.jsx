import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Dna,
  Rocket,
  SlidersHorizontal,
  Shield,
  Zap,
  RotateCcw,
  Play,
  Pause,
  AlertTriangle
} from 'lucide-react';

/**
 * Interactive 3D WebGL Double-Helix DNA Radiation Damage & Degradation Simulator
 * Visualizes live SSB/DSB cleavages, broken chromatin drift, NHEJ/HR enzyme repair,
 * and Tardigrade Dsup / Melanin protection as radiation exposure changes.
 */
export default function Dna3DViewport({ simState }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const [syncWithShip, setSyncWithShip] = useState(true);
  const [manualDoseMsvDay, setManualDoseMsvDay] = useState(18.0);
  const [dsupShieldOn, setDsupShieldOn] = useState(false);
  const [paused, setPaused] = useState(false);
  const [burstTrigger, setBurstTrigger] = useState(0);

  const activeDoseMsvDay = syncWithShip
    ? Math.max(0.1, simState?.stack?.totalRate ?? 1.5)
    : manualDoseMsvDay;

  const activeLetKevUm = Math.max(1.0, simState?.effLet ?? 12.0);
  const secNeutronFrac = simState?.stack
    ? Math.min(0.85, (simState.stack.secNeutron || 0) / Math.max(0.05, simState.stack.totalRate || 1))
    : 0.25;

  // Live metrics synchronized smoothly from the 3D WebGL helix buffer without React churn
  const [liveHudStats, setLiveHudStats] = useState({
    integrityPct: 98.5,
    intactPairs: 28,
    ssbCount: 0,
    dsbCount: 0,
    degradedPairs: 0,
    cellularState: 'HOMEOSTATIC REPAIR'
  });

  const liveParamsRef = useRef({
    doseMsvDay: activeDoseMsvDay,
    letKevUm: activeLetKevUm,
    secNeutronFrac,
    dsupShieldOn,
    paused
  });

  useEffect(() => {
    liveParamsRef.current = {
      doseMsvDay: activeDoseMsvDay,
      letKevUm: activeLetKevUm,
      secNeutronFrac,
      dsupShieldOn,
      paused
    };
  }, [activeDoseMsvDay, activeLetKevUm, secNeutronFrac, dsupShieldOn, paused]);

  const dnaControlsRef = useRef({ resetHelix: null, triggerFlareBurst: null });

  useEffect(() => {
    if (burstTrigger > 0 && dnaControlsRef.current.triggerFlareBurst) {
      dnaControlsRef.current.triggerFlareBurst();
    }
  }, [burstTrigger]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 780;
    const height = container.clientHeight || 430;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040814);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 200);
    camera.position.set(0.4, 1.5, 11.2);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4.5;
    controls.maxDistance = 24.0;
    controls.target.set(0, 0, 0);

    // Biophysical Lighting
    scene.add(new THREE.AmbientLight(0x94a3b8, 0.85));
    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 2.2);
    keyLight.position.set(8, 10, 10);
    scene.add(keyLight);

    const warmBackLight = new THREE.PointLight(0xf59e0b, 1.8, 30);
    warmBackLight.position.set(-7, -4, -6);
    scene.add(warmBackLight);

    const bioCoreLight = new THREE.PointLight(0x38bdf8, 1.6, 20);
    bioCoreLight.position.set(0, 0, 5);
    scene.add(bioCoreLight);

    // Root DNA Assembly Group
    const dnaGroup = new THREE.Group();
    scene.add(dnaGroup);

    const NUM_PAIRS = 28;
    const HELIX_RADIUS = 1.45;
    const HELIX_PITCH = 0.32;
    const Y_OFFSET = -((NUM_PAIRS - 1) * HELIX_PITCH) / 2;

    const matBackboneA = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0369a1, emissiveIntensity: 0.45, roughness: 0.25, metalness: 0.45 });
    const matBackboneB = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0x92400e, emissiveIntensity: 0.45, roughness: 0.25, metalness: 0.45 });
    const sphereGeoNode = new THREE.SphereGeometry(0.15, 16, 16);
    const bondGeoSeg = new THREE.CylinderGeometry(0.06, 0.06, 0.9, 10);
    bondGeoSeg.rotateZ(Math.PI / 2);

    // Base pair array tracking live structural health, break timers & drift vectors
    const pairs = [];
    for (let i = 0; i < NUM_PAIRS; i++) {
      const theta = i * 0.44;
      const y = Y_OFFSET + i * HELIX_PITCH;
      const ax = Math.cos(theta) * HELIX_RADIUS;
      const az = Math.sin(theta) * HELIX_RADIUS;
      const bx = Math.cos(theta + Math.PI) * HELIX_RADIUS;
      const bz = Math.sin(theta + Math.PI) * HELIX_RADIUS;

      const nodeA = new THREE.Mesh(sphereGeoNode, matBackboneA.clone());
      nodeA.position.set(ax, y, az);
      const nodeB = new THREE.Mesh(sphereGeoNode, matBackboneB.clone());
      nodeB.position.set(bx, y, bz);

      // Left & Right Hydrogen-bonded nucleotide half-rungs so DSBs literally snap apart in the center
      const matRungL = new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x059669, emissiveIntensity: 0.4, roughness: 0.3 });
      const matRungR = new THREE.MeshStandardMaterial({ color: 0x818cf8, emissive: 0x4338ca, emissiveIntensity: 0.4, roughness: 0.3 });

      const rungGroup = new THREE.Group();
      rungGroup.position.set(0, y, 0);
      rungGroup.rotation.y = -theta;

      const rungL = new THREE.Mesh(bondGeoSeg, matRungL);
      rungL.position.set(-0.62, 0, 0);
      rungL.scale.set(1.25, 1, 1);

      const rungR = new THREE.Mesh(bondGeoSeg, matRungR);
      rungR.position.set(0.62, 0, 0);
      rungR.scale.set(1.25, 1, 1);

      rungGroup.add(rungL, rungR);
      dnaGroup.add(nodeA, nodeB, rungGroup);

      pairs.push({
        idx: i,
        theta,
        baseY: y,
        baseAx: ax,
        baseAz: az,
        baseBx: bx,
        baseBz: bz,
        nodeA,
        nodeB,
        rungGroup,
        rungL,
        rungR,
        status: 'INTACT', // 'INTACT' | 'SSB' | 'DSB'
        damageHeat: 0,
        driftOut: 0,
        driftTilt: (Math.random() - 0.5) * 1.4
      });
    }

    // Sugar-phosphate helical spine ribbons (translucent guide tubes)
    const spineCurveA = new THREE.CatmullRomCurve3(pairs.map(p => new THREE.Vector3(p.baseAx, p.baseY, p.baseAz)));
    const spineCurveB = new THREE.CatmullRomCurve3(pairs.map(p => new THREE.Vector3(p.baseBx, p.baseY, p.baseBz)));
    const spineMeshA = new THREE.Mesh(
      new THREE.TubeGeometry(spineCurveA, 96, 0.055, 8, false),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.55, transparent: true, opacity: 0.72 })
    );
    const spineMeshB = new THREE.Mesh(
      new THREE.TubeGeometry(spineCurveB, 96, 0.055, 8, false),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 0.55, transparent: true, opacity: 0.72 })
    );
    dnaGroup.add(spineMeshA, spineMeshB);

    // Optional Tardigrade Dsup + Melanin Chromatin Protective Cage
    const dsupCage = new THREE.Mesh(
      new THREE.CylinderGeometry(2.15, 2.15, NUM_PAIRS * HELIX_PITCH + 1.2, 24, 10, true),
      new THREE.MeshBasicMaterial({
        color: 0x10b981,
        wireframe: true,
        transparent: true,
        opacity: 0.24
      })
    );
    dsupCage.visible = false;
    dnaGroup.add(dsupCage);

    // Ionizing Radiation Beam Rays (HZE Fe-56 red tracks & secondary neutrons)
    const beamPool = [];
    const beamGeo = new THREE.CylinderGeometry(0.032, 0.032, 1.5, 8);
    beamGeo.rotateZ(Math.PI / 2);
    for (let i = 0; i < 42; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.92 });
      const mesh = new THREE.Mesh(beamGeo, mat);
      mesh.visible = false;
      scene.add(mesh);
      beamPool.push({ mesh, mat, active: false, vx: 0, vy: 0, targetIdx: 0, isNeutron: false, hitChecked: false });
    }

    // Green NHEJ/HR Cellular Repair Ring sweeping up and down intact sections
    const repairHalo = new THREE.Mesh(
      new THREE.TorusGeometry(1.85, 0.04, 12, 48),
      new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.45 })
    );
    repairHalo.rotation.x = Math.PI / 2;
    dnaGroup.add(repairHalo);

    const resetHelix = () => {
      pairs.forEach(p => {
        p.status = 'INTACT';
        p.damageHeat = 0;
        p.driftOut = 0;
        p.nodeA.position.set(p.baseAx, p.baseY, p.baseAz);
        p.nodeB.position.set(p.baseBx, p.baseY, p.baseBz);
        p.rungL.position.set(-0.62, 0, 0);
        p.rungR.position.set(0.62, 0, 0);
        p.rungL.rotation.set(0, 0, 0);
        p.rungR.rotation.set(0, 0, 0);
      });
    };

    const spawnBeam = (forceSevere = false) => {
      const slot = beamPool.find(b => !b.active);
      if (!slot) return;
      const p = liveParamsRef.current;
      const targetIdx = Math.floor(Math.random() * NUM_PAIRS);
      const y = Y_OFFSET + targetIdx * HELIX_PITCH;
      const fromLeft = Math.random() > 0.5;
      const isNeutron = forceSevere || Math.random() < p.secNeutronFrac;

      slot.active = true;
      slot.hitChecked = false;
      slot.targetIdx = targetIdx;
      slot.isNeutron = isNeutron;
      slot.vx = (fromLeft ? 1 : -1) * (0.24 + Math.random() * 0.14);
      slot.vy = (Math.random() - 0.5) * 0.04;
      slot.mesh.position.set(fromLeft ? -9.5 : 9.5, y + (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 1.4);
      slot.mesh.rotation.z = Math.atan2(slot.vy, slot.vx);
      slot.mat.color.setHex(isNeutron ? 0xf59e0b : 0xf43f5e);
      slot.mesh.visible = true;
    };

    const triggerFlareBurst = () => {
      for (let k = 0; k < 18; k++) {
        spawnBeam(k % 2 === 0);
      }
    };

    dnaControlsRef.current = { resetHelix, triggerFlareBurst };

    let hudTick = 0;
    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, clock.getDelta());
      const t = clock.elapsedTime;
      const params = liveParamsRef.current;

      dsupCage.visible = params.dsupShieldOn;
      if (params.dsupShieldOn) {
        dsupCage.rotation.y = t * 0.35;
      }

      if (!params.paused) {
        dnaGroup.rotation.y += dt * 0.32;

        // Radiation flux scales strike probability realistically from calm (0.5 mSv/d) to solar flare (250 mSv/d)
        const doseFactor = Math.log10(1 + params.doseMsvDay * 0.85) * 0.42;
        const spawnProb = Math.min(0.75, 0.03 + doseFactor * (0.6 + params.letKevUm / 65.0));
        if (Math.random() < spawnProb) {
          spawnBeam(false);
        }

        // Move ionizing radiation tracks & trigger collisions
        for (const b of beamPool) {
          if (!b.active) continue;
          b.mesh.position.x += b.vx;
          b.mesh.position.y += b.vy;

          // If Tardigrade Dsup chromatin shield is ON, 78% of incoming tracks scatter off the cage
          const shieldBoundary = params.dsupShieldOn ? 2.2 : 1.35;
          if (!b.hitChecked && Math.abs(b.mesh.position.x) < shieldBoundary) {
            b.hitChecked = true;
            const dsupBlocked = params.dsupShieldOn && Math.random() < 0.78;
            if (dsupBlocked) {
              b.vy = (b.mesh.position.y >= 0 ? 1 : -1) * 0.22;
              b.mat.color.setHex(0x34d399);
            } else {
              const hitPair = pairs[b.targetIdx];
              if (hitPair) {
                const severity = Math.min(1.0, (params.doseMsvDay / 45.0) * 0.5 + (b.isNeutron ? 0.55 : 0.28));
                if (hitPair.status === 'INTACT') {
                  hitPair.status = Math.random() < severity ? 'DSB' : 'SSB';
                } else if (hitPair.status === 'SSB') {
                  hitPair.status = 'DSB';
                }
                hitPair.damageHeat = 1.0;
              }
            }
          }

          if (Math.abs(b.mesh.position.x) > 10.5) {
            b.active = false;
            b.mesh.visible = false;
          }
        }

        // Update repair ring & nucleotide damage / degradation physics
        repairHalo.position.y = Math.sin(t * 1.4) * (NUM_PAIRS * HELIX_PITCH * 0.46);
        const repairCapacityPerSec = (params.dsupShieldOn ? 1.8 : 0.95) * Math.max(0.25, 1.15 - params.doseMsvDay / 180.0);

        let intactCount = 0;
        let ssbCount = 0;
        let dsbCount = 0;
        let sumDrift = 0;

        for (const p of pairs) {
          p.damageHeat = Math.max(0, p.damageHeat - dt * 0.8);

          if (p.status === 'INTACT') {
            intactCount++;
            p.driftOut = Math.max(0, p.driftOut - dt * 2.5);
            p.rungL.material.color.setHex(0x34d399);
            p.rungL.material.emissive.setHex(0x047857);
            p.rungR.material.color.setHex(0x818cf8);
            p.rungR.material.emissive.setHex(0x4338ca);
            p.nodeA.material.color.setHex(0x38bdf8);
            p.nodeB.material.color.setHex(0xfbbf24);
          } else if (p.status === 'SSB') {
            ssbCount++;
            p.driftOut = Math.min(0.22, p.driftOut + dt * 0.7);
            p.rungL.material.color.setHex(0xfbbf24);
            p.rungL.material.emissive.setHex(0xd97706);
            p.rungR.material.color.setHex(0x34d399);
            p.nodeB.material.color.setHex(0xf59e0b);
            // Rapid SSB ligation repair
            if (Math.random() < dt * repairCapacityPerSec * 1.15) {
              p.status = 'INTACT';
            }
          } else {
            // Clustered Double-Strand Break (DSB): rung snaps and drifts apart!
            dsbCount++;
            p.driftOut = Math.min(1.15, p.driftOut + dt * (0.45 + Math.min(1.5, params.doseMsvDay / 60.0)));
            p.rungL.material.color.setHex(0xf43f5e);
            p.rungL.material.emissive.setHex(0xe11d48);
            p.rungR.material.color.setHex(0xf43f5e);
            p.rungR.material.emissive.setHex(0xe11d48);
            p.nodeA.material.color.setHex(0xf43f5e);
            p.nodeB.material.color.setHex(0xf43f5e);
            // Slow NHEJ/HR DSB repair when repair enzymes can keep up
            if (p.driftOut < 0.85 && Math.random() < dt * repairCapacityPerSec * 0.28) {
              p.status = 'SSB';
            }
          }

          sumDrift += p.driftOut;
          const wobble = p.status === 'DSB' ? Math.sin(t * 7.0 + p.idx) * 0.08 * p.driftOut : 0;
          p.rungL.position.set(-0.62 - p.driftOut * 0.68, wobble, 0);
          p.rungR.position.set(0.62 + p.driftOut * 0.68, -wobble, 0);
          p.rungL.rotation.z = p.driftOut * p.driftTilt * 0.65;
          p.rungR.rotation.z = -p.driftOut * p.driftTilt * 0.65;

          const radialExpand = 1 + p.driftOut * 0.28;
          p.nodeA.position.set(p.baseAx * radialExpand, p.baseY + wobble, p.baseAz * radialExpand);
          p.nodeB.position.set(p.baseBx * radialExpand, p.baseY - wobble, p.baseBz * radialExpand);
        }

        hudTick += dt;
        if (hudTick >= 0.22) {
          hudTick = 0;
          const integrity = Math.max(4.0, Math.min(100, ((intactCount + ssbCount * 0.65) / NUM_PAIRS) * 100 - sumDrift * 1.4));
          let cellularState = 'HOMEOSTATIC REPAIR';
          if (integrity < 45) cellularState = 'CRITICAL APOPTOSIS / CHROMOSOME SHATTER';
          else if (integrity < 72) cellularState = 'NHEJ REPAIR SATURATION (DEGRADING)';
          else if (dsbCount > 0) cellularState = 'ACTIVE DSB RESPONSE';

          setLiveHudStats({
            integrityPct: Number(integrity.toFixed(1)),
            intactPairs: intactCount,
            ssbCount,
            dsbCount,
            degradedPairs: dsbCount,
            cellularState
          });
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 20 && h > 20) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="chart-card" style={{ marginBottom: 18 }}>
      <div className="card-header-bar" style={{ marginBottom: 12 }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Dna size={16} strokeWidth={1.75} style={{ color: '#38bdf8', flexShrink: 0 }} />
            <span>Interactive 3D DNA Double-Helix Radiation Damage &amp; Degradation Simulator</span>
          </h3>
          <p className="desc" style={{ marginBottom: 0, maxWidth: '66ch' }}>
            Adjust the ionizing radiation slider (or lock to your active spacecraft shield dose) to watch real-time 3D Single-Strand Breaks (amber), clustered Double-Strand Cleavages (crimson drifting fragments), and NHEJ/HR enzyme repair kinetics.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`view-btn ${syncWithShip ? 'active' : ''}`}
            onClick={() => setSyncWithShip(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Rocket size={13} strokeWidth={1.75} />
            <span className="tabular">Sync Spacecraft Shield ({(simState?.stack?.totalRate ?? 1.5).toFixed(2)} mSv/d)</span>
          </button>
          <button
            type="button"
            className={`view-btn ${!syncWithShip ? 'active' : ''}`}
            onClick={() => setSyncWithShip(false)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <SlidersHorizontal size={13} strokeWidth={1.75} />
            <span>Manual Dose Control</span>
          </button>
          <button
            type="button"
            className={`view-btn ${dsupShieldOn ? 'active' : ''}`}
            onClick={() => setDsupShieldOn(v => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Shield size={13} strokeWidth={1.75} />
            <span>{dsupShieldOn ? 'Tardigrade Dsup Shield: ON' : 'Enable Tardigrade Dsup Armor'}</span>
          </button>
        </div>
      </div>

      {/* Live Radiation Stress Slider + Action Bar */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: '#090e1a', border: '1px solid rgba(148, 163, 184, 0.14)', marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 230 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={13} strokeWidth={1.75} style={{ color: '#fbbf24' }} />
              <span>Exposed Biological Dose Rate:</span>
            </span>
            <strong className="tabular" style={{ color: activeDoseMsvDay > 25 ? '#f43f5e' : activeDoseMsvDay > 5 ? '#fbbf24' : '#34d399' }}>
              {activeDoseMsvDay.toFixed(2)} mSv/day {syncWithShip ? '(Synced from Spacecraft)' : '(Manual Test)'}
            </strong>
          </div>
          <input
            type="range"
            min="0.1"
            max="250"
            step="0.5"
            value={activeDoseMsvDay}
            onChange={(e) => {
              setSyncWithShip(false);
              setManualDoseMsvDay(Number(e.target.value));
            }}
            style={{ width: '100%' }}
          />
        </div>

        <button
          type="button"
          className="sensor-btn"
          onClick={() => setBurstTrigger(c => c + 1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Zap size={13} strokeWidth={1.75} />
          <span>Fire n⁰/HZE Burst</span>
        </button>
        <button
          type="button"
          className="sensor-btn"
          onClick={() => dnaControlsRef.current.resetHelix && dnaControlsRef.current.resetHelix()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RotateCcw size={13} strokeWidth={1.75} />
          <span>Reset Healthy DNA</span>
        </button>
        <button
          type="button"
          className="sensor-btn"
          onClick={() => setPaused(p => !p)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          {paused ? <Play size={13} strokeWidth={1.75} /> : <Pause size={13} strokeWidth={1.75} />}
          <span>{paused ? 'Resume 3D' : 'Pause 3D'}</span>
        </button>
      </div>

      {/* 3D WebGL Canvas + Floating Biophysical Telemetry HUD */}
      <div
        ref={containerRef}
        className="vp-container"
        style={{ height: 430, minHeight: 400, position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(148, 163, 184, 0.14)' }}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

        <div className="vp-hud top-left">
          <div className="hud-line"><span className="dot" style={{ background: liveHudStats.integrityPct > 75 ? '#10b981' : liveHudStats.integrityPct > 45 ? '#fbbf24' : '#f43f5e' }} /> <strong>{liveHudStats.cellularState}</strong></div>
          <div className="hud-sub">DNA Structural Integrity: <strong>{liveHudStats.integrityPct}%</strong> &bull; Drag to Rotate / Scroll to Zoom</div>
        </div>

        <div className="vp-hud top-right" style={{ textAlign: 'right' }}>
          <div className="hud-line">Intact Rungs: <strong style={{ color: '#34d399' }}>{liveHudStats.intactPairs}/28</strong></div>
          <div className="hud-sub">
            <span style={{ color: '#fbbf24' }}>SSBs: {liveHudStats.ssbCount}</span> &bull;{' '}
            <span style={{ color: '#fda4af' }}>DSBs / Degraded: {liveHudStats.dsbCount}</span>
          </div>
        </div>

        <div className="vp-hud bottom-left">
          <div className="hud-sub">
            <span style={{ color: '#f43f5e' }}>&#9679; Red Beams:</span> HZE Primary Ions (p⁺/⁵⁶Fe) &bull;{' '}
            <span style={{ color: '#fbbf24' }}>&#9679; Amber:</span> Secondary Neutrons (n⁰) &amp; SSBs &bull;{' '}
            <span style={{ color: '#34d399' }}>&#9679; Green:</span> Repair &amp; Dsup Shield
          </div>
        </div>
      </div>
    </div>
  );
}
