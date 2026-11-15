import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Shirt,
  Rocket,
  Eye,
  Radio,
  Bot,
  Zap,
  SlidersHorizontal,
  Sun,
  Volume2,
  VolumeX
} from 'lucide-react';
import { radiationSonifier } from './radiationAudio';

/**
 * Interactive 3D Architecture Studio for:
 * 1) "Aegis-Gadaa Mk.V" Digital Smart Astronaut EVA Suit:
 *    - Stays in low-power PASSIVE standby during quiet conditions (0W magnetic coil, zero chronic EM burden).
 *    - Real-time digital chest/shoulder dosimeters watch for rising radiation (>= 5.0 mSv/hr threshold).
 *    - When radiation spikes, the suit's onboard computer warns the astronaut and AUTOMATICALLY turns on
 *      the ReBCO waist & shoulder magnetic coils, pressurizes the 10B-Water organ shield vest,
 *      dims the ITO helmet visor, opens wrist heat radiators, and beams an alert beacon.
 * 2) Horizon-2045 "Odaa-Aegis M2P2" Deep-Space Cruiser.
 */
export default function Future3DViewport({
  plasmaRadiusM,
  crystalHwtPct,
  dsupBioPct,
  cascade
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const [modelMode, setModelMode] = useState('evaSuit'); // 'evaSuit' | 'spacecraft2045'
  const [cutawayMode, setCutawayMode] = useState(true);
  const [particleAttackOn, setParticleAttackOn] = useState(true);

  // Digital Smart EVA Suit Threshold Logic State
  const [evaFluxMsvHr, setEvaFluxMsvHr] = useState(1.2); // 0.2 -> 60 mSv/hr
  const [autoTriggerEnabled, setAutoTriggerEnabled] = useState(true);
  const [manualMagForceOn, setManualMagForceOn] = useState(false);

  const triggerThreshold = 5.0; // mSv/hr threshold where passive suit armor is exceeded
  const [suitAudioEnabled, setSuitAudioEnabled] = useState(false);
  const prevEngagedRef = useRef(false);
  const prevStatusRef = useRef('QUIET');

  const suitLogic = useMemo(() => {
    const fluxRising = evaFluxMsvHr >= 2.5;
    const magFieldEngaged = autoTriggerEnabled
      ? evaFluxMsvHr >= triggerThreshold
      : manualMagForceOn;

    const statusLevel =
      evaFluxMsvHr >= 12.0 ? 'CRITICAL' : evaFluxMsvHr >= triggerThreshold ? 'ALERT' : fluxRising ? 'RISING' : 'QUIET';

    // When magnetic shield is OFF, battery lasts >18h with zero chronic coil EM exposure or heat.
    // When triggered ON by rising radiation, deflection protects core organs by ~88%.
    const coilPowerW = magFieldEngaged ? 340 : 0;
    const batteryHours = magFieldEngaged ? 6.2 : 18.5;
    const crewCoreRate = magFieldEngaged ? evaFluxMsvHr * 0.11 : evaFluxMsvHr * 0.65;

    return {
      fluxRising,
      magFieldEngaged,
      statusLevel,
      coilPowerW,
      batteryHours,
      crewCoreRate,
      alertText: magFieldEngaged
        ? 'RISING RADIATION DETECTED -> AUTO-MAGNETIC SHIELD ENGAGED'
        : fluxRising
          ? 'RADIATION CLIMBING -> ARMED (AUTO-SHIELD READY AT 5.0 mSv/hr)'
          : 'QUIET EVA -> MAGNETIC COILS OFF (SAVING BATTERY & ZERO EM LOAD)'
    };
  }, [evaFluxMsvHr, autoTriggerEnabled, manualMagForceOn]);

  // Real-time sound radiation cues: Geiger clicks & rising radiation alarm chimes
  useEffect(() => {
    if (!suitAudioEnabled) return;

    // Fast geiger clicking proportional to incoming flux
    const interval = Math.max(90, Math.min(750, 1400 / Math.max(0.4, evaFluxMsvHr)));
    const timer = setInterval(() => {
      radiationSonifier.triggerSuitGeigerClick(evaFluxMsvHr);
    }, interval);

    // If magnetic shield engaged just now
    if (suitLogic.magFieldEngaged && !prevEngagedRef.current) {
      radiationSonifier.triggerSuitWarningChime(evaFluxMsvHr);
      setTimeout(() => {
        radiationSonifier.triggerSuitShieldEngagedSound();
      }, 240);
    } else if (
      suitLogic.statusLevel !== prevStatusRef.current &&
      (suitLogic.statusLevel === 'RISING' || suitLogic.statusLevel === 'CRITICAL')
    ) {
      radiationSonifier.triggerSuitWarningChime(evaFluxMsvHr);
    }

    prevEngagedRef.current = suitLogic.magFieldEngaged;
    prevStatusRef.current = suitLogic.statusLevel;

    return () => clearInterval(timer);
  }, [suitAudioEnabled, evaFluxMsvHr, suitLogic.magFieldEngaged, suitLogic.statusLevel]);

  const liveParamsRef = useRef({
    modelMode,
    cutawayMode,
    particleAttackOn,
    plasmaRadiusM,
    crystalHwtPct,
    dsupBioPct,
    m2p2DeflectFrac: (cascade?.m2p2DeflectFrac ?? 88) / 100,
    evaFluxMsvHr,
    magFieldEngaged: suitLogic.magFieldEngaged,
    statusLevel: suitLogic.statusLevel
  });

  useEffect(() => {
    liveParamsRef.current = {
      modelMode,
      cutawayMode,
      particleAttackOn,
      plasmaRadiusM,
      crystalHwtPct,
      dsupBioPct,
      m2p2DeflectFrac: (cascade?.m2p2DeflectFrac ?? 88) / 100,
      evaFluxMsvHr,
      magFieldEngaged: suitLogic.magFieldEngaged,
      statusLevel: suitLogic.statusLevel
    };
  }, [modelMode, cutawayMode, particleAttackOn, plasmaRadiusM, crystalHwtPct, dsupBioPct, cascade, evaFluxMsvHr, suitLogic]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 780;
    const height = container.clientHeight || 460;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040713);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 220);
    camera.position.set(2.8, 1.4, 6.2);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.24;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.8;
    camera.lookAt(0, 0.25, 0);
    controls.maxDistance = 24.0;
    controls.target.set(0, 0.25, 0);

    // Studio Lighting
    scene.add(new THREE.AmbientLight(0x93c5fd, 0.95));
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.35);
    sunLight.position.set(12, 14, 10);
    scene.add(sunLight);

    const rimCyan = new THREE.DirectionalLight(0x38bdf8, 1.35);
    rimCyan.position.set(-10, -5, -9);
    scene.add(rimCyan);

    const goldBounce = new THREE.PointLight(0xfbbf24, 1.25, 24);
    goldBounce.position.set(0, 4, 6);
    scene.add(goldBounce);

    // Background Starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 900;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 35 + Math.random() * 50;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      starPos[i * 3 + 2] = r * Math.cos(ph);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xe2e8f0, size: 0.16, transparent: true, opacity: 0.75 })));

    // =========================================================================
    // ASSEMBLY 1: HORIZON-2045 "ODAA-AEGIS M2P2" DEEP-SPACE CRUISER
    // =========================================================================
    const shipGroup = new THREE.Group();
    shipGroup.visible = false;
    scene.add(shipGroup);

    const matHullTitan = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.65, roughness: 0.28 });
    const matKaptonGold = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.22 });
    const matDarkCarbon = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.55, roughness: 0.4 });
    const matGlowCyan = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.4 });
    const matBioCore = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.75 });

    const habCore = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 3.6, 32), matHullTitan);
    habCore.rotation.z = Math.PI / 2;
    shipGroup.add(habCore);

    const bioCore = new THREE.Mesh(new THREE.CylinderGeometry(0.97, 0.97, 1.3, 28), matBioCore);
    bioCore.rotation.z = Math.PI / 2;
    shipGroup.add(bioCore);

    const bridgeCone = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.45, 32), matHullTitan);
    bridgeCone.rotation.z = -Math.PI / 2;
    bridgeCone.position.set(2.52, 0, 0);
    shipGroup.add(bridgeCone);

    const dockingCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 0.4, 24), matDarkCarbon);
    dockingCollar.rotation.z = Math.PI / 2;
    dockingCollar.position.set(3.38, 0, 0);
    shipGroup.add(dockingCollar);

    for (let w = 0; w < 6; w++) {
      const ang = (w / 6) * Math.PI * 2;
      const winMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.26), matGlowCyan);
      winMesh.position.set(2.05, Math.cos(ang) * 0.76, Math.sin(ang) * 0.76);
      winMesh.rotation.x = ang;
      shipGroup.add(winMesh);
    }

    const aftSection = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.65, 1.4, 28), matKaptonGold);
    aftSection.rotation.z = Math.PI / 2;
    aftSection.position.set(-2.5, 0, 0);
    shipGroup.add(aftSection);

    const thrusterGlow = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.0, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75, side: THREE.DoubleSide }));
    thrusterGlow.rotation.z = Math.PI / 2;
    thrusterGlow.position.set(-3.6, 0, 0);
    shipGroup.add(thrusterGlow);

    const wingGeo = new THREE.BoxGeometry(1.4, 0.05, 3.1);
    const wingL = new THREE.Mesh(wingGeo, matDarkCarbon);
    wingL.position.set(-0.9, 0, 2.55);
    const wingR = new THREE.Mesh(wingGeo, matDarkCarbon);
    wingR.position.set(-0.9, 0, -2.55);
    shipGroup.add(wingL, wingR);

    const crystalArmorShell = new THREE.Mesh(
      new THREE.CylinderGeometry(1.28, 1.28, 3.7, 24, 1, true),
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.4, transparent: true, opacity: 0.36, roughness: 0.15, metalness: 0.2 })
    );
    crystalArmorShell.rotation.z = Math.PI / 2;
    shipGroup.add(crystalArmorShell);

    const crystalWireCage = new THREE.Mesh(
      new THREE.CylinderGeometry(1.31, 1.31, 3.72, 16, 6, true),
      new THREE.MeshBasicMaterial({ color: 0x67e8f9, wireframe: true, transparent: true, opacity: 0.42 })
    );
    crystalWireCage.rotation.z = Math.PI / 2;
    shipGroup.add(crystalWireCage);

    const coilGeo = new THREE.TorusGeometry(1.52, 0.085, 16, 64);
    const coilFore = new THREE.Mesh(coilGeo, matKaptonGold);
    coilFore.rotation.y = Math.PI / 2;
    coilFore.position.set(1.35, 0, 0);
    const coilAft = new THREE.Mesh(coilGeo, matKaptonGold);
    coilAft.rotation.y = Math.PI / 2;
    coilAft.position.set(-1.35, 0, 0);
    shipGroup.add(coilFore, coilAft);

    const plasmaBubbleWire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.0, 2),
      new THREE.MeshBasicMaterial({ color: 0xa78bfa, wireframe: true, transparent: true, opacity: 0.22 })
    );
    const plasmaBubbleGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.98, 32, 24),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.075, side: THREE.BackSide })
    );
    shipGroup.add(plasmaBubbleWire, plasmaBubbleGlow);

    // =========================================================================
    // ASSEMBLY 2: ELECTRONIZED DIGITAL SMART ASTRONAUT EVA SUIT
    // =========================================================================
    const suitGroup = new THREE.Group();
    scene.add(suitGroup);

    const matSuitOuter = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35, metalness: 0.25, transparent: true, opacity: 0.3 });
    const matJointDark = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.45 });
    const matGoldVisor = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.92, roughness: 0.1 });
    const matOrganWaterVest = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.45, transparent: true, opacity: 0.52, roughness: 0.15 });
    const matHeartGlow = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 1.25 });
    const matMarrowCol = new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xd97706, emissiveIntensity: 0.85 });

    // Helmet & Digital Visor HUD Ring
    const helmetShell = new THREE.Mesh(new THREE.SphereGeometry(0.56, 28, 24), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25, metalness: 0.3 }));
    helmetShell.position.set(0, 1.92, 0);
    suitGroup.add(helmetShell);

    const goldVisor = new THREE.Mesh(new THREE.SphereGeometry(0.51, 24, 20, -Math.PI / 2, Math.PI, Math.PI * 0.18, Math.PI * 0.64), matGoldVisor);
    goldVisor.position.set(0, 1.92, 0.12);
    goldVisor.rotation.y = Math.PI / 2;
    suitGroup.add(goldVisor);

    // Projected Internal Visor HUD Arc (flashes cyan/red during radiation alert)
    const visorHudMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 });
    const visorHudRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.015, 8, 28, Math.PI), visorHudMat);
    visorHudRing.position.set(0, 1.96, 0.49);
    suitGroup.add(visorHudRing);

    const neckSeal = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 14, 36), matJointDark);
    neckSeal.rotation.x = Math.PI / 2;
    neckSeal.position.set(0, 1.42, 0);
    suitGroup.add(neckSeal);

    // Hard Upper Torso Shell
    const suitTorsoShell = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.56, 1.55, 24), matSuitOuter);
    suitTorsoShell.scale.set(1.18, 1.0, 0.78);
    suitTorsoShell.position.set(0, 0.64, 0);
    suitGroup.add(suitTorsoShell);

    // Targeted 10B-Water Organ Shield Vest + Beating Heart & Marrow Target
    const organWaterVest = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.48, 1.24, 20), matOrganWaterVest);
    organWaterVest.scale.set(1.12, 1.0, 0.7);
    organWaterVest.position.set(0, 0.68, 0.04);
    suitGroup.add(organWaterVest);

    const heartMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 18), matHeartGlow);
    heartMesh.position.set(0.12, 0.85, 0.12);
    const marrowColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.05, 14), matMarrowCol);
    marrowColumn.position.set(0, 0.65, -0.02);
    suitGroup.add(heartMesh, marrowColumn);

    // CHEST-MOUNTED DIGITAL OLED DISPLAY (Dynamic CanvasTexture updating with live flux/alert!)
    const chestCanvas = document.createElement('canvas');
    chestCanvas.width = 256;
    chestCanvas.height = 144;
    const chestCtx = chestCanvas.getContext('2d');
    const chestTex = new THREE.CanvasTexture(chestCanvas);

    const chestBezel = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.34, 0.07), matJointDark);
    chestBezel.position.set(0, 0.78, 0.57);
    const chestScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.49, 0.27),
      new THREE.MeshBasicMaterial({ map: chestTex })
    );
    chestScreen.position.set(0, 0.78, 0.61);
    suitGroup.add(chestBezel, chestScreen);

    // LEFT FOREARM DIGITAL DIAGNOSTIC WRIST DISPLAY
    const wristMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.2 });
    const wristConsole = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.06), wristMat);
    wristConsole.position.set(-1.05, 0.36, 0.25);
    wristConsole.rotation.z = -0.25;
    suitGroup.add(wristConsole);

    // THRESHOLD-TRIGGERED WAIST & SHOULDER SUPERCONDUCTING MAGNETIC COILS
    const coilIdleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.35, emissive: 0x000000, emissiveIntensity: 0 });
    const waistMagnetRing = new THREE.Mesh(new THREE.TorusGeometry(0.70, 0.072, 16, 48), coilIdleMat);
    waistMagnetRing.rotation.x = Math.PI / 2;
    waistMagnetRing.scale.set(1.14, 0.86, 1.0);
    waistMagnetRing.position.set(0, -0.08, 0);
    suitGroup.add(waistMagnetRing);

    const shoulderCoilGeo = new THREE.TorusGeometry(0.32, 0.035, 12, 32);
    const shoulderCoilL = new THREE.Mesh(shoulderCoilGeo, coilIdleMat);
    shoulderCoilL.position.set(-0.76, 1.18, 0);
    shoulderCoilL.rotation.y = Math.PI / 2;
    const shoulderCoilR = new THREE.Mesh(shoulderCoilGeo, coilIdleMat);
    shoulderCoilR.position.set(0.76, 1.18, 0);
    shoulderCoilR.rotation.y = Math.PI / 2;
    suitGroup.add(shoulderCoilL, shoulderCoilR);

    // Active Suit Magnetic Field Bubble (ONLY inflates when threshold-triggered or manually forced!)
    const suitFieldBubble = new THREE.Mesh(
      new THREE.SphereGeometry(2.05, 24, 18),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.28 })
    );
    suitFieldBubble.position.set(0, 0.55, 0);
    suitFieldBubble.scale.set(0.01, 0.01, 0.01);
    suitFieldBubble.visible = false;
    suitGroup.add(suitFieldBubble);

    const suitFieldGlow = new THREE.Mesh(
      new THREE.SphereGeometry(1.98, 24, 18),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.08, side: THREE.BackSide })
    );
    suitFieldGlow.position.set(0, 0.55, 0);
    suitFieldGlow.visible = false;
    suitGroup.add(suitFieldGlow);

    // Dorsal PLSS Digital Capacitor Pack + Radiators + Multi-Sensor Shoulder Pod + Beacon
    const plssPack = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.35, 0.52), new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.35, metalness: 0.45 }));
    plssPack.position.set(0, 0.72, -0.68);
    const plssGoldPlate = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.95, 0.06), matKaptonGold);
    plssGoldPlate.position.set(0, 0.72, -0.96);
    suitGroup.add(plssPack, plssGoldPlate);

    // Thermal Radiator Fins on sides of PLSS (deploy outward when coils draw 340W heat!)
    const finGeo = new THREE.BoxGeometry(0.04, 0.85, 0.32);
    const radFinL = new THREE.Mesh(finGeo, matKaptonGold);
    radFinL.position.set(-0.52, 0.82, -0.72);
    const radFinR = new THREE.Mesh(finGeo, matKaptonGold);
    radFinR.position.set(0.52, 0.82, -0.72);
    suitGroup.add(radFinL, radFinR);

    // Left Shoulder Multi-Sensor Micro-Dosimeter Pod + UHF Beacon Antenna
    const sensorPod = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.24), matGlowCyan);
    sensorPod.position.set(-0.78, 1.34, 0.16);
    const antennaMast = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.52, 8), matJointDark);
    antennaMast.position.set(0.42, 1.62, -0.65);
    const beaconTipMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const beaconTip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), beaconTipMat);
    beaconTip.position.set(0.42, 1.90, -0.65);
    suitGroup.add(sensorPod, antennaMast, beaconTip);

    // Articulated Limbs & Boots
    const limbMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.42, metalness: 0.2 });
    const makeLimb = (rTop, rBot, len, x, y, z, rotZ) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, len, 18), limbMat);
      m.position.set(x, y, z);
      m.rotation.z = rotZ;
      suitGroup.add(m);
    };
    makeLimb(0.21, 0.17, 1.15, -0.96, 0.62, 0.08, -0.26);
    makeLimb(0.21, 0.17, 1.15, 0.96, 0.62, 0.08, 0.26);
    const gloveL = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 14), matJointDark);
    gloveL.position.set(-1.14, 0.02, 0.14);
    const gloveR = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 14), matJointDark);
    gloveR.position.set(1.14, 0.02, 0.14);
    makeLimb(0.24, 0.19, 1.38, -0.32, -0.95, 0, -0.05);
    makeLimb(0.24, 0.19, 1.38, 0.32, -0.95, 0, 0.05);
    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.52), matJointDark);
    bootL.position.set(-0.36, -1.72, 0.1);
    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.52), matJointDark);
    bootR.position.set(0.36, -1.72, 0.1);
    suitGroup.add(gloveL, gloveR, bootL, bootR);

    // =========================================================================
    // SHARED COSMIC RADIATION PARTICLE STREAM & DEFLECTION POOL
    // =========================================================================
    const particlePool = [];
    const rayGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.65, 8);
    rayGeo.rotateZ(Math.PI / 2);
    for (let i = 0; i < 42; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.92 });
      const mesh = new THREE.Mesh(rayGeo, mat);
      scene.add(mesh);
      particlePool.push({
        mesh,
        mat,
        pos: new THREE.Vector3(-11 - Math.random() * 10, (Math.random() - 0.5) * 5.2, (Math.random() - 0.5) * 4.2),
        vel: new THREE.Vector3(0.16 + Math.random() * 0.08, 0, 0),
        deflected: false
      });
    }

    const redrawChestOled = (flux, engaged, status) => {
      chestCtx.fillStyle = engaged ? '#1f0b18' : '#081224';
      chestCtx.fillRect(0, 0, 256, 144);
      chestCtx.strokeStyle = engaged ? '#f43f5e' : status === 'RISING' ? '#fbbf24' : '#38bdf8';
      chestCtx.lineWidth = 6;
      chestCtx.strokeRect(4, 4, 248, 136);

      chestCtx.fillStyle = '#94a3b8';
      chestCtx.font = 'bold 18px monospace';
      chestCtx.fillText('AEGIS EVA-OS v5', 16, 30);

      chestCtx.fillStyle = engaged ? '#fda4af' : '#38bdf8';
      chestCtx.font = 'bold 34px monospace';
      chestCtx.fillText(`${flux.toFixed(1)} mSv/h`, 16, 74);

      chestCtx.fillStyle = engaged ? '#34d399' : status === 'RISING' ? '#fbbf24' : '#cbd5e1';
      chestCtx.font = 'bold 17px monospace';
      chestCtx.fillText(
        engaged ? 'MAG SHIELD: ON (AUTO)' : status === 'RISING' ? 'FLUX RISING: ARMED' : 'MAG COILS: STANDBY',
        16,
        118
      );
      chestTex.needsUpdate = true;
    };

    let lastDrawnKey = '';
    let fieldScaleLerp = 0.01;
    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.elapsedTime;
      const p = liveParamsRef.current;

      const isShip = p.modelMode === 'spacecraft2045';
      shipGroup.visible = isShip;
      suitGroup.visible = !isShip;

      // Update Spacecraft 2045 view
      const normalizedR = 2.4 + Math.min(3.8, Math.log10(Math.max(1, p.plasmaRadiusM / 2.5)) * 1.55);
      plasmaBubbleWire.scale.set(normalizedR * 1.18, normalizedR * 0.92, normalizedR * 0.92);
      plasmaBubbleGlow.scale.copy(plasmaBubbleWire.scale).multiplyScalar(0.98);
      plasmaBubbleWire.rotation.y = t * 0.22;
      plasmaBubbleWire.rotation.z = t * 0.08;
      crystalArmorShell.material.opacity = p.cutawayMode ? 0.34 : 0.85;
      crystalArmorShell.material.emissiveIntensity = 0.2 + (p.crystalHwtPct / 25) * 0.55;
      crystalWireCage.visible = p.cutawayMode;
      shipGroup.rotation.y = Math.sin(t * 0.35) * 0.12;
      thrusterGlow.scale.set(1, 0.9 + Math.sin(t * 9) * 0.12, 1);

      // Update Digital Smart EVA Suit Threshold Response
      const oledKey = `${p.evaFluxMsvHr.toFixed(1)}_${p.magFieldEngaged}_${p.statusLevel}`;
      if (oledKey !== lastDrawnKey) {
        lastDrawnKey = oledKey;
        redrawChestOled(p.evaFluxMsvHr, p.magFieldEngaged, p.statusLevel);
      }

      suitTorsoShell.material.opacity = p.cutawayMode ? 0.22 : 0.95;
      organWaterVest.visible = p.cutawayMode;
      organWaterVest.material.emissiveIntensity = p.magFieldEngaged ? 0.9 : 0.4;
      heartMesh.visible = p.cutawayMode;
      marrowColumn.visible = p.cutawayMode;

      const beat = 1.0 + Math.pow(Math.max(0, Math.sin(t * 3.8)), 4) * 0.16;
      heartMesh.scale.set(beat, beat, beat);
      suitGroup.position.y = Math.sin(t * 1.1) * 0.09;
      suitGroup.rotation.y = Math.sin(t * 0.45) * 0.18;

      // Auto-deploying Waist & Shoulder Magnetic Coils (0W slate when OFF -> golden glowing when ON!)
      const targetScale = p.magFieldEngaged ? 1.0 : 0.01;
      fieldScaleLerp += (targetScale - fieldScaleLerp) * 0.12;
      const bubbleActive = fieldScaleLerp > 0.05;
      suitFieldBubble.visible = bubbleActive;
      suitFieldGlow.visible = bubbleActive;
      suitFieldBubble.scale.set(fieldScaleLerp, fieldScaleLerp, fieldScaleLerp);
      suitFieldGlow.scale.set(fieldScaleLerp, fieldScaleLerp, fieldScaleLerp);
      suitFieldBubble.rotation.y = -t * 0.55;

      if (p.magFieldEngaged) {
        coilIdleMat.color.setHex(0xf59e0b);
        coilIdleMat.emissive.setHex(0xd97706);
        coilIdleMat.emissiveIntensity = 0.85 + 0.3 * Math.sin(t * 6);
        wristMat.emissive.setHex(0xe11d48);
        visorHudMat.color.setHex(0xf43f5e);
        beaconTipMat.color.setHex(Math.sin(t * 10) > 0 ? 0xf43f5e : 0xfbbf24);
        // Radiator fins flare open to cool active solenoid coils
        radFinL.rotation.z = 0.45;
        radFinR.rotation.z = -0.45;
      } else {
        coilIdleMat.color.setHex(0x64748b);
        coilIdleMat.emissive.setHex(0x000000);
        coilIdleMat.emissiveIntensity = 0;
        wristMat.emissive.setHex(p.statusLevel === 'RISING' ? 0xd97706 : 0x0284c7);
        visorHudMat.color.setHex(p.statusLevel === 'RISING' ? 0xfbbf24 : 0x38bdf8);
        beaconTipMat.color.setHex(0x38bdf8);
        radFinL.rotation.z = 0.05;
        radFinR.rotation.z = -0.05;
      }

      // Cosmic Particle Stream Speed/Color + Threshold Deflection Physics
      const shieldRadius = isShip ? normalizedR : p.magFieldEngaged ? 2.05 : 0.72;
      const deflectChance = isShip ? p.m2p2DeflectFrac : p.magFieldEngaged ? 0.90 : 0.18;
      const activeRayRatio = isShip ? 1.0 : Math.min(1.0, Math.max(0.18, p.evaFluxMsvHr / 18.0));

      particlePool.forEach((pt, idx) => {
        const showRay = p.particleAttackOn && idx / particlePool.length <= activeRayRatio;
        pt.mesh.visible = showRay;
        if (!showRay) return;

        const dist = pt.pos.length();
        if (!pt.deflected && dist < shieldRadius) {
          pt.deflected = true;
          if (Math.random() < deflectChance) {
            const outDir = pt.pos.clone().normalize();
            pt.vel.set(-0.08 + outDir.x * 0.12, outDir.y * 0.22 + (pt.pos.y >= 0 ? 0.07 : -0.07), outDir.z * 0.22);
            pt.mat.color.setHex(0x34d399); // Deflected cleanly by active magnetic field!
          } else {
            pt.mat.color.setHex(0xfbbf24);
          }
        }

        pt.pos.add(pt.vel);
        pt.mesh.position.copy(pt.pos);
        if (pt.vel.lengthSq() > 0.0001) {
          pt.mesh.rotation.z = Math.atan2(pt.vel.y, pt.vel.x);
        }

        if (pt.pos.x > 12 || Math.abs(pt.pos.y) > 9 || pt.pos.x < -14) {
          pt.pos.set(-11 - Math.random() * 6, (Math.random() - 0.5) * 4.6, (Math.random() - 0.5) * 3.8);
          pt.vel.set(0.16 + Math.random() * 0.09, 0, 0);
          pt.deflected = false;
          pt.mat.color.setHex(0xf43f5e);
        }
      });

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
      chestTex.dispose();
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="chart-card" style={{ marginBottom: 18 }}>
      <div className="card-header-bar" style={{ marginBottom: 12 }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shirt size={16} strokeWidth={1.75} style={{ color: '#fbbf24', flexShrink: 0 }} />
            <span>Interactive 3D Digital Smart EVA Suit &amp; Horizon-2045 Spacecraft</span>
          </h3>
          <p className="desc" style={{ marginBottom: 0, maxWidth: '66ch' }}>
            Inspect our <strong>electronized spacesuit</strong> built to conserve battery and avoid continuous EM load: magnetic field coils stay <strong>OFF</strong> in calm space, then <strong>automatically engage</strong> once onboard sensors detect rising radiation &ge; 5.0 mSv/hr.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`view-btn ${modelMode === 'evaSuit' ? 'active' : ''}`}
            onClick={() => setModelMode('evaSuit')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Shirt size={13} strokeWidth={1.75} />
            <span>Digital Smart EVA Suit</span>
          </button>
          <button
            type="button"
            className={`view-btn ${modelMode === 'spacecraft2045' ? 'active' : ''}`}
            onClick={() => setModelMode('spacecraft2045')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Rocket size={13} strokeWidth={1.75} />
            <span>Horizon-2045 Cruiser</span>
          </button>
          <button
            type="button"
            className={`view-btn ${cutawayMode ? 'active' : ''}`}
            onClick={() => setCutawayMode(c => !c)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Eye size={13} strokeWidth={1.75} />
            <span>{cutawayMode ? 'Cutaway X-Ray: ON' : 'Cutaway X-Ray: OFF'}</span>
          </button>
          <button
            type="button"
            className={`view-btn ${particleAttackOn ? 'active' : ''}`}
            onClick={() => setParticleAttackOn(v => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Radio size={13} strokeWidth={1.75} />
            <span>{particleAttackOn ? 'Particle Stream: ON' : 'Particle Stream: OFF'}</span>
          </button>
        </div>
      </div>

      {/* Live Digital EVA Suit Threshold Controller */}
      {modelMode === 'evaSuit' && (
        <div style={{ padding: '12px 14px', borderRadius: 10, marginBottom: 12, background: '#090e1a', border: `1px solid ${suitLogic.magFieldEngaged ? 'rgba(244, 63, 94, 0.42)' : 'rgba(148, 163, 184, 0.16)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: suitLogic.magFieldEngaged ? '#6ee7b7' : '#38bdf8' }}>
              {suitLogic.alertText}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`view-btn ${autoTriggerEnabled ? 'active' : ''}`}
                onClick={() => setAutoTriggerEnabled(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Bot size={13} strokeWidth={1.75} />
                <span>Auto-Shield (&ge; 5.0 mSv/hr)</span>
              </button>
              <button
                type="button"
                className={`view-btn ${!autoTriggerEnabled && manualMagForceOn ? 'active' : ''}`}
                onClick={() => {
                  setAutoTriggerEnabled(false);
                  setManualMagForceOn(v => !v);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {!autoTriggerEnabled && manualMagForceOn ? <Zap size={13} strokeWidth={1.75} /> : <SlidersHorizontal size={13} strokeWidth={1.75} />}
                <span>{!autoTriggerEnabled && manualMagForceOn ? 'Force Coils: ON' : 'Manual Coil Override'}</span>
              </button>
              <button
                type="button"
                className="sensor-btn"
                onClick={() => {
                  setAutoTriggerEnabled(true);
                  setEvaFluxMsvHr(18.5);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Sun size={13} strokeWidth={1.75} />
                <span>Simulate Solar Flare Spike (18.5 mSv/hr)</span>
              </button>
              <button
                type="button"
                className={`view-btn ${suitAudioEnabled ? 'active' : ''}`}
                onClick={() => setSuitAudioEnabled(a => !a)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  borderColor: suitAudioEnabled ? '#10b981' : undefined,
                  color: suitAudioEnabled ? '#6ee7b7' : undefined
                }}
                title="Hear real-time Geiger clicks and rising radiation warning chimes"
              >
                {suitAudioEnabled ? <Volume2 size={13} strokeWidth={1.75} /> : <VolumeX size={13} strokeWidth={1.75} />}
                <span>{suitAudioEnabled ? 'Suit Audio: LIVE' : 'Hear Suit Audio'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span>Incoming External EVA Flux:</span>
                <strong className="tabular" style={{ color: evaFluxMsvHr >= triggerThreshold ? '#f43f5e' : '#38bdf8' }}>
                  {evaFluxMsvHr.toFixed(1)} mSv/hr
                </strong>
              </div>
              <input
                type="range"
                min="0.2"
                max="50"
                step="0.2"
                value={evaFluxMsvHr}
                onChange={(e) => setEvaFluxMsvHr(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div className="sensor-stat-box">
              <span>Magnetic Coil Power &amp; Battery</span>
              <strong className="tabular" style={{ color: suitLogic.magFieldEngaged ? '#fbbf24' : '#34d399' }}>
                {suitLogic.coilPowerW} W &bull; {suitLogic.batteryHours.toFixed(1)}h EVA Life
              </strong>
            </div>
            <div className="sensor-stat-box">
              <span>Organ Vest + Solenoid Core Dose</span>
              <strong className="tabular" style={{ color: '#38bdf8' }}>{suitLogic.crewCoreRate.toFixed(2)} mSv/hr</strong>
            </div>
            <div className="sensor-stat-box">
              <span>Radiator Fins &amp; Auto-Visor</span>
              <strong style={{ color: '#cbd5e1' }}>
                {suitLogic.magFieldEngaged ? 'Louvers Open + Beacon Red' : 'Standby Low-Power Mode'}
              </strong>
            </div>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="vp-container"
        style={{ height: 455, minHeight: 410, position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(148, 163, 184, 0.14)' }}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

        <div className="vp-hud top-left">
          <div className="hud-line">
            <span className="dot" style={{ background: modelMode === 'evaSuit' ? (suitLogic.magFieldEngaged ? '#10b981' : '#38bdf8') : '#fbbf24' }} />{' '}
            <strong>
              {modelMode === 'evaSuit'
                ? `AEGIS-GADAA MK.V SMART EVA SUIT (${suitLogic.magFieldEngaged ? 'MAG SHIELD ACTIVE' : 'PASSIVE STANDBY'})`
                : 'ODAA-AEGIS M2P2 CRUISER (2038–2045 ARCHITECTURE)'}
            </strong>
          </div>
          <div className="hud-sub">
            {modelMode === 'evaSuit'
              ? 'Chest OLED + Wrist Slate + Waist/Shoulder ReBCO Coils + ¹⁰B-Water Organ Vest + PLSS Radiators'
              : `M2P2 Standoff: ${plasmaRadiusM.toFixed(0)} m (${(cascade?.m2p2DeflectFrac ?? 88).toFixed(1)}% Ion Retracement) • ${crystalHwtPct} wt% H₂-BNNT Hull`}
          </div>
        </div>

        <div className="vp-hud top-right" style={{ textAlign: 'right' }}>
          <div className="hud-line">
            {modelMode === 'evaSuit' ? 'Core Organ Attenuation' : 'Combined Net Protection'}
          </div>
          <div className="hud-sub" style={{ color: '#34d399', fontWeight: 700, fontSize: 13 }}>
            {modelMode === 'evaSuit'
              ? `${suitLogic.magFieldEngaged ? '89% Deflection + Vest' : '35% Passive Suit Only'}`
              : `${(cascade?.netSuppressionPct ?? 99.1).toFixed(2)}% Clinical Immunity`}
          </div>
        </div>

        <div className="vp-hud bottom-left">
          <div className="hud-sub">
            <span style={{ color: '#f43f5e' }}>&#9679; Red Rays:</span> Incoming Cosmic Particles (p⁺/⁵⁶Fe) &bull;{' '}
            <span style={{ color: '#34d399' }}>&#9679; Green Deflected:</span> Turned Away by Active Field &bull; Drag to Rotate / Zoom
          </div>
        </div>
      </div>
    </div>
  );
}
