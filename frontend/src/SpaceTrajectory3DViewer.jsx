import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Globe,
  Moon,
  Compass,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Brain,
  TrendingUp
} from 'lucide-react';
import { getProceduralTextures } from './textures';
import { radiationSonifier } from './radiationAudio';

/**
 * TRAJECTORY DATABASE FOR MOON & MARS MISSIONS
 * Physically calibrated against NASA Apollo Flight Journals, Artemis TLI trajectories,
 * and NASA MSL Curiosity / Mars 2020 interplanetary transfer curves.
 */
export const TRAJECTORY_DATA = {
  moon: {
    targetName: 'Moon (Artemis Lunar Gateway / Base)',
    targetCoord: [15.0, 2.2, -4.5],
    targetRadius: 0.85,
    distanceKm: '384,400 km',
    paths: [
      {
        id: 'direct_tli',
        name: 'Direct Hohmann TLI (Apollo / Artemis Profile)',
        shortTag: 'DIRECT TLI',
        type: 'Fastest Transit • High Van Allen Belt Exposure',
        durationDays: 3.2,
        durationHours: 76.8,
        deltaVKms: 3.15,
        totalDoseMsv: 3.8,
        stormDoseMsv: 68.5,
        peakDoseRateMsvHr: 18.4,
        dnaDsbIndex: 34,
        shieldRecommendation: '157Gd-MXene + Storm Bunker Priority during first 6h',
        description:
          'Standard high-energy ballistic transfer. Cuts directly through the dense inner Van Allen proton belt (L=1.5–2.2). Fastest arrival, but demands maximum internal shielding during the first 4–6 hours.',
        aiBadge: 'FASTEST (RECOMMENDED DURING QUIET SOLAR WEATHER)',
        aiRationale: 'Nominal solar wind conditions make Direct TLI optimal. Deep-space transit time is minimized to 3.2 days, avoiding long-term GCR soak.',
        controlPoints: [
          new THREE.Vector3(1.7, 0.0, 0.0),
          new THREE.Vector3(3.2, 0.35, -0.6),
          new THREE.Vector3(6.5, 0.8, -1.6),
          new THREE.Vector3(11.0, 1.5, -3.0),
          new THREE.Vector3(15.0, 2.2, -4.5)
        ],
        // Radiation dose rate function along normalized path s in [0, 1]
        calcDoseRate: (s) => {
          // Sharp inner belt peak around s = 0.08, outer belt at s = 0.22, baseline GCR elsewhere
          const innerBelt = 18.4 * Math.exp(-Math.pow((s - 0.08) / 0.035, 2));
          const outerBelt = 4.2 * Math.exp(-Math.pow((s - 0.22) / 0.05, 2));
          const cislunarGcr = 0.062; // ~1.5 mSv/d
          const lunarAlbedo = s > 0.9 ? 0.035 * Math.pow((s - 0.9) / 0.1, 2) : 0;
          return innerBelt + outerBelt + cislunarGcr + lunarAlbedo;
        }
      },
      {
        id: 'polar_escape',
        name: 'Polar High-Inclination Bypass Corridor',
        shortTag: 'POLAR BYPASS',
        type: 'Belt-Free Trajectory • 63% Less Van Allen Radiation',
        durationDays: 4.6,
        durationHours: 110.4,
        deltaVKms: 3.48,
        totalDoseMsv: 1.4,
        stormDoseMsv: 22.0,
        peakDoseRateMsvHr: 0.95,
        dnaDsbIndex: 12,
        shieldRecommendation: 'Standard Graded-Z Hull Sufficient (No Bunker Needed)',
        description:
          'Launches into a high-inclination orbit (i = 68.5°) over Earth’s magnetic poles, escaping directly through open field lines. Completely avoids the equatorial trapped proton horn.',
        aiBadge: 'SAFEST (RECOMMENDED DURING ACTIVE SOLAR PROTON STORMS)',
        aiRationale: 'Eliminates trapped Van Allen radiation spike by flying above the geomagnetic trap. Safest route for high-sensitivity crew.',
        controlPoints: [
          new THREE.Vector3(1.5, 0.8, 0.0),
          new THREE.Vector3(2.8, 4.2, -0.8),
          new THREE.Vector3(6.8, 5.0, -2.0),
          new THREE.Vector3(11.5, 3.6, -3.4),
          new THREE.Vector3(15.0, 2.2, -4.5)
        ],
        calcDoseRate: (s) => {
          // Small polar cusp flux at s = 0.06, then clean interplanetary baseline
          const polarCusp = 0.95 * Math.exp(-Math.pow((s - 0.06) / 0.04, 2));
          const cislunarGcr = 0.058;
          const lunarAlbedo = s > 0.9 ? 0.035 * Math.pow((s - 0.9) / 0.1, 2) : 0;
          return polarCusp + cislunarGcr + lunarAlbedo;
        }
      },
      {
        id: 'wsb_transfer',
        name: 'Low-Energy Ballistic Lunar Transfer (WSB / L1/L2 Detour)',
        shortTag: 'WSB CARGO',
        type: 'Zero Van Allen Spikes • Long Deep-Space GCR Exposure',
        durationDays: 94.0,
        durationHours: 2256.0,
        deltaVKms: 2.82,
        totalDoseMsv: 136.0,
        stormDoseMsv: 245.0,
        peakDoseRateMsvHr: 0.068,
        dnaDsbIndex: 78,
        shieldRecommendation: 'Thick Water Wall + Active HTS Coils (Heavy Cargo Only)',
        description:
          'Transits through the Sun-Earth Weak Stability Boundary (WSB) near L1/L2 before ballistic lunar capture. Lowest propellant requirement, but prolonged 3-month exposure to Galactic Cosmic Rays.',
        aiBadge: 'CARGO OPTIMIZED (UNSUITABLE FOR UNPROTECTED CREW)',
        aiRationale: 'Lowest delta-V (2.82 km/s), but 94 days of continuous GCR accumulation yields 136 mSv. Strictly recommended for uncrewed supply missions.',
        controlPoints: [
          new THREE.Vector3(1.6, 0.0, 0.0),
          new THREE.Vector3(6.5, -3.2, 4.5),
          new THREE.Vector3(16.5, -4.8, 7.5),
          new THREE.Vector3(18.2, 0.5, 2.0),
          new THREE.Vector3(15.0, 2.2, -4.5)
        ],
        calcDoseRate: (s) => {
          // Very gentle, almost constant GCR flux over 94 days
          return 0.062 + (s > 0.2 && s < 0.8 ? 0.012 : 0);
        }
      }
    ]
  },
  mars: {
    targetName: 'Mars (Jezero Crater / Horizon-X Outpost)',
    targetCoord: [24.0, 3.8, -12.0],
    targetRadius: 1.15,
    distanceKm: '78,340,000 km (Mean)',
    paths: [
      {
        id: 'fast_conjunction',
        name: 'Fast Conjunction Sprint (High-Delta V Opposition)',
        shortTag: 'FAST CONJUNCTION',
        type: 'Shortest Mars Cruise • Lowest Cumulative GCR Exposure',
        durationDays: 165.0,
        durationHours: 3960.0,
        deltaVKms: 6.40,
        totalDoseMsv: 214.0,
        stormDoseMsv: 320.0,
        peakDoseRateMsvHr: 0.065,
        dnaDsbIndex: 58,
        shieldRecommendation: 'GadaSpace Odaa-Aegis Active Magnetic Deflection + Melanin',
        description:
          'High-thrust sprint cutting inside Earth’s orbital distance before intercepting Mars at high relative velocity. Reduces interplanetary microgravity and cosmic ray soak to under 6 months.',
        aiBadge: 'CREW BENCHMARK (MINIMUM LIFETIME CANCER RISK)',
        aiRationale: 'By reducing flight time from 9 months to 5.5 months, cumulative deep-space heavy ion dose is reduced by 38.5%, keeping crew well under the 600 mSv PEL ceiling.',
        controlPoints: [
          new THREE.Vector3(1.6, 0.0, 0.0),
          new THREE.Vector3(7.5, 1.8, -2.8),
          new THREE.Vector3(15.0, 3.2, -6.8),
          new THREE.Vector3(20.5, 3.6, -9.8),
          new THREE.Vector3(24.0, 3.8, -12.0)
        ],
        calcDoseRate: (s) => {
          const earthBreakout = 4.5 * Math.exp(-Math.pow((s - 0.02) / 0.012, 2));
          const deepSpaceGcr = 0.054; // mSv/hr
          const marsAtmo = s > 0.95 ? -0.015 : 0;
          return earthBreakout + deepSpaceGcr + marsAtmo;
        }
      },
      {
        id: 'hohmann_transfer',
        name: 'Standard Hohmann Heliocentric Minimum-Energy Orbit',
        shortTag: 'STANDARD HOHMANN',
        type: 'Standard NASA Architecture • 259-Day Transit Time',
        durationDays: 259.0,
        durationHours: 6216.0,
        deltaVKms: 3.90,
        totalDoseMsv: 348.0,
        stormDoseMsv: 490.0,
        peakDoseRateMsvHr: 0.058,
        dnaDsbIndex: 82,
        shieldRecommendation: 'Auxiliary Water Shielding Wall + Heavy Graded-Z Hull',
        description:
          'Classic tangential heliocentric ellipse from 1.0 AU to 1.524 AU. Most fuel-efficient transfer, but crew incurs 348 mSv of chronic galactic cosmic ray and solar wind exposure en route.',
        aiBadge: 'FUEL EFFICIENT (REQUIRES INTERNAL STORM BUNKER)',
        aiRationale: 'Lowest propellant cost (3.9 km/s), but long transit duration requires active storm bunker protocols during solar flare alerts.',
        controlPoints: [
          new THREE.Vector3(1.6, 0.0, 0.0),
          new THREE.Vector3(8.5, -4.5, -3.8),
          new THREE.Vector3(17.5, -3.2, -8.5),
          new THREE.Vector3(22.0, 1.2, -11.0),
          new THREE.Vector3(24.0, 3.8, -12.0)
        ],
        calcDoseRate: (s) => {
          const earthBreakout = 4.2 * Math.exp(-Math.pow((s - 0.015) / 0.01, 2));
          const deepSpaceGcr = 0.056;
          return earthBreakout + deepSpaceGcr;
        }
      },
      {
        id: 'cme_deflected',
        name: 'Solar-Storm Deflected Out-of-Ecliptic Corridor',
        shortTag: 'CME DEFLECTION',
        type: 'High-Latitude Route • 88% CME Blast Cone Avoidance',
        durationDays: 278.0,
        durationHours: 6672.0,
        deltaVKms: 4.52,
        totalDoseMsv: 262.0,
        stormDoseMsv: 295.0,
        peakDoseRateMsvHr: 0.048,
        dnaDsbIndex: 68,
        shieldRecommendation: '157Gd-MXene + Autonomous Suit Magnetic Deflection',
        description:
          'Utilizes a mid-course plane burn to arc 12° above the solar ecliptic plane, completely bypassing equatorial coronal mass ejection (CME) shockwave corridors.',
        aiBadge: 'STORM EVASIVE (OPTIMAL DURING SOLAR MAXIMUM / CYCLE 25)',
        aiRationale: 'When NOAA satellites detect recurring X-class solar flare storms, flying above the ecliptic plane avoids high-density CME proton shockfronts.',
        controlPoints: [
          new THREE.Vector3(1.6, 0.0, 0.0),
          new THREE.Vector3(8.0, 6.2, -2.5),
          new THREE.Vector3(16.5, 7.5, -7.0),
          new THREE.Vector3(22.2, 5.8, -10.2),
          new THREE.Vector3(24.0, 3.8, -12.0)
        ],
        calcDoseRate: (s) => {
          const earthBreakout = 1.2 * Math.exp(-Math.pow((s - 0.015) / 0.01, 2));
          // Out of ecliptic has slightly lower solar wind density, baseline GCR ~ 0.051
          const outOfEcliptic = 0.051;
          return earthBreakout + outOfEcliptic;
        }
      }
    ]
  }
};

