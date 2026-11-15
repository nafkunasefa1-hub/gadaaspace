import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {
  Rocket,
  Globe,
  Moon,
  Scissors,
  Radio,
  Maximize2,
  Minimize2,
  Box,
  Sparkles,
  RefreshCw,
  Crosshair,
  Layers,
  MousePointer2,
  X
} from 'lucide-react';
import { getProceduralTextures } from './textures';

export default function ThreeViewport({ simState, activeScene, setActiveScene }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const controlsRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const composerRef = useRef(null);
  const bloomPassRef = useRef(null);

  const mainGroupRef = useRef(null);
  const particleSystemGroupRef = useRef(null);
  const voxelGroupRef = useRef(null);
  const organMeshesRef = useRef([]);
  const rayParticlesRef = useRef([]);
  const earthMeshRef = useRef(null);
  const cloudMeshRef = useRef(null);
  const orbitShipGroupRef = useRef(null);

  const [showCutaway, setShowCutaway] = React.useState(true);
  const [showVoxels, setShowVoxels] = React.useState(true);
  const [useBloom, setUseBloom] = React.useState(true);
  const useBloomRef = useRef(true);
  const [autoRotate, setAutoRotate] = React.useState(false);
  const [activeCamPreset, setActiveCamPreset] = React.useState('exterior');
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showLegend, setShowLegend] = React.useState(false);

  const camAnimRef = useRef(null);
  const orbitProgressRef = useRef(0);
  const activeSceneRef = useRef(activeScene);

  useEffect(() => {
    activeSceneRef.current = activeScene;
  }, [activeScene]);

  useEffect(() => {
    useBloomRef.current = useBloom;
  }, [useBloom]);

  // Initialize Three.js
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 470;
    const tex = getProceduralTextures();

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(6.8, 3.8, 9.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // PMREM Environment map
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x060c1e);
    const envLight1 = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    envLight1.position.set(25, 20, 25);
    envScene.add(envLight1);
    const envLight2 = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 16), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    envLight2.position.set(-25, -15, -20);
    envScene.add(envLight2);
    const envLight3 = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 16), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    envLight3.position.set(0, 28, -25);
    envScene.add(envLight3);
    scene.environment = pmrem.fromScene(envScene, 0.04).texture;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.rotateSpeed = 0.75;
    controls.zoomSpeed = 1.1;
    controls.panSpeed = 0.8;
    controls.minDistance = 2.6;
    controls.maxDistance = 38.0;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Post processing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.62, 0.45, 0.74);
    composer.addPass(bloomPass);
    composerRef.current = composer;
    bloomPassRef.current = bloomPass;

    // Lights
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.65);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.4);
    sunLight.position.set(18, 22, 16);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    rimLight.position.set(-16, -10, -14);
    scene.add(rimLight);

    const cabinPointLight = new THREE.PointLight(0x38bdf8, 1.4, 8.0);
    cabinPointLight.position.set(-0.5, 0.4, 0.0);
    scene.add(cabinPointLight);

    // Blazing Solar Corona Sprite
    const sunSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex.glowSprite, color: 0xfff7ed, transparent: true, blending: THREE.AdditiveBlending })
    );
    sunSprite.position.set(42, 34, -45);
    sunSprite.scale.set(16, 16, 1);
    scene.add(sunSprite);

    // Deep Space Starfield
    const starGeo = new THREE.BufferGeometry();
    const count = 1800;
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const kelvinPalette = [
      new THREE.Color(0x9bb0ff),
      new THREE.Color(0xcad7ff),
      new THREE.Color(0xf8f7ff),
      new THREE.Color(0xfff4ea),
      new THREE.Color(0xffd2a1)
    ];
    for (let i = 0; i < count; i++) {
      const r = 65 + Math.random() * 90;
      const theta = Math.random() * Math.PI * 2;
      const phi = (i < count * 0.4)
        ? (Math.PI / 2 + (Math.random() - 0.5) * 0.32)
        : Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const c = kelvinPalette[i % kelvinPalette.length];
      cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const starMat = new THREE.PointsMaterial({ size: 0.35, vertexColors: true, transparent: true, opacity: 0.88 });
    const stars = new THREE.Points(starGeo, starMat);
    stars.rotation.z = 0.42;
    scene.add(stars);

    const mainGroup = new THREE.Group();
    const particleSystemGroup = new THREE.Group();
    const voxelGroup = new THREE.Group();
    scene.add(mainGroup);
    scene.add(particleSystemGroup);
    scene.add(voxelGroup);
    mainGroupRef.current = mainGroup;
    particleSystemGroupRef.current = particleSystemGroup;
    voxelGroupRef.current = voxelGroup;

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        composer.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => handleResize())
      : null;
    if (resizeObserver && container) {
      resizeObserver.observe(container);
    }

    // Animation Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const tNow = performance.now() * 0.001;

      if (camAnimRef.current && controlsRef.current) {
        const anim = camAnimRef.current;
        anim.t = Math.min(1.0, anim.t + 0.045);
        const ease = 1 - Math.pow(1 - anim.t, 3);
        camera.position.lerpVectors(anim.startPos, anim.endPos, ease);
        controls.target.lerpVectors(anim.startTarget, anim.endTarget, ease);
        if (anim.t >= 1.0) camAnimRef.current = null;
      }

      controls.update();

      organMeshesRef.current.forEach((om, idx) => {
        const s = 1.0 + 0.18 * Math.sin(tNow * 4.0 + idx);
        om.scale.set(s, s, s);
      });

      if (activeSceneRef.current === 'habitat') {
        rayParticlesRef.current.forEach(p => {
          p.position.x += p.userData.vx;
          p.position.y += p.userData.vy;
          p.position.z += p.userData.vz;
          const rDist = Math.sqrt(p.position.y * p.position.y + p.position.z * p.position.z);

          // Active ReBCO Mini-Magnetosphere Lorentz deflection before hull impact
          if (
            p.userData.stage === 'primary' &&
            !p.userData.checkedMag &&
            p.position.y < 3.05 &&
            p.position.y > 2.25
          ) {
            p.userData.checkedMag = true;
            if (Math.random() < (p.userData.magDeflectFrac || 0)) {
              p.userData.stage = 'deflected';
              p.material.color.setHex(0x38bdf8);
              const dirZ = p.position.z >= 0 ? 1 : -1;
              p.userData.vz = dirZ * (0.065 + Math.random() * 0.035);
              p.userData.vx = (p.position.x + 1.1 >= 0 ? 1 : -1) * 0.045;
              p.userData.vy *= 0.85;
              p.rotation.x = dirZ * 0.55;
            }
          }

          if (p.userData.stage === 'primary' && p.position.y < 1.95 && rDist < 1.95) {
            if (p.userData.isHighSpall) {
              p.userData.stage = 'spallation';
              p.material.color.setHex(Math.random() < 0.58 ? 0xfbbf24 : 0xf43f5e);
              p.userData.vx = (Math.random() - 0.5) * 0.075;
              p.userData.vz = (Math.random() - 0.5) * 0.075;
              p.rotation.z = (Math.random() - 0.5) * 1.2;
            } else {
              p.userData.stage = 'moderated';
              p.material.color.setHex(0x38bdf8);
              p.userData.vy *= 0.62;
            }
          }
          if (p.userData.stage === 'moderated' && p.position.y < 1.60) {
            if (Math.random() < 0.88) {
              p.material.color.setHex(0x10b981);
              p.scale.set(2.2, 0.4, 2.2);
              p.position.set(-2.2 + Math.random() * 3.8, 4.6 + Math.random() * 2.8, (Math.random() - 0.5) * 2.8);
              p.userData.stage = 'primary';
              p.userData.checkedMag = false;
              p.userData.vy = -(0.065 + Math.random() * 0.04);
              p.userData.vx = (Math.random() - 0.5) * 0.012;
              p.userData.vz = (Math.random() - 0.5) * 0.012;
              p.rotation.set(0, 0, 0);
            }
          }
          if (p.position.y < -2.3 || Math.abs(p.position.z) > 4.2) {
            p.position.set(-2.2 + Math.random() * 3.8, 4.6 + Math.random() * 2.8, (Math.random() - 0.5) * 2.8);
            p.userData.stage = 'primary';
            p.userData.checkedMag = false;
            p.userData.vy = -(0.065 + Math.random() * 0.04);
            p.userData.vx = (Math.random() - 0.5) * 0.012;
            p.userData.vz = (Math.random() - 0.5) * 0.012;
            p.scale.set(1, 1, 1);
            p.rotation.set(0, 0, 0);
            p.material.color.setHex(0xf43f5e);
          }
        });
      } else if (activeSceneRef.current === 'vanallen') {
        if (earthMeshRef.current) earthMeshRef.current.rotation.y += 0.0025;
        if (cloudMeshRef.current) cloudMeshRef.current.rotation.y += 0.0034;
        if (particleSystemGroup.children[0]) particleSystemGroup.children[0].rotation.y -= 0.003;
        if (orbitShipGroupRef.current && orbitShipGroupRef.current.userData.curvePts) {
          const pts = orbitShipGroupRef.current.userData.curvePts;
          orbitProgressRef.current = (orbitProgressRef.current + 0.42) % pts.length;
          const idx = Math.floor(orbitProgressRef.current);
          const nextIdx = (idx + 1) % pts.length;
          const frac = orbitProgressRef.current - idx;
          
          orbitShipGroupRef.current.position.lerpVectors(pts[idx], pts[nextIdx], frac);
          orbitShipGroupRef.current.lookAt(pts[nextIdx]);
          // Rotate local child mesh 90deg yaw so Orion's -X nose points straight along +Z curve tangent
          if (orbitShipGroupRef.current.children[0]) {
            orbitShipGroupRef.current.children[0].rotation.y = Math.PI / 2;
          }

          // Pulse the telemetry beacon LED
          if (orbitShipGroupRef.current.userData.beacon) {
            const bScale = 1.0 + 0.5 * Math.sin(tNow * 10.0);
            orbitShipGroupRef.current.userData.beacon.scale.set(bScale, bScale, bScale);
          }
        }
      } else if (activeSceneRef.current === 'planetary') {
        rayParticlesRef.current.forEach(p => {
          p.position.y += p.userData.vy;
          p.position.x += p.userData.vx;
          if (p.userData.isMoonSide) {
            if (!p.userData.bounced && p.position.y <= -1.6) {
              p.userData.bounced = true;
              p.userData.vy = 0.042;
              p.userData.vx = (Math.random() - 0.5) * 0.035;
              p.material.color.setHex(0xfbbf24);
            }
            if (p.userData.bounced && p.position.y > 2.4) {
              p.position.set(-2.9 + (Math.random() - 0.5) * 4.2, 3.8, (Math.random() - 0.5) * 4.2);
              p.userData.vy = -0.06; p.userData.vx = 0; p.userData.bounced = false;
              p.material.color.setHex(0xf43f5e);
            }
          } else {
            if (p.position.y <= 0.35 && !p.userData.bounced) {
              if (Math.random() < 0.72) {
                p.userData.bounced = true;
                p.material.color.setHex(0x10b981);
                p.userData.vy = 0.03;
                p.userData.vx = (p.position.x - 2.9) * 0.045;
              }
            }
            if (p.position.y < -1.65 || (p.userData.bounced && p.position.y > 2.5)) {
              p.position.set(2.9 + (Math.random() - 0.5) * 4.2, 3.8, (Math.random() - 0.5) * 4.2);
              p.userData.vy = -0.06; p.userData.vx = 0; p.userData.bounced = false;
              p.material.color.setHex(0xf43f5e);
            }
          }
        });
      }

      if (composerRef.current && useBloomRef.current) {
        composerRef.current.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // Update controls auto-rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 1.2;
    }
  }, [autoRotate]);

  // Build Scene geometry whenever activeScene, materials, or toggles change
  useEffect(() => {
    if (!mainGroupRef.current || !simState) return;
    const mainGroup = mainGroupRef.current;
    const particleSystemGroup = particleSystemGroupRef.current;
    const voxelGroup = voxelGroupRef.current;

    while (mainGroup.children.length > 0) mainGroup.remove(mainGroup.children[0]);
    while (particleSystemGroup.children.length > 0) particleSystemGroup.remove(particleSystemGroup.children[0]);
    while (voxelGroup.children.length > 0) voxelGroup.remove(voxelGroup.children[0]);

    rayParticlesRef.current = [];
    organMeshesRef.current = [];
    earthMeshRef.current = null;
    cloudMeshRef.current = null;
    orbitShipGroupRef.current = null;

    const tex = getProceduralTextures();
    const { m1, m2, m3, t1 } = simState;

    if (activeScene === 'habitat') {
      const ship = buildSpacecraftAssembly(false, showCutaway, m1, m2, m3, tex);
      mainGroup.add(ship);

      const advShield = simState.shieldingAdvanced || {};
      const magPowerKw = advShield.magPowerKw || 0;
      const magDeflectFrac = (advShield.magDeflectedPct || 0) / 100.0;

      // Render Dynamic 10B-Boronated Water-to-Wall Life-Support Perimeter Jacket between L2 & L3
      if (advShield.waterWallEnabled) {
        const waterJacketGeo = new THREE.CylinderGeometry(
          1.69, 1.69, 3.70, 48, 1, true,
          showCutaway ? Math.PI * 0.47 : 0,
          showCutaway ? Math.PI * 1.46 : Math.PI * 2
        );
        const waterJacketMat = new THREE.MeshPhysicalMaterial({
          color: 0x0ea5e9,
          emissive: 0x0284c7,
          emissiveIntensity: 0.42,
          transparent: true,
          opacity: 0.38,
          roughness: 0.12,
          side: THREE.DoubleSide
        });
        const waterJacket = new THREE.Mesh(waterJacketGeo, waterJacketMat);
        waterJacket.rotation.z = Math.PI / 2;
        waterJacket.position.set(-0.3, 0, 0);
        mainGroup.add(waterJacket);
      }

      // Render Whole-Spacecraft Active ReBCO Mini-Magnetosphere Deflector Shell
      if (magPowerKw > 0) {
        const magBubble = new THREE.Mesh(
          new THREE.SphereGeometry(2.55, 32, 22),
          new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: Math.min(0.24, 0.08 + magPowerKw * 0.015),
            wireframe: true,
            blending: THREE.AdditiveBlending
          })
        );
        magBubble.scale.set(2.05, 1.32, 1.32);
        magBubble.position.set(-0.45, 0, 0);
        mainGroup.add(magBubble);

        [-2.2, 1.6].forEach((tx, idx) => {
          const coilRing = new THREE.Mesh(
            new THREE.TorusGeometry(2.35, 0.04, 14, 64),
            new THREE.MeshBasicMaterial({
              color: idx === 0 ? 0xfbbf24 : 0x38bdf8,
              transparent: true,
              opacity: 0.65,
              blending: THREE.AdditiveBlending
            })
          );
          coilRing.rotation.y = Math.PI / 2;
          coilRing.position.set(tx, 0, 0);
          mainGroup.add(coilRing);
        });
      }

      if (showVoxels) {
        const voxZones = [
          { x: -2.6, y: 0.9, z: 0.6, r: 0.28, c: 0xf43f5e },
          { x: -3.5, y: 0.0, z: 0.0, r: 0.28, c: 0xfbbf24 },
          { x: -1.1, y: -0.3, z: -0.5, r: 0.24, c: 0x38bdf8 },
          { x: -0.3, y: -0.1, z: 0.15, r: 0.26, c: 0x10b981 },
          { x: 0.95, y: 0.0, z: 0.0, r: 0.34, c: 0xf59e0b }
        ];
        voxZones.forEach(v => {
          const vm = new THREE.Mesh(
            new THREE.SphereGeometry(v.r, 20, 20),
            new THREE.MeshBasicMaterial({ color: v.c, transparent: true, opacity: 0.32, wireframe: true })
          );
          vm.position.set(v.x, v.y, v.z);
          voxelGroup.add(vm);
        });
      }

      const isHighSpall = (m1.z >= 26 && t1 > 4.0) || m2.z >= 26 || m3.z >= 26;
      for (let i = 0; i < 110; i++) {
        const geo = new THREE.CylinderGeometry(0.018, 0.045, 0.55, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(-2.2 + Math.random() * 3.8, 4.6 + Math.random() * 2.8, (Math.random() - 0.5) * 2.8);
        mesh.userData = {
          vx: (Math.random() - 0.5) * 0.012,
          vy: -(0.065 + Math.random() * 0.04),
          vz: (Math.random() - 0.5) * 0.012,
          stage: 'primary',
          checkedMag: false,
          magDeflectFrac,
          isHighSpall
        };
        particleSystemGroup.add(mesh);
        rayParticlesRef.current.push(mesh);
      }
    } else if (activeScene === 'vanallen') {
      const earthMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.55, 64, 64),
        new THREE.MeshStandardMaterial({ map: tex.earthMap, roughness: 0.35, metalness: 0.15 })
      );
      mainGroup.add(earthMesh);
      earthMeshRef.current = earthMesh;

      const cloudMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.58, 48, 48),
        new THREE.MeshStandardMaterial({ map: tex.cloudMap, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      mainGroup.add(cloudMesh);
      cloudMeshRef.current = cloudMesh;

      const atmoHalo = new THREE.Mesh(
        new THREE.SphereGeometry(1.68, 48, 48),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.22, side: THREE.BackSide, blending: THREE.AdditiveBlending })
      );
      mainGroup.add(atmoHalo);

      for (let f = 0; f < 12; f++) {
        const az = (f * Math.PI * 2) / 12;
        const fieldPts = [];
        for (let lat = -Math.PI * 0.42; lat <= Math.PI * 0.42; lat += 0.08) {
          const rL = 4.4 * Math.pow(Math.cos(lat), 2);
          fieldPts.push(new THREE.Vector3(rL * Math.cos(lat) * Math.cos(az), rL * Math.sin(lat), rL * Math.cos(lat) * Math.sin(az)));
        }
        const fLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(fieldPts), new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.28 }));
        mainGroup.add(fLine);
      }

      // 4 Distinct Radiation Orbit Rings (Congested dots visualize high-dose zones clearly)
      const orbitDefs = [
        { r: 1.50, spread: 0.14, share: 0.06, color: 0x38bdf8, ringColor: 0x38bdf8, opacity: 0.25 }, // Safe LEO ISS Orbit
        { r: 2.30, spread: 0.48, share: 0.42, color: 0xf43f5e, ringColor: 0xf43f5e, opacity: 0.50 }, // Inner Proton Belt (ULTRA CONGESTED)
        { r: 3.15, spread: 0.18, share: 0.05, color: 0x10b981, ringColor: 0x10b981, opacity: 0.25 }, // Quiet Safe Slot Corridor
        { r: 4.35, spread: 0.85, share: 0.47, color: 0xf59e0b, ringColor: 0x60a5fa, opacity: 0.35 }  // Outer Electron Belt (DENSELY CONGESTED)
      ];

      orbitDefs.forEach(od => {
        const ringGeo = new THREE.RingGeometry(od.r - 0.02, od.r + 0.02, 72);
        const ringMat = new THREE.MeshBasicMaterial({ color: od.ringColor, transparent: true, opacity: od.opacity, side: THREE.DoubleSide });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        mainGroup.add(ringMesh);
      });

      const beltCount = 7200;
      const bGeo = new THREE.BufferGeometry();
      const bPos = new Float32Array(beltCount * 3);
      const bCol = new Float32Array(beltCount * 3);
      for (let i = 0; i < beltCount; i++) {
        const ratio = i / beltCount;
        let zone = orbitDefs[3];
        let acc = 0;
        for (const od of orbitDefs) {
          acc += od.share;
          if (ratio <= acc) {
            zone = od;
            break;
          }
        }
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI * 2;
        // Pack Inner & Outer belt particles thickly inside each toroidal radiation band
        const radialOffset = (Math.random() - 0.5) * zone.spread * 2.0 * (0.45 + 0.55 * Math.random());
        const rad = zone.r + radialOffset;
        bPos[i * 3] = rad * Math.cos(u);
        bPos[i * 3 + 1] = Math.sin(v) * zone.spread * 0.72 * Math.random();
        bPos[i * 3 + 2] = rad * Math.sin(u);

        const c = new THREE.Color(zone.color);
        if (zone.r > 4.0 && Math.random() < 0.55) c.setHex(0x38bdf8);
        if (zone.r > 2.0 && zone.r < 2.6 && Math.random() < 0.35) c.setHex(0xfb923c);
        bCol[i * 3] = c.r; bCol[i * 3 + 1] = c.g; bCol[i * 3 + 2] = c.b;
      }
      bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
      bGeo.setAttribute('color', new THREE.BufferAttribute(bCol, 3));
      const beltCloud = new THREE.Points(
        bGeo,
        new THREE.PointsMaterial({ size: 0.095, map: tex.glowSprite, vertexColors: true, transparent: true, opacity: 0.86, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      particleSystemGroup.add(beltCloud);

      // Curved Trans-Lunar Injection (TLI) Trajectory Arc from Earth toward Lunar Orbit
      const incRad = ((simState.inc || 28.5) * Math.PI) / 180.0;
      const curvePts = [];
      for (let a = 0; a <= Math.PI * 2; a += 0.02) {
        const rx = 1.95 + 4.8 * (1 - Math.cos(a)) * 0.5;
        const rz = 3.8 * Math.sin(a);
        const x = rx * Math.cos(a) - 1.35;
        const y = rx * Math.sin(a) * Math.sin(incRad);
        const z = rz * Math.cos(incRad);
        curvePts.push(new THREE.Vector3(x, y, z));
      }
      const orbitLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curvePts),
        new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.9, linewidth: 2 })
      );
      mainGroup.add(orbitLine);

      // Glowing 3D Moon positioned at the outer apogee curve toward which the spacecraft travels
      const moonTargetPos = curvePts[Math.floor(curvePts.length * 0.5)];
      const miniMoon = new THREE.Mesh(
        new THREE.SphereGeometry(0.56, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xcbd5e1, map: tex.moonMap, roughness: 0.9, metalness: 0.05 })
      );
      miniMoon.position.set(moonTargetPos.x - 1.15, moonTargetPos.y + 0.35, moonTargetPos.z);
      mainGroup.add(miniMoon);

      // Full Detailed Orion Spaceship cruising along the Van Allen -> Moon Trajectory Curve
      const tliSpaceship = buildSpacecraftAssembly(false, false, m1, m2, m3, tex, Boolean(simState.odaaAegisActive));
      tliSpaceship.scale.set(0.19, 0.19, 0.19);
      const satGroup = new THREE.Group();
      satGroup.add(tliSpaceship);

      // Pulsing telemetry beacon LED & shield aura on the TLI Spacecraft
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      beacon.position.set(0, 0.42, 0);
      satGroup.add(beacon);

      const satAura = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex.glowSprite,
          color: simState.odaaAegisActive ? 0x10b981 : 0x38bdf8,
          transparent: true,
          opacity: 0.72,
          blending: THREE.AdditiveBlending
        })
      );
      satAura.scale.set(1.35, 1.35, 1);
      satGroup.add(satAura);

      satGroup.userData.curvePts = curvePts;
      satGroup.userData.beacon = beacon;
      mainGroup.add(satGroup);
      orbitShipGroupRef.current = satGroup;
    } else if (activeScene === 'planetary') {
      const moonGeo = new THREE.PlaneGeometry(5.2, 6.2, 48, 48);
      const mPos = moonGeo.attributes.position;
      for (let i = 0; i < mPos.count; i++) {
        const vx = mPos.getX(i), vy = mPos.getY(i);
        const d1 = Math.sqrt((vx + 0.6) ** 2 + (vy - 0.5) ** 2);
        const crater = d1 < 1.2 ? -0.35 * Math.cos((d1 / 1.2) * Math.PI * 0.5) : 0;
        mPos.setZ(i, crater + (Math.sin(vx * 3) * Math.cos(vy * 3)) * 0.08);
      }
      moonGeo.computeVertexNormals();
      const moonTerrain = new THREE.Mesh(moonGeo, new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, metalness: 0.05 }));
      moonTerrain.rotation.x = -Math.PI / 2;
      moonTerrain.position.set(-2.9, -1.75, 0);
      mainGroup.add(moonTerrain);

      const moonBase = buildSpacecraftAssembly(true, false, m1, m2, m3, tex);
      moonBase.scale.set(0.22, 0.22, 0.22);
      moonBase.position.set(-2.9, -1.25, 0);
      mainGroup.add(moonBase);

      const marsGeo = new THREE.PlaneGeometry(5.2, 6.2, 48, 48);
      const maPos = marsGeo.attributes.position;
      for (let i = 0; i < maPos.count; i++) {
        const vx = maPos.getX(i), vy = maPos.getY(i);
        maPos.setZ(i, (Math.sin(vx * 2.2) * Math.cos(vy * 2.0)) * 0.14);
      }
      marsGeo.computeVertexNormals();
      const marsTerrain = new THREE.Mesh(marsGeo, new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.82, metalness: 0.08 }));
      marsTerrain.rotation.x = -Math.PI / 2;
      marsTerrain.position.set(2.9, -1.75, 0);
      mainGroup.add(marsTerrain);

      const marsBase = buildSpacecraftAssembly(true, false, m1, m2, m3, tex);
      marsBase.scale.set(0.22, 0.22, 0.22);
      marsBase.position.set(2.9, -1.25, 0);
      mainGroup.add(marsBase);

      const co2Dome = new THREE.Mesh(new THREE.SphereGeometry(2.55, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.12, side: THREE.DoubleSide }));
      co2Dome.position.set(2.9, -1.75, 0);
      mainGroup.add(co2Dome);

      const magCanopy = new THREE.Mesh(new THREE.SphereGeometry(2.15, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending }));
      magCanopy.position.set(2.9, -1.75, 0);
      mainGroup.add(magCanopy);

      for (let i = 0; i < 95; i++) {
        const isMoonSide = Math.random() < 0.5;
        const geo = new THREE.CylinderGeometry(0.02, 0.045, 0.48, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(isMoonSide ? -2.9 + (Math.random() - 0.5) * 4.2 : 2.9 + (Math.random() - 0.5) * 4.2, 3.8 + Math.random() * 2.2, (Math.random() - 0.5) * 4.2);
        mesh.userData = { isMoonSide, vy: -0.06, vx: 0, bounced: false };
        particleSystemGroup.add(mesh);
        rayParticlesRef.current.push(mesh);
      }
    }
  }, [activeScene, simState, showCutaway, showVoxels]);

  // Spacecraft Assembly generator
  function buildSpacecraftAssembly(isMiniature, isCutaway, m1, m2, m3, tex) {
    const ship = new THREE.Group();
    const r1 = 1.95, r2 = 1.78, r3 = 1.60;
    const habLen = 3.8;
    const isCut = (isCutaway && !isMiniature);

    const matL1 = new THREE.MeshStandardMaterial({
      color: m1.color, metalness: m1.metalness, roughness: m1.roughness,
      bumpMap: tex.hullBump, bumpScale: 0.03, side: THREE.DoubleSide
    });
    const shell1 = new THREE.Mesh(
      new THREE.CylinderGeometry(r1, r1, habLen, 48, 1, true, isCut ? Math.PI * 0.64 : 0, isCut ? Math.PI * 1.24 : Math.PI * 2),
      matL1
    );
    shell1.rotation.z = Math.PI / 2;
    shell1.position.x = -0.3;
    ship.add(shell1);

    const matL2 = new THREE.MeshPhysicalMaterial({
      color: m2.color, metalness: 0.08, roughness: 0.25,
      transmission: 0.35, transparent: true, opacity: 0.80, side: THREE.DoubleSide
    });
    const shell2 = new THREE.Mesh(
      new THREE.CylinderGeometry(r2, r2, habLen - 0.06, 48, 1, true, isCut ? Math.PI * 0.53 : 0, isCut ? Math.PI * 1.38 : Math.PI * 2),
      matL2
    );
    shell2.rotation.z = Math.PI / 2;
    shell2.position.x = -0.3;
    ship.add(shell2);

    const matL3 = new THREE.MeshStandardMaterial({
      color: m3.color, map: tex.bioHybridMap, metalness: 0.65, roughness: 0.22,
      emissive: m3.color, emissiveIntensity: 0.22, side: THREE.DoubleSide
    });
    const shell3 = new THREE.Mesh(
      new THREE.CylinderGeometry(r3, r3, habLen - 0.12, 48, 1, true, isCut ? Math.PI * 0.42 : 0, isCut ? Math.PI * 1.52 : Math.PI * 2),
      matL3
    );
    shell3.rotation.z = Math.PI / 2;
    shell3.position.x = -0.3;
    ship.add(shell3);

    [-2.2, 1.6].forEach(xp => {
      const cap = new THREE.Mesh(new THREE.CircleGeometry(r1, 48), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3, side: THREE.DoubleSide }));
      cap.position.x = xp;
      cap.rotation.y = Math.PI / 2;
      ship.add(cap);
    });

    [-2.2, -0.3, 1.6].forEach(xp => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r1 + 0.03, 0.075, 16, 48), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 }));
      ring.position.x = xp;
      ring.rotation.y = Math.PI / 2;
      ship.add(ring);
    });

    const noseCone = new THREE.Mesh(new THREE.CylinderGeometry(0.85, r1, 1.25, 48), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.65, roughness: 0.3, bumpMap: tex.hullBump, bumpScale: 0.02 }));
    noseCone.rotation.z = Math.PI / 2;
    noseCone.position.x = -2.82;
    ship.add(noseCone);

    for (let w = 0; w < 4; w++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.08), new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.5, metalness: 0.1, roughness: 0.05 }));
      const ang = (w * Math.PI) / 2 + Math.PI / 4;
      win.position.set(-2.75, Math.cos(ang) * 1.38, Math.sin(ang) * 1.38);
      win.rotation.x = ang;
      ship.add(win);
    }

    const dockTunnel = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.85, 0.55, 32), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 }));
    dockTunnel.rotation.z = Math.PI / 2;
    dockTunnel.position.x = -3.65;
    ship.add(dockTunnel);

    const dockLip = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.06, 12, 32), new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.35 }));
    dockLip.position.x = -3.92;
    dockLip.rotation.y = Math.PI / 2;
    ship.add(dockLip);

    const smCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(1.82, 1.82, 2.0, 40),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, map: tex.kaptonMap, bumpMap: tex.kaptonMap, bumpScale: 0.04, metalness: 0.85, roughness: 0.28 })
    );
    smCyl.rotation.z = Math.PI / 2;
    smCyl.position.x = 2.62;
    ship.add(smCyl);

    for (let q = 0; q < 4; q++) {
      const ang = (q * Math.PI) / 2;
      const rcsPod = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.28, 0.28), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.3 }));
      rcsPod.position.set(2.0, Math.cos(ang) * 1.92, Math.sin(ang) * 1.92);
      ship.add(rcsPod);
    }

    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 12), new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.2 }));
    boom.position.set(2.8, -2.35, 0);
    ship.add(boom);

    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.7, roughness: 0.25, side: THREE.DoubleSide }));
    dish.position.set(2.8, -3.05, 0);
    dish.rotation.z = -Math.PI / 4;
    ship.add(dish);

    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.88, 1.08, 32, 1, false), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.92, roughness: 0.22, side: THREE.DoubleSide }));
    bell.rotation.z = Math.PI / 2;
    bell.position.x = 4.14;
    ship.add(bell);

    const plume = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.06, 1.95, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.42, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    plume.rotation.z = Math.PI / 2;
    plume.position.x = 5.45;
    ship.add(plume);

    const wingAngles = [Math.PI * 0.18, -Math.PI * 0.18, Math.PI * 0.82, -Math.PI * 0.82];
    wingAngles.forEach(wAng => {
      const wingPivot = new THREE.Group();
      wingPivot.position.set(2.65, Math.cos(wAng) * 1.82, Math.sin(wAng) * 1.82);
      wingPivot.rotation.x = wAng;

      const truss = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.8, 12), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 }));
      truss.position.y = 2.4;
      wingPivot.add(truss);

      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.25, 4.4, 0.04), new THREE.MeshStandardMaterial({ map: tex.solarMap, metalness: 0.78, roughness: 0.18, emissive: 0x0a192f, emissiveIntensity: 0.25 }));
      panel.position.y = 2.65;
      wingPivot.add(panel);

      const trim = new THREE.Mesh(new THREE.BoxGeometry(1.30, 4.46, 0.02), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.25 }));
      trim.position.y = 2.65;
      wingPivot.add(trim);

      ship.add(wingPivot);
    });

    if (isMiniature) {
      ship.scale.set(0.11, 0.11, 0.11);
      return ship;
    }

    // Interior Phantom & Organs
    const deckFloor = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 2.5), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.4 }));
    deckFloor.position.set(-0.3, -0.95, 0);
    ship.add(deckFloor);

    const astro = new THREE.Group();
    astro.position.set(-0.35, -0.15, 0.15);
    const glassBodyMat = new THREE.MeshPhysicalMaterial({ color: 0x7dd3fc, transmission: 0.65, transparent: true, opacity: 0.48, roughness: 0.15, metalness: 0.05 });

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.23, 0.88, 24), glassBodyMat);
    astro.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), glassBodyMat);
    head.position.y = 0.66;
    astro.add(head);

    const organSpecs = [
      { name: 'CNS Brain', pos: [0, 0.66, 0], r: 0.11, col: 0xf59e0b },
      { name: 'Ocular Lens', pos: [-0.14, 0.68, 0], r: 0.045, col: 0xfbbf24 },
      { name: 'Cardiovascular Heart', pos: [-0.04, 0.18, 0.05], r: 0.09, col: 0xf43f5e },
      { name: 'Bone Marrow (BFO)', pos: [0.04, -0.12, 0], r: 0.10, col: 0x10b981 }
    ];
    organSpecs.forEach(o => {
      const om = new THREE.Mesh(new THREE.SphereGeometry(o.r, 16, 16), new THREE.MeshBasicMaterial({ color: o.col }));
      om.position.set(...o.pos);
      astro.add(om);
      organMeshesRef.current.push(om);
    });

    ship.add(astro);
    return ship;
  }

  const flyCamera = (preset) => {
    setActiveCamPreset(preset);
    let endPos = new THREE.Vector3(6.8, 3.8, 9.2);
    let endTarget = new THREE.Vector3(0, 0, 0);

    if (preset === 'exterior') {
      endPos.set(6.8, 3.8, 9.2);
      endTarget.set(0.2, 0, 0);
    } else if (preset === 'cutaway') {
      setShowCutaway(true);
      endPos.set(-0.6, 1.4, 4.4);
      endTarget.set(-0.4, -0.1, 0.1);
    } else if (preset === 'detectors') {
      endPos.set(-2.4, 3.6, 4.8);
      endTarget.set(-0.5, 0.8, 0);
    } else if (preset === 'overview') {
      endPos.set(0.0, 6.2, 13.5);
      endTarget.set(0, 0, 0);
    }

    if (cameraRef.current && controlsRef.current) {
      camAnimRef.current = {
        t: 0,
        startPos: cameraRef.current.position.clone(),
        endPos,
        startTarget: controlsRef.current.target.clone(),
        endTarget
      };
    }
  };

  return (
    <section className={`studio-3d-card ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      <div className="canvas-wrap" ref={containerRef}>
        <canvas ref={canvasRef} id="threeCanvas" />

        {/* Top-Left Floating HUD: Scene Switcher */}
        <div className="canvas-hud-top-left" role="tablist" aria-label="3D Simulation Scenes">
          <button
            className={`btn-scene ${activeScene === 'habitat' ? 'active' : ''}`}
            onClick={() => setActiveScene('habitat')}
          >
            <Rocket size={13} strokeWidth={1.75} />
            <span>Scene 1: Orion &amp; Graded-Z Cutaway</span>
          </button>
          <button
            className={`btn-scene ${activeScene === 'vanallen' ? 'active' : ''}`}
            onClick={() => setActiveScene('vanallen')}
          >
            <Globe size={13} strokeWidth={1.75} />
            <span>Scene 2: Earth &amp; Van Allen Belts</span>
          </button>
          <button
            className={`btn-scene ${activeScene === 'planetary' ? 'active' : ''}`}
            onClick={() => setActiveScene('planetary')}
          >
            <Moon size={13} strokeWidth={1.75} />
            <span>Scene 3: Moon Albedo vs. Mars Canopy</span>
          </button>
        </div>

        {/* Top-Right Floating HUD: Viewport Render & Inspection Controls */}
        <div className="canvas-hud-top-right">
          <button
            className={`hud-btn ${showCutaway ? 'active' : ''}`}
            onClick={() => setShowCutaway(!showCutaway)}
            title="Toggle Graded-Z hull cutaway slice"
          >
            <Scissors size={13} strokeWidth={1.75} />
            <span>Cutaway</span>
          </button>
          <button
            className={`hud-btn ${showVoxels ? 'active' : ''}`}
            onClick={() => setShowVoxels(!showVoxels)}
            title="Toggle 3D interior dose voxels"
          >
            <Box size={13} strokeWidth={1.75} />
            <span>Voxels</span>
          </button>
          <button
            className={`hud-btn ${useBloom ? 'active' : ''}`}
            onClick={() => setUseBloom(!useBloom)}
            title="Toggle UnrealBloom shader pass"
          >
            <Sparkles size={13} strokeWidth={1.75} />
            <span>Bloom</span>
          </button>
          <button
            className={`hud-btn ${autoRotate ? 'active' : ''}`}
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle orbital auto-rotation"
          >
            <RefreshCw size={13} strokeWidth={1.75} />
            <span>Auto-Orbit</span>
          </button>
          <button
            className="hud-btn"
            onClick={() => flyCamera('exterior')}
            title="Reset camera framing"
          >
            <Crosshair size={13} strokeWidth={1.75} />
            <span>Reset</span>
          </button>
          <button
            className={`hud-btn ${isFullscreen ? 'active' : ''}`}
            onClick={() => setIsFullscreen(!isFullscreen)}
            title="Toggle Fullscreen 3D Viewport"
          >
            {isFullscreen ? <Minimize2 size={13} strokeWidth={1.75} /> : <Maximize2 size={13} strokeWidth={1.75} />}
            <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>
        </div>

        {/* Bottom-Left Floating HUD: Camera Angles + Interaction Hint */}
        <div className="canvas-hud-bottom-left">
          <div className="canvas-cam-dock">
            <button
              className={`cam-pill ${activeCamPreset === 'exterior' ? 'active' : ''}`}
              onClick={() => flyCamera('exterior')}
            >
              <Rocket size={12} strokeWidth={1.75} />
              <span>Exterior Hull</span>
            </button>
            <button
              className={`cam-pill ${activeCamPreset === 'cutaway' ? 'active' : ''}`}
              onClick={() => flyCamera('cutaway')}
            >
              <Scissors size={12} strokeWidth={1.75} />
              <span>Graded-Z Cutaway</span>
            </button>
            <button
              className={`cam-pill ${activeCamPreset === 'detectors' ? 'active' : ''}`}
              onClick={() => flyCamera('detectors')}
            >
              <Radio size={12} strokeWidth={1.75} />
              <span>5-Detector Array</span>
            </button>
            <button
              className={`cam-pill ${activeCamPreset === 'overview' ? 'active' : ''}`}
              onClick={() => flyCamera('overview')}
            >
              <Maximize2 size={12} strokeWidth={1.75} />
              <span>Wide Overview</span>
            </button>
          </div>
          <div className="canvas-mouse-hint">
            <MousePointer2 size={11} strokeWidth={1.75} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />
            <strong>Left-Drag:</strong> 360° Orbit &bull; <strong>Wheel / Pinch:</strong> Zoom &bull; <strong>Right-Drag:</strong> Pan
          </div>
        </div>

        {/* Bottom-Right Floating HUD: Collapsible Ray-Tracing & Sensor Legend Popover */}
        <div className="canvas-hud-bottom-right">
          {showLegend && (
            <div className="legend-popover">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="legend-popover-title">3D RAY-TRACING &amp; SENSOR LEGEND</span>
                <button
                  className="hud-btn"
                  style={{ padding: '2px 5px' }}
                  onClick={() => setShowLegend(false)}
                  aria-label="Close legend"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="hud-legend-grid">
                <div className="hud-legend-item">
                  <span className="dot-swatch" style={{ background: '#f43f5e' }} />
                  <span>Relativistic ⁵⁶Fe HZE &amp; GCR Protons (p⁺)</span>
                </div>
                <div className="hud-legend-item">
                  <span className="dot-swatch" style={{ background: '#fbbf24' }} />
                  <span>Secondary Spallation Neutrons (n⁰)</span>
                </div>
                <div className="hud-legend-item">
                  <span className="dot-swatch" style={{ background: '#ec4899' }} />
                  <span>Bremsstrahlung X-Ray Shower (γ)</span>
                </div>
                <div className="hud-legend-item">
                  <span className="dot-swatch" style={{ background: '#10b981' }} />
                  <span>¹⁵⁷Gd-MXene &amp; Melanin Scintillation</span>
                </div>
                <div className="hud-legend-item">
                  <span className="dot-swatch" style={{ background: '#38bdf8' }} />
                  <span>5 Hull/Interior Detector Pods &amp; 3D Cabin Voxels</span>
                </div>
              </div>
            </div>
          )}
          <div className="canvas-cam-dock">
            <button
              className={`hud-btn ${showLegend ? 'active' : ''}`}
              onClick={() => setShowLegend(!showLegend)}
            >
              <Layers size={13} strokeWidth={1.75} />
              <span>{showLegend ? 'Hide Legend' : 'Ray Legend'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
