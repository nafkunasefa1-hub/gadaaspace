import * as THREE from 'three';

const TEX_CACHE = {};

export function getProceduralTextures() {
  if (TEX_CACHE.initialized) return TEX_CACHE;

  // 1. Solar Array Photovoltaic Cell Grid Texture
  const cSolar = document.createElement('canvas');
  cSolar.width = 512; cSolar.height = 512;
  const ctxS = cSolar.getContext('2d');
  ctxS.fillStyle = '#07152e';
  ctxS.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) {
    for (let x = 0; x < 512; x += 64) {
      const grad = ctxS.createLinearGradient(x, y, x + 60, y + 28);
      grad.addColorStop(0, '#0c234a');
      grad.addColorStop(0.5, '#153875');
      grad.addColorStop(1, '#091a38');
      ctxS.fillStyle = grad;
      ctxS.fillRect(x + 2, y + 2, 60, 28);
      ctxS.strokeStyle = 'rgba(212, 175, 55, 0.55)';
      ctxS.lineWidth = 1;
      ctxS.strokeRect(x + 2, y + 2, 60, 28);
    }
  }
  TEX_CACHE.solarMap = new THREE.CanvasTexture(cSolar);
  TEX_CACHE.solarMap.wrapS = TEX_CACHE.solarMap.wrapT = THREE.RepeatWrapping;
  TEX_CACHE.solarMap.repeat.set(3, 1);

  // 2. Crinkled Gold Kapton MLI Foil Normal/Bump & Albedo Map
  const cFoil = document.createElement('canvas');
  cFoil.width = 256; cFoil.height = 256;
  const ctxF = cFoil.getContext('2d');
  ctxF.fillStyle = '#d97706';
  ctxF.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 450; i++) {
    ctxF.fillStyle = i % 2 === 0 ? 'rgba(253, 224, 71, 0.35)' : 'rgba(120, 53, 15, 0.35)';
    ctxF.beginPath();
    const x = Math.random() * 256, y = Math.random() * 256;
    ctxF.moveTo(x, y);
    ctxF.lineTo(x + (Math.random() - 0.5) * 28, y + (Math.random() - 0.5) * 28);
    ctxF.lineTo(x + (Math.random() - 0.5) * 28, y + (Math.random() - 0.5) * 28);
    ctxF.closePath();
    ctxF.fill();
  }
  TEX_CACHE.kaptonMap = new THREE.CanvasTexture(cFoil);
  TEX_CACHE.kaptonMap.wrapS = TEX_CACHE.kaptonMap.wrapT = THREE.RepeatWrapping;
  TEX_CACHE.kaptonMap.repeat.set(4, 2);

  // 3. Spacecraft Metallic Panel Lines & Micro-Rivets Bump Map
  const cHull = document.createElement('canvas');
  cHull.width = 512; cHull.height = 512;
  const ctxH = cHull.getContext('2d');
  ctxH.fillStyle = '#b0b8c4';
  ctxH.fillRect(0, 0, 512, 512);
  ctxH.strokeStyle = '#475569';
  ctxH.lineWidth = 3;
  for (let y = 0; y < 512; y += 64) {
    ctxH.beginPath(); ctxH.moveTo(0, y); ctxH.lineTo(512, y); ctxH.stroke();
    for (let x = 0; x < 512; x += 64) {
      ctxH.strokeRect(x + 4, y + 4, 56, 56);
      ctxH.fillStyle = '#334155';
      ctxH.fillRect(x + 8, y + 8, 3, 3);
      ctxH.fillRect(x + 52, y + 8, 3, 3);
    }
  }
  TEX_CACHE.hullBump = new THREE.CanvasTexture(cHull);
  TEX_CACHE.hullBump.wrapS = TEX_CACHE.hullBump.wrapT = THREE.RepeatWrapping;
  TEX_CACHE.hullBump.repeat.set(3, 2);

  // 4. 157Gd-MXene + Bioluminescent Fungal Melanin Nanostructure Texture
  const cBio = document.createElement('canvas');
  cBio.width = 256; cBio.height = 256;
  const ctxB = cBio.getContext('2d');
  ctxB.fillStyle = '#2e1065';
  ctxB.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 180; i++) {
    const x = Math.random() * 256, y = Math.random() * 256, r = 2 + Math.random() * 7;
    const g = ctxB.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, i % 3 === 0 ? '#00f5d4' : '#e879f9');
    g.addColorStop(1, 'rgba(46, 16, 101, 0)');
    ctxB.fillStyle = g;
    ctxB.beginPath(); ctxB.arc(x, y, r, 0, Math.PI * 2); ctxB.fill();
  }
  TEX_CACHE.bioHybridMap = new THREE.CanvasTexture(cBio);
  TEX_CACHE.bioHybridMap.wrapS = TEX_CACHE.bioHybridMap.wrapT = THREE.RepeatWrapping;

  // 5. Earth Texture
  const cEarth = document.createElement('canvas');
  cEarth.width = 1024; cEarth.height = 512;
  const ctxE = cEarth.getContext('2d');
  const oceanGrad = ctxE.createLinearGradient(0, 0, 0, 512);
  oceanGrad.addColorStop(0, '#0c2d5e');
  oceanGrad.addColorStop(0.5, '#073b7a');
  oceanGrad.addColorStop(1, '#0a254d');
  ctxE.fillStyle = oceanGrad;
  ctxE.fillRect(0, 0, 1024, 512);

  ctxE.fillStyle = '#f1f5f9';
  ctxE.fillRect(0, 0, 1024, 28);
  ctxE.fillRect(0, 482, 1024, 30);

  const continents = [
    { x: 210, y: 140, rx: 95, ry: 75, c: '#2d6a4f' },
    { x: 300, y: 320, rx: 60, ry: 95, c: '#1b4332' },
    { x: 540, y: 240, rx: 75, ry: 95, c: '#b08968' },
    { x: 530, y: 120, rx: 70, ry: 45, c: '#40916c' },
    { x: 710, y: 145, rx: 135, ry: 78, c: '#52796f' },
    { x: 830, y: 355, rx: 55, ry: 42, c: '#bc6c25' }
  ];
  continents.forEach(ct => {
    for (let k = 0; k < 28; k++) {
      const ox = ct.x + (Math.random() - 0.5) * ct.rx;
      const oy = ct.y + (Math.random() - 0.5) * ct.ry;
      const orx = (0.25 + Math.random() * 0.55) * ct.rx;
      const ory = (0.25 + Math.random() * 0.55) * ct.ry;
      ctxE.fillStyle = k % 4 === 0 ? '#7f5539' : ct.c;
      ctxE.beginPath();
      ctxE.ellipse(ox, oy, orx, ory, Math.random() * Math.PI, 0, Math.PI * 2);
      ctxE.fill();
      ctxE.fillStyle = 'rgba(255, 214, 102, 0.75)';
      ctxE.fillRect(ox + (Math.random() - 0.5) * 20, oy + (Math.random() - 0.5) * 20, 2.5, 2.5);
    }
  });
  TEX_CACHE.earthMap = new THREE.CanvasTexture(cEarth);

  // Cloud Layer Texture
  const cCloud = document.createElement('canvas');
  cCloud.width = 512; cCloud.height = 256;
  const ctxC = cCloud.getContext('2d');
  for (let i = 0; i < 260; i++) {
    const x = Math.random() * 512, y = Math.random() * 256, r = 10 + Math.random() * 32;
    const g = ctxC.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctxC.fillStyle = g;
    ctxC.beginPath(); ctxC.arc(x, y, r, 0, Math.PI * 2); ctxC.fill();
  }
  TEX_CACHE.cloudMap = new THREE.CanvasTexture(cCloud);

  // 6. Glowing Sprite Texture
  const cGlow = document.createElement('canvas');
  cGlow.width = 128; cGlow.height = 128;
  const ctxG = cGlow.getContext('2d');
  const gRad = ctxG.createRadialGradient(64, 64, 0, 64, 64, 64);
  gRad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gRad.addColorStop(0.25, 'rgba(56, 189, 248, 0.85)');
  gRad.addColorStop(0.6, 'rgba(0, 245, 212, 0.25)');
  gRad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctxG.fillStyle = gRad;
  ctxG.fillRect(0, 0, 128, 128);
  TEX_CACHE.glowSprite = new THREE.CanvasTexture(cGlow);

  TEX_CACHE.initialized = true;
  return TEX_CACHE;
}