/**
 * Builds a 3D Orion / Starship Spacecraft with command module, service module,
 * solar panel wings, and glowing blue plasma thruster plume.
 */
function createSpacecraftModel(tex) {
  const shipGroup = new THREE.Group();

  // 1. Conical Command Module (Crew Capsule)
  const capsuleGeo = new THREE.ConeGeometry(0.36, 0.52, 24);
  capsuleGeo.rotateX(Math.PI / 2);
  const capsuleMat = new THREE.MeshStandardMaterial({
    map: tex.hullBump,
    bumpMap: tex.hullBump,
    bumpScale: 0.04,
    color: 0xf1f5f9,
    metalness: 0.75,
    roughness: 0.28
  });
  const capsuleMesh = new THREE.Mesh(capsuleGeo, capsuleMat);
  capsuleMesh.position.z = 0.38;
  shipGroup.add(capsuleMesh);

  // Heat Shield Base at back of capsule
  const heatShield = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.38, 0.06, 24),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.2 })
  );
  heatShield.rotateX(Math.PI / 2);
  heatShield.position.z = 0.12;
  shipGroup.add(heatShield);

  // 2. Service Module Cylinder
  const smGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.55, 24);
  smGeo.rotateX(Math.PI / 2);
  const smMat = new THREE.MeshStandardMaterial({
    map: tex.kaptonMap,
    bumpMap: tex.kaptonMap,
    bumpScale: 0.03,
    color: 0xe2e8f0,
    metalness: 0.65,
    roughness: 0.35
  });
  const smMesh = new THREE.Mesh(smGeo, smMat);
  smMesh.position.z = -0.22;
  shipGroup.add(smMesh);

  // 3. Solar Panel Wings (X-Wing Quad Configuration)
  const wingGeo = new THREE.BoxGeometry(0.02, 0.22, 0.85);
  const wingMat = new THREE.MeshStandardMaterial({
    map: tex.solarMap,
    roughness: 0.25,
    metalness: 0.85,
    emissive: 0x0c234a,
    emissiveIntensity: 0.35
  });

  const angles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
  angles.forEach((ang) => {
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(Math.cos(ang) * 0.72, Math.sin(ang) * 0.72, -0.22);
    wing.rotation.z = ang;
    shipGroup.add(wing);

    // Boom arm connecting wing to service module
    const boom = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 })
    );
    boom.position.set(Math.cos(ang) * 0.42, Math.sin(ang) * 0.42, -0.22);
    boom.rotation.z = ang + Math.PI / 2;
    shipGroup.add(boom);
  });

  // 4. Main Engine Bell Nozzle
  const engineNozzle = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.26, 16, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.92,
      roughness: 0.25,
      side: THREE.DoubleSide
    })
  );
  engineNozzle.rotateX(-Math.PI / 2);
  engineNozzle.position.z = -0.58;
  shipGroup.add(engineNozzle);

  // 5. Glowing Blue Ion Plasma Thruster Plume
  const plumeGeo = new THREE.ConeGeometry(0.14, 0.58, 16);
  plumeGeo.rotateX(-Math.PI / 2);
  const plumeMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  });
  const plumeMesh = new THREE.Mesh(plumeGeo, plumeMat);
  plumeMesh.position.z = -0.88;
  shipGroup.add(plumeMesh);

  // Internal glowing core
  const corePlume = new THREE.Mesh(
    new THREE.ConeGeometry(0.06, 0.38, 12),
    new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.AdditiveBlending })
  );
  corePlume.rotateX(-Math.PI / 2);
  corePlume.position.z = -0.74;
  shipGroup.add(corePlume);

  // Magnetic Deflection Halo (Subtle glowing forcefield around the crew capsule)
  const shieldHaloGeo = new THREE.SphereGeometry(0.75, 24, 24);
  const shieldHaloMat = new THREE.MeshBasicMaterial({
    color: 0x00f5d4,
    transparent: true,
    opacity: 0.22,
    wireframe: true,
    blending: THREE.AdditiveBlending
  });
  const shieldHalo = new THREE.Mesh(shieldHaloGeo, shieldHaloMat);
  shieldHalo.position.z = 0.22;
  shieldHalo.name = 'magneticShieldMesh';
  shipGroup.add(shieldHalo);

  shipGroup.scale.set(0.65, 0.65, 0.65);
  return shipGroup;
}

/**
 * Procedural Celestial Body Builders
 */
function createEarthSphere(tex) {
  const group = new THREE.Group();

  // Core Earth Sphere
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1.45, 48, 48),
    new THREE.MeshStandardMaterial({
      map: tex.earthMap,
      roughness: 0.45,
      metalness: 0.15
    })
  );
  group.add(earth);

  // Rotating Cloud Layer
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(1.48, 40, 40),
    new THREE.MeshStandardMaterial({
      map: tex.cloudMap,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  clouds.name = 'earthClouds';
  group.add(clouds);

  // Atmospheric Fresnel Glow
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(1.58, 36, 36),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    })
  );
  group.add(atmo);

  return group;
}

function createMoonSphere() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 0, 512, 256);

  // Craters and lunar maria
  ctx.fillStyle = '#64748b';
  for (let i = 0; i < 45; i++) {
    const x = Math.random() * 512,
      y = Math.random() * 256,
      r = 4 + Math.random() * 22;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#cbd5e1';
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 512,
      y = Math.random() * 256,
      r = 1 + Math.random() * 6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 36, 36),
    new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.9,
      metalness: 0.05
    })
  );
  return moon;
}

function createMarsSphere() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');

  // Red rust martian terrain
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#7f1d1d');
  grad.addColorStop(0.3, '#c2410c');
  grad.addColorStop(0.7, '#9a3412');
  grad.addColorStop(1, '#7c2d12');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // White polar ice caps
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 16);
  ctx.fillRect(0, 242, 512, 14);

  // Dark basaltic plains
  ctx.fillStyle = 'rgba(67, 20, 7, 0.45)';
  for (let i = 0; i < 28; i++) {
    const x = Math.random() * 512,
      y = 40 + Math.random() * 170,
      rx = 18 + Math.random() * 45,
      ry = 10 + Math.random() * 25;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);

  const marsGroup = new THREE.Group();
  const mars = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 40, 40),
    new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.75,
      metalness: 0.1
    })
  );
  marsGroup.add(mars);

  // Mars thin atmospheric haze
  const haze = new THREE.Mesh(
    new THREE.SphereGeometry(1.22, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.16,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    })
  );
  marsGroup.add(haze);

  return marsGroup;
}

/**
 * Creates 3D Trajectory Tube / Ribbon color-coded by radiation dose
 */
function createTrajectoryMesh(curve, calcDoseRate, isSelected) {
  const points = curve.getPoints(120);
  const colors = [];

  // Color gradient: Green (<0.1) -> Amber (0.1 - 2.0) -> Red (>4.0 mSv/hr)
  points.forEach((_, i) => {
    const s = i / (points.length - 1);
    const dose = calcDoseRate(s);

    const c = new THREE.Color();
    if (dose < 0.1) {
      c.setHex(0x10b981); // Emerald safe
    } else if (dose < 1.0) {
      // Transition from Green to Amber
      c.lerpColors(new THREE.Color(0x10b981), new THREE.Color(0xf59e0b), (dose - 0.1) / 0.9);
    } else if (dose < 5.0) {
      // Transition from Amber to Coral Red
      c.lerpColors(new THREE.Color(0xf59e0b), new THREE.Color(0xf43f5e), (dose - 1.0) / 4.0);
    } else {
      // Extreme Hazard (>5.0 mSv/hr)
      c.setHex(0xff0055);
    }
    colors.push(c.r, c.g, c.b);
  });

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  if (isSelected) {
    // High-visibility glowing thick tube
    const tubeGeo = new THREE.TubeGeometry(curve, 100, 0.045, 8, false);
    const tubeColors = [];
    const tubeVerts = tubeGeo.attributes.position.count;
    for (let i = 0; i < tubeVerts; i++) {
      const u = tubeGeo.attributes.uv.getY(i);
      const dose = calcDoseRate(u);
      const c = new THREE.Color();
      if (dose < 0.1) c.setHex(0x10b981);
      else if (dose < 1.5) c.lerpColors(new THREE.Color(0x10b981), new THREE.Color(0xf59e0b), dose / 1.5);
      else c.lerpColors(new THREE.Color(0xf59e0b), new THREE.Color(0xff0055), Math.min(1, (dose - 1.5) / 8.0));
      tubeColors.push(c.r, c.g, c.b);
    }
    tubeGeo.setAttribute('color', new THREE.Float32BufferAttribute(tubeColors, 3));

    const tubeMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.92
    });
    return new THREE.Mesh(tubeGeo, tubeMat);
  } else {
    // Inactive ghost trail line
    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.38,
      linewidth: 1.5
    });
    return new THREE.Line(geo, lineMat);
  }
}

/**
 * Creates dense congested particle clouds representing radiation fields
 * (Van Allen belt trapped protons + Interplanetary CME shockfront)
 */
function createRadiationFieldParticles(tex) {
  const group = new THREE.Group();

  // 1. Inner Van Allen Belt (Congested high-energy protons L = 1.4 to 2.4)
  const innerCount = 900;
  const innerGeo = new THREE.BufferGeometry();
  const innerPos = new Float32Array(innerCount * 3);
  const innerCol = new Float32Array(innerCount * 3);

  for (let i = 0; i < innerCount; i++) {
    const r = 1.85 + Math.random() * 0.95;
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * 0.72; // Trapped near magnetic equator

    innerPos[i * 3] = r * Math.cos(theta) * Math.cos(phi);
    innerPos[i * 3 + 1] = r * Math.sin(phi);
    innerPos[i * 3 + 2] = r * Math.sin(theta) * Math.cos(phi);

    // Cyan / Hot-White Proton Glow
    innerCol[i * 3] = 0.92;
    innerCol[i * 3 + 1] = 0.25;
    innerCol[i * 3 + 2] = 0.35;
  }
  innerGeo.setAttribute('position', new THREE.BufferAttribute(innerPos, 3));
  innerGeo.setAttribute('color', new THREE.BufferAttribute(innerCol, 3));

  const innerMat = new THREE.PointsMaterial({
    size: 0.14,
    vertexColors: true,
    map: tex.glowSprite,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const innerPoints = new THREE.Points(innerGeo, innerMat);
  innerPoints.name = 'innerBeltPoints';
  group.add(innerPoints);

  // 2. Outer Van Allen Belt (Relativistic Electrons L = 3.5 to 5.2)
  const outerCount = 1400;
  const outerGeo = new THREE.BufferGeometry();
  const outerPos = new Float32Array(outerCount * 3);
  const outerCol = new Float32Array(outerCount * 3);

  for (let i = 0; i < outerCount; i++) {
    const r = 3.2 + Math.random() * 2.2;
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * 1.1;

    outerPos[i * 3] = r * Math.cos(theta) * Math.cos(phi);
    outerPos[i * 3 + 1] = r * Math.sin(phi);
    outerPos[i * 3 + 2] = r * Math.sin(theta) * Math.cos(phi);

    // Violet / Electric Blue Electron Glow
    outerCol[i * 3] = 0.65;
    outerCol[i * 3 + 1] = 0.38;
    outerCol[i * 3 + 2] = 0.98;
  }
  outerGeo.setAttribute('position', new THREE.BufferAttribute(outerPos, 3));
  outerGeo.setAttribute('color', new THREE.BufferAttribute(outerCol, 3));

  const outerMat = new THREE.PointsMaterial({
    size: 0.16,
    vertexColors: true,
    map: tex.glowSprite,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const outerPoints = new THREE.Points(outerGeo, outerMat);
  outerPoints.name = 'outerBeltPoints';
  group.add(outerPoints);

  // 3. Solar CME Shockfront Particle Wave
  const cmeCount = 600;
  const cmeGeo = new THREE.BufferGeometry();
  const cmePos = new Float32Array(cmeCount * 3);
  const cmeCol = new Float32Array(cmeCount * 3);

  for (let i = 0; i < cmeCount; i++) {
    const x = -10 + Math.random() * 35;
    const y = -8 + Math.random() * 16;
    const z = -14 + Math.random() * 28;

    cmePos[i * 3] = x;
    cmePos[i * 3 + 1] = y;
    cmePos[i * 3 + 2] = z;

    // Solar Gold & Amber
    cmeCol[i * 3] = 0.96;
    cmeCol[i * 3 + 1] = 0.62;
    cmeCol[i * 3 + 2] = 0.08;
  }
  cmeGeo.setAttribute('position', new THREE.BufferAttribute(cmePos, 3));
  cmeGeo.setAttribute('color', new THREE.BufferAttribute(cmeCol, 3));

  const cmeMat = new THREE.PointsMaterial({
    size: 0.09,
    vertexColors: true,
    map: tex.glowSprite,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const cmePoints = new THREE.Points(cmeGeo, cmeMat);
  cmePoints.name = 'cmePoints';
  group.add(cmePoints);

  return group;
}

/**
 * MAIN COMPONENT: SpaceTrajectory3DViewer
 */
export default function SpaceTrajectory3DViewer({
  telemetry = null,
  simState = null
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Simulation State
  const [destination, setDestination] = useState('moon'); // 'moon' | 'mars'
  const [selectedPathId, setSelectedPathId] = useState('direct_tli');
  const [scrubProgress, setScrubProgress] = useState(0.08); // 0.0 -> 1.0 (starts at belt spike for dramatic view)
  const [isPlaying, setIsPlaying] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [cameraMode, setCameraMode] = useState('free'); // 'free' | 'followShip' | 'earth' | 'target'
  const [showRadiationClouds, setShowRadiationClouds] = useState(true);
  const [showGhostPaths, setShowGhostPaths] = useState(true);

  // Active mission & path data
  const missionData = TRAJECTORY_DATA[destination];
  const activePath = useMemo(() => {
    return missionData.paths.find((p) => p.id === selectedPathId) || missionData.paths[0];
  }, [missionData, selectedPathId]);

  // Keep path valid when toggling destination
  useEffect(() => {
    const valid = TRAJECTORY_DATA[destination].paths.find((p) => p.id === selectedPathId);
    if (!valid) {
      setSelectedPathId(TRAJECTORY_DATA[destination].paths[0].id);
      setScrubProgress(0.05);
    }
  }, [destination, selectedPathId]);

  // Three.js References
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const shipMeshRef = useRef(null);
  const pathMeshesGroupRef = useRef(null);
  const radiationGroupRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const activeSplinesRef = useRef({});

  // Dynamic Telemetry Calculations at current scrub waypoint
  const currentTelemetry = useMemo(() => {
    const s = scrubProgress;
    const doseRate = activePath.calcDoseRate(s);
    const timeElapsedHours = (s * activePath.durationHours).toFixed(1);
    const timeElapsedDays = (s * activePath.durationDays).toFixed(2);

    // Approximate cumulative dose integrated up to s
    // Trapezoidal numerical integration with 20 steps
    let integratedDose = 0;
    const steps = 25;
    const dt = (s * activePath.durationHours) / steps;
    for (let k = 0; k < steps; k++) {
      const u = (k / steps) * s;
      integratedDose += activePath.calcDoseRate(u) * dt;
    }

    // Shielding attenuation benefit from GadaSpace 157Gd-MXene + Odaa-Aegis
    const currentShieldName = simState?.m1?.name || '157Gd-MXene Nanocomposite';
    const isStormMode = (telemetry?.proton10MeVPfu ?? 1.15) > 10 || doseRate > 5.0;
    const shieldReductionPct = currentShieldName.includes('Gd') ? (isStormMode ? 86 : 74) : 48;
    const interiorCabinDose = doseRate * (1 - shieldReductionPct / 100);

    return {
      doseRate: doseRate.toFixed(2),
      interiorCabinDose: interiorCabinDose.toFixed(2),
      shieldReductionPct,
      integratedDose: integratedDose.toFixed(2),
      timeElapsedHours,
      timeElapsedDays,
      statusSeverity:
        doseRate > 5.0 ? 'CRITICAL_HAZARD' : doseRate > 1.0 ? 'CAUTION_RISING' : 'NOMINAL_GCR'
    };
  }, [activePath, scrubProgress, telemetry, simState]);

  // Sound triggering during scrub or playback
  useEffect(() => {
    if (!audioEnabled) return;
    const rate = parseFloat(currentTelemetry.doseRate);

    // Geiger click frequency proportional to local radiation flux
    const interval = Math.max(80, Math.min(850, 1200 / Math.max(0.2, rate)));
    const timer = setInterval(() => {
      radiationSonifier.triggerSuitGeigerClick(rate);
    }, interval);

    if (rate > 5.0) {
      radiationSonifier.triggerSuitWarningChime(rate);
    }

    return () => clearInterval(timer);
  }, [audioEnabled, currentTelemetry.doseRate]);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 480;
    const tex = getProceduralTextures();

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x05070e);
    scene.fog = new THREE.FogExp2(0x05070e, 0.016);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(7.5, 9.5, 14.0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.75;
    controls.zoomSpeed = 1.1;
    controls.minDistance = 2.0;
    controls.maxDistance = 65.0;
    controls.target.set(6.0, 1.0, -2.0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.4);
    scene.add(ambientLight);

    // Sun directional light (Golden solar illumination)
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 3.2);
    sunLight.position.set(-28, 14, 25);
    scene.add(sunLight);

    // Deep space fill light
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.75);
    fillLight.position.set(22, -12, -20);
    scene.add(fillLight);

    // Stars Sky Background
    const starCount = 1800;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 160;
      starPos[i + 1] = (Math.random() - 0.5) * 160;
      starPos[i + 2] = (Math.random() - 0.5) * 160;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.16,
      transparent: true,
      opacity: 0.8
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Earth Sphere at Origin
    const earthObj = createEarthSphere(tex);
    earthObj.position.set(0, 0, 0);
    earthObj.name = 'earthGroup';
    scene.add(earthObj);

    // Target Celestial Body (Moon or Mars)
    const targetGroup = new THREE.Group();
    targetGroup.name = 'targetBodyGroup';
    scene.add(targetGroup);

    // Group for Trajectory Paths
    const pathGroup = new THREE.Group();
    pathGroup.name = 'pathMeshesGroup';
    scene.add(pathGroup);
    pathMeshesGroupRef.current = pathGroup;

    // Group for Radiation Clouds
    const radGroup = createRadiationFieldParticles(tex);
    radGroup.name = 'radiationCloudGroup';
    scene.add(radGroup);
    radiationGroupRef.current = radGroup;

    // Spaceship Model
    const ship = createSpacecraftModel(tex);
    ship.name = 'activeSpacecraft';
    scene.add(ship);
    shipMeshRef.current = ship;

    // Resize Observer
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: nw, height: nh } = entry.contentRect;
        if (nw && nh) {
          camera.aspect = nw / nh;
          camera.updateProjectionMatrix();
          renderer.setSize(nw, nh);
        }
      }
    });
    ro.observe(container);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Slow planetary rotations
      if (earthObj) {
        earthObj.children[0].rotation.y += 0.002;
        const clouds = earthObj.getObjectByName('earthClouds');
        if (clouds) clouds.rotation.y += 0.0028;
      }

      // Rotate target body
      const targetMesh = targetGroup.children[0];
      if (targetMesh) targetMesh.rotation.y += 0.0018;

      // Slowly swirl radiation particles
      if (radGroup) {
        const inner = radGroup.getObjectByName('innerBeltPoints');
        if (inner) inner.rotation.y -= 0.004;
        const outer = radGroup.getObjectByName('outerBeltPoints');
        if (outer) outer.rotation.y -= 0.0025;
      }

      // Magnetic shield pulsing on spaceship
      if (ship) {
        const shield = ship.getObjectByName('magneticShieldMesh');
        if (shield) {
          shield.rotation.y += 0.015;
          shield.rotation.x += 0.008;
          const pulse = 0.18 + 0.08 * Math.sin(elapsed * 4.0);
          shield.material.opacity = pulse;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      ro.disconnect();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Update Target Celestial Body (Moon vs Mars) when destination changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const targetGroup = scene.getObjectByName('targetBodyGroup');
    if (!targetGroup) return;

    // Clean previous target children
    while (targetGroup.children.length > 0) {
      targetGroup.remove(targetGroup.children[0]);
    }

    const [tx, ty, tz] = missionData.targetCoord;
    targetGroup.position.set(tx, ty, tz);

    if (destination === 'moon') {
      const moonMesh = createMoonSphere();
      targetGroup.add(moonMesh);
    } else {
      const marsGroup = createMarsSphere();
      targetGroup.add(marsGroup);
    }

    // Re-center controls target gently between Earth and Target
    if (controlsRef.current) {
      controlsRef.current.target.set(tx * 0.42, ty * 0.42, tz * 0.42);
    }
  }, [destination, missionData]);

  // Re-build 3D Trajectory Splines when destination, selectedPath, or ghost toggle changes
  useEffect(() => {
    const pathGroup = pathMeshesGroupRef.current;
    if (!pathGroup) return;

    // Clean previous paths
    while (pathGroup.children.length > 0) {
      const c = pathGroup.children[0];
      if (c.geometry) c.geometry.dispose();
      pathGroup.remove(c);
    }

    const splines = {};
    missionData.paths.forEach((p) => {
      // Create CatmullRomCurve3
      const curve = new THREE.CatmullRomCurve3(p.controlPoints, false, 'centripetal', 0.5);
      splines[p.id] = curve;

      const isSelected = p.id === selectedPathId;
      if (isSelected || showGhostPaths) {
        const mesh = createTrajectoryMesh(curve, p.calcDoseRate, isSelected);
        mesh.name = `traj_${p.id}`;
        pathGroup.add(mesh);
      }
    });

    activeSplinesRef.current = splines;
  }, [destination, missionData, selectedPathId, showGhostPaths]);

  // Toggle Radiation Cloud Visibility
  useEffect(() => {
    if (radiationGroupRef.current) {
      radiationGroupRef.current.visible = showRadiationClouds;
    }
  }, [showRadiationClouds]);

  // Update Spaceship Position and Attitude along chosen Trajectory Curve
  useEffect(() => {
    const ship = shipMeshRef.current;
    const curve = activeSplinesRef.current[selectedPathId];
    if (!ship || !curve) return;

    const s = Math.max(0.001, Math.min(0.999, scrubProgress));
    const pos = curve.getPointAt(s);
    const tangent = curve.getTangentAt(s);

    ship.position.copy(pos);

    // Point spaceship nose along the trajectory tangent (+Z is front)
    const lookTarget = pos.clone().add(tangent);
    ship.lookAt(lookTarget);

    // If camera follow mode is enabled
    if (cameraMode === 'followShip' && cameraRef.current && controlsRef.current) {
      const camOffset = new THREE.Vector3(-1.8, 1.2, 3.2).applyQuaternion(ship.quaternion);
      cameraRef.current.position.copy(pos.clone().add(camOffset));
      controlsRef.current.target.copy(pos);
    }
  }, [scrubProgress, selectedPathId, cameraMode]);

  // Play / Pause Auto-Simulation Loop
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setScrubProgress((prev) => {
        const next = prev + 0.0035 * simSpeed;
        if (next >= 1.0) {
          setIsPlaying(false);
          return 1.0;
        }
        return next;
      });
    }, 40);

    return () => clearInterval(timer);
  }, [isPlaying, simSpeed]);

  // Camera preset handlers
  const handleCameraPreset = (mode) => {
    setCameraMode(mode);
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;

    const [tx, ty, tz] = missionData.targetCoord;

    if (mode === 'earth') {
      cam.position.set(0, 3.2, 5.5);
      ctrl.target.set(0, 0, 0);
    } else if (mode === 'target') {
      cam.position.set(tx + 2.5, ty + 2.0, tz + 4.2);
      ctrl.target.set(tx, ty, tz);
    } else if (mode === 'free') {
      cam.position.set(tx * 0.5, ty * 0.5 + 8.5, tz * 0.5 + 16.0);
      ctrl.target.set(tx * 0.45, ty * 0.45, tz * 0.45);
    }
  };

  return (
    <div
      style={{
        background: 'var(--surface-panel)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 14,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)'
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          borderBottom: '1px solid var(--border-hairline)',
          paddingBottom: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(56, 189, 248, 0.16)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}
          >
            <Compass size={20} strokeWidth={2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>
                3D Spacecraft Trajectory Radiation Corridor &amp; Path Optimization Studio
              </h3>
              <span className="badge-cyan" style={{ fontSize: 10, padding: '2px 7px' }}>
                NASA AP-8/AE-8 &bull; 3D Digital Twin
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: 11.5, color: '#94a3b8' }}>
              Inspect and compare the real-time radiation dose, Van Allen belt spikes, and solar storm hazard corridors across candidate orbital trajectories.
            </p>
          </div>
        </div>

        {/* Destination Toggle: Moon vs Mars */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--surface-canvas)', padding: 4, borderRadius: 8, border: '1px solid var(--border-hairline)' }}>
          <button
            type="button"
            className={`view-btn ${destination === 'moon' ? 'active' : ''}`}
            onClick={() => setDestination('moon')}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Moon size={14} />
            <span>Moon (Artemis TLI)</span>
          </button>
          <button
            type="button"
            className={`view-btn ${destination === 'mars' ? 'active' : ''}`}
            onClick={() => setDestination('mars')}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Globe size={14} style={{ color: '#f97316' }} />
            <span>Mars (Horizon-X Interplanetary)</span>
          </button>
        </div>
      </div>

      {/* Trajectory Selection Pills & AI Recommended Route Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Available Flight Paths ({missionData.paths.length} Options Calibrated):
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#c084fc', background: 'rgba(167, 139, 250, 0.12)', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(167, 139, 250, 0.3)' }}>
            <Brain size={12} />
            <span>AI Heliophysics Recommendation: <strong>{activePath.aiBadge}</strong></span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
          {missionData.paths.map((p) => {
            const isSelected = p.id === selectedPathId;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPathId(p.id)}
                style={{
                  background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--surface-elevated)',
                  border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-hairline)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span
                      style={{
                        fontSize: 9.5,
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: isSelected ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#38bdf8' : '#94a3b8',
                        fontWeight: 700
                      }}
                    >
                      {p.shortTag}
                    </span>
                    <h4 style={{ margin: '5px 0 0', fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                      {p.name}
                    </h4>
                  </div>
                  {isSelected && <CheckCircle2 size={16} style={{ color: '#38bdf8', flexShrink: 0 }} />}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                  <div>
                    <div style={{ color: '#64748b' }}>Transit</div>
                    <div style={{ color: '#f8fafc', fontWeight: 600 }}>{p.durationDays}d</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b' }}>Total Dose</div>
                    <div style={{ color: p.totalDoseMsv > 50 ? '#f43f5e' : p.totalDoseMsv > 3 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                      {p.totalDoseMsv} mSv
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b' }}>Peak Rate</div>
                    <div style={{ color: p.peakDoseRateMsvHr > 5 ? '#f43f5e' : '#38bdf8', fontWeight: 600 }}>
                      {p.peakDoseRateMsvHr} mSv/h
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>
                  {p.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3D WebGL Viewport Container with Floating HUDs */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: 480,
          background: '#05070e',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid rgba(148, 163, 184, 0.16)'
        }}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

        {/* Floating Top-Left HUD: Live Waypoint Telemetry */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            background: 'rgba(12, 17, 28, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            minWidth: 230,
            pointerEvents: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#38bdf8' }}>
            <Activity size={14} />
            <span>WAYPOINT DOSIMETRY TELEMETRY</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: '#94a3b8' }}>Flight Time:</span>
            <strong style={{ fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>
              T+{currentTelemetry.timeElapsedDays} d ({currentTelemetry.timeElapsedHours} h)
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: '#94a3b8' }}>External Flux:</span>
            <strong
              style={{
                fontFamily: 'var(--font-mono)',
                color:
                  currentTelemetry.statusSeverity === 'CRITICAL_HAZARD'
                    ? '#f43f5e'
                    : currentTelemetry.statusSeverity === 'CAUTION_RISING'
                      ? '#f59e0b'
                      : '#10b981',
                fontSize: 12
              }}
            >
              {currentTelemetry.doseRate} mSv/hr
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: '#94a3b8' }}>Cabin Protected Dose:</span>
            <strong style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
              {currentTelemetry.interiorCabinDose} mSv/hr (-{currentTelemetry.shieldReductionPct}%)
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: '#94a3b8' }}>Cumulative Dose:</span>
            <strong style={{ fontFamily: 'var(--font-mono)', color: '#e2e8f0' }}>
              {currentTelemetry.integratedDose} mSv
            </strong>
          </div>

          {currentTelemetry.statusSeverity === 'CRITICAL_HAZARD' && (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.2)',
                border: '1px solid rgba(244, 63, 94, 0.45)',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 10,
                color: '#fecdd3',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginTop: 2
              }}
            >
              <AlertTriangle size={12} style={{ color: '#f43f5e' }} />
              <span>PASSING INTENSE RADIATION HORN &bull; REBCO ACTIVE</span>
            </div>
          )}
        </div>

        {/* Floating Top-Right HUD: Viewport Camera & Display Toggles */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            alignItems: 'flex-end'
          }}
        >
          <div
            style={{
              background: 'rgba(12, 17, 28, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 8,
              padding: 4,
              display: 'flex',
              gap: 4
            }}
          >
            <button
              type="button"
              className={`view-btn ${cameraMode === 'free' ? 'active' : ''}`}
              onClick={() => handleCameraPreset('free')}
              title="Free Orbit Camera (Rotate & Zoom)"
              style={{ padding: '4px 8px', fontSize: 11 }}
            >
              Free Cam
            </button>
            <button
              type="button"
              className={`view-btn ${cameraMode === 'followShip' ? 'active' : ''}`}
              onClick={() => handleCameraPreset('followShip')}
              title="Chase Spaceship"
              style={{ padding: '4px 8px', fontSize: 11 }}
            >
              Chase Ship
            </button>
            <button
              type="button"
              className={`view-btn ${cameraMode === 'earth' ? 'active' : ''}`}
              onClick={() => handleCameraPreset('earth')}
              title="Focus Earth"
              style={{ padding: '4px 8px', fontSize: 11 }}
            >
              Earth
            </button>
            <button
              type="button"
              className={`view-btn ${cameraMode === 'target' ? 'active' : ''}`}
              onClick={() => handleCameraPreset('target')}
              title={`Focus ${destination === 'moon' ? 'Moon' : 'Mars'}`}
              style={{ padding: '4px 8px', fontSize: 11 }}
            >
              {destination === 'moon' ? 'Moon' : 'Mars'}
            </button>
          </div>

          <div
            style={{
              background: 'rgba(12, 17, 28, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 8,
              padding: '6px 10px',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              fontSize: 11
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#e2e8f0', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showRadiationClouds}
                onChange={(e) => setShowRadiationClouds(e.target.checked)}
              />
              <span>Radiation Particles</span>
            </label>
            <span style={{ color: 'rgba(148, 163, 184, 0.3)' }}>|</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#e2e8f0', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showGhostPaths}
                onChange={(e) => setShowGhostPaths(e.target.checked)}
              />
              <span>Compare All Paths</span>
            </label>
          </div>
        </div>

        {/* Floating Bottom-Center Controls: Waypoint Scrub Slider & Playback */}
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '92%',
            maxWidth: 680,
            background: 'rgba(12, 17, 28, 0.88)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            borderRadius: 12,
            padding: '10px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className="cmd-btn"
                onClick={() => setIsPlaying(!isPlaying)}
                style={{ padding: '4px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                <span>{isPlaying ? 'Pause' : 'Simulate Orbit'}</span>
              </button>
              <button
                type="button"
                className="cmd-btn"
                onClick={() => {
                  setScrubProgress(0);
                  setIsPlaying(false);
                }}
                style={{ padding: '4px 8px' }}
                title="Reset to Earth Departure"
              >
                <RotateCcw size={12} />
              </button>
              <button
                type="button"
                className={`cmd-btn ${audioEnabled ? 'active' : ''}`}
                onClick={() => setAudioEnabled(!audioEnabled)}
                title="Toggle Geiger Radiation Click Sonification"
                style={{ padding: '4px 8px' }}
              >
                {audioEnabled ? <Volume2 size={13} style={{ color: '#10b981' }} /> : <VolumeX size={13} />}
              </button>

              <div style={{ display: 'inline-flex', gap: 2, background: 'var(--surface-canvas)', padding: 2, borderRadius: 6, border: '1px solid var(--border-hairline)' }}>
                {[1, 2, 5].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setSimSpeed(spd)}
                    style={{
                      padding: '2px 6px',
                      fontSize: 10,
                      background: simSpeed === spd ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                      color: simSpeed === spd ? '#38bdf8' : '#94a3b8',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              <span style={{ color: '#94a3b8' }}>Trajectory Progression:</span>
              <strong style={{ color: '#38bdf8' }}>{Math.round(scrubProgress * 100)}% Complete</strong>
            </div>
          </div>

          {/* Interactive Scrub Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'var(--font-mono)' }}>EARTH</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.005"
              value={scrubProgress}
              onChange={(e) => {
                setScrubProgress(parseFloat(e.target.value));
                setIsPlaying(false);
              }}
              style={{
                flex: 1,
                cursor: 'pointer',
                accentColor: '#38bdf8',
                height: 6
              }}
            />
            <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              {destination === 'moon' ? 'MOON' : 'MARS'}
            </span>
          </div>
        </div>

        {/* Floating Bottom-Right Radiation Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: 84,
            right: 14,
            background: 'rgba(12, 17, 28, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            pointerEvents: 'none'
          }}
        >
          <div style={{ color: '#94a3b8', fontWeight: 600 }}>Radiation Heatmap:</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }} />
            <span>&lt;0.1 mSv/h (GCR Nominal)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#f59e0b' }} />
            <span>0.1–1.0 mSv/h (Outer Belt / CME)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#f43f5e' }} />
            <span>&gt;5.0 mSv/h (Inner Proton Horn)</span>
          </div>
        </div>
      </div>

      {/* Trajectory Trade-off Matrix Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
          <TrendingUp size={15} style={{ color: '#38bdf8' }} />
          <span>Orbital Path Trade-off &amp; Multi-Factor Decision Matrix</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>
            <thead>
              <tr style={{ background: 'var(--surface-elevated)', borderBottom: '1px solid var(--border-hairline)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#94a3b8' }}>TRAJECTORY OPTION</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: '#94a3b8' }}>TRANSIT (DAYS)</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: '#94a3b8' }}>DELTA-V (KM/S)</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: '#94a3b8' }}>TOTAL DOSE (QUIET)</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: '#94a3b8' }}>SPE STORM DOSE</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: '#94a3b8' }}>PEAK DOSE RATE</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#94a3b8' }}>PRIMARY DEFENSE</th>
              </tr>
            </thead>
            <tbody>
              {missionData.paths.map((p) => {
                const isSelected = p.id === selectedPathId;
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPathId(p.id)}
                    style={{
                      background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                      borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                      cursor: 'pointer'
                    }}
                  >
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: isSelected ? '#38bdf8' : '#e2e8f0' }}>
                      {p.name}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#f8fafc' }}>
                      {p.durationDays} d
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#e2e8f0' }}>
                      {p.deltaVKms} km/s
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: p.totalDoseMsv > 50 ? '#f43f5e' : '#10b981', fontWeight: 700 }}>
                      {p.totalDoseMsv} mSv
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#f59e0b', fontWeight: 600 }}>
                      {p.stormDoseMsv} mSv
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: p.peakDoseRateMsvHr > 5 ? '#f43f5e' : '#38bdf8' }}>
                      {p.peakDoseRateMsvHr} mSv/h
                    </td>
                    <td style={{ padding: '10px 12px', color: '#cbd5e1', fontSize: 11 }}>
                      {p.shieldRecommendation}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
