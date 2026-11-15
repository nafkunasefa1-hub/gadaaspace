import React, { useEffect, useRef } from 'react';

/**
 * Interactive 60fps HTML5 Canvas Milky Way Starfield, Parallax Nebula,
 * Shooting Stars, and Custom Gold Ring Cursor with Trailing Stardust Particles.
 */
export default function CosmicCanvas({ enabled = true }) {
  const canvasRef = useRef(null);
  const cursorRingRef = useRef(null);
  const cursorDotRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });

    const isFinePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Pointer state for parallax & custom cursor
    const pointer = {
      x: width * 0.5,
      y: height * 0.5,
      targetX: width * 0.5,
      targetY: height * 0.5,
      ringX: width * 0.5,
      ringY: height * 0.5,
      active: false,
      hovering: false,
      down: false
    };

    // Pre-generate Milky Way nebula lobes (pre-rendered offscreen for 60fps)
    const nebulaCanvas = document.createElement('canvas');
    nebulaCanvas.width = 1200;
    nebulaCanvas.height = 800;
    const nCtx = nebulaCanvas.getContext('2d');
    const lobes = [
      { x: 260, y: 520, r: 320, color: 'rgba(11, 25, 44, 0.72)' },
      { x: 520, y: 400, r: 360, color: 'rgba(56, 189, 248, 0.09)' },
      { x: 680, y: 310, r: 300, color: 'rgba(212, 175, 55, 0.08)' },
      { x: 880, y: 220, r: 340, color: 'rgba(56, 189, 248, 0.07)' },
      { x: 430, y: 450, r: 220, color: 'rgba(212, 175, 55, 0.05)' },
      { x: 960, y: 180, r: 240, color: 'rgba(14, 165, 233, 0.06)' }
    ];
    nCtx.clearRect(0, 0, 1200, 800);
    for (const l of lobes) {
      const grad = nCtx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      grad.addColorStop(0, l.color);
      grad.addColorStop(0.55, l.color.replace(/[\d.]+\)$/, '0.025)'));
      grad.addColorStop(1, 'rgba(3, 7, 18, 0)');
      nCtx.fillStyle = grad;
      nCtx.beginPath();
      nCtx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
      nCtx.fill();
    }

    // Starfield (~1150 stars across 3 parallax depths)
    const STAR_COUNT = 1150;
    const starPalette = [
      '#ffffff',
      '#f8fafc',
      '#bae6fd', // O/B nebula cyan star
      '#38BDF8', // Cyan highlight
      '#fef3c7', // Warm star
      '#D4AF37'  // Gadaa gold star
    ];
    const stars = Array.from({ length: STAR_COUNT }, () => {
      const bandBias = Math.random() < 0.45;
      let bx = Math.random();
      let by = Math.random();
      if (bandBias) {
        // Cluster slightly along the diagonal Milky Way band (bottom-left to top-right)
        const t = Math.random();
        const spread = (Math.random() - 0.5) * 0.36;
        bx = Math.min(1.1, Math.max(-0.1, t + spread * 0.35));
        by = Math.min(1.1, Math.max(-0.1, (1 - t) + spread));
      }
      const depth = 0.2 + Math.random() * 1.1; // Parallax layer
      return {
        nx: bx,
        ny: by,
        depth,
        radius: (0.45 + Math.random() * 1.55) * (depth > 0.9 ? 1.15 : 0.85),
        alpha: 0.25 + Math.random() * 0.72,
        twinkleSpeed: 0.8 + Math.random() * 2.6,
        twinklePhase: Math.random() * Math.PI * 2,
        color: starPalette[Math.floor(Math.random() * starPalette.length)],
        driftX: (Math.random() - 0.5) * 0.000018 * depth,
        driftY: -0.00001 * depth
      };
    });

    // Subtle glowing gold/cyan cosmic dust motes
    const DUST_COUNT = 85;
    const dust = Array.from({ length: DUST_COUNT }, () => ({
      nx: Math.random(),
      ny: Math.random(),
      depth: 0.4 + Math.random() * 0.8,
      r: 1.4 + Math.random() * 2.6,
      vx: (Math.random() - 0.3) * 0.00008,
      vy: (Math.random() - 0.6) * 0.00006,
      isGold: Math.random() < 0.55,
      phase: Math.random() * Math.PI * 2
    }));

    // Shooting stars pool
    const shootingStars = [];
    let nextShootTime = performance.now() + 1400;

    const spawnShootingStar = () => {
      const startX = width * (0.25 + Math.random() * 0.7);
      const startY = height * (0.04 + Math.random() * 0.35);
      const angle = (Math.PI * 0.68) + (Math.random() - 0.5) * 0.28; // Elegant downward-left streak
      const speed = 13 + Math.random() * 9;
      shootingStars.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 130 + Math.random() * 110,
        life: 1.0,
        decay: 0.018 + Math.random() * 0.012,
        isGold: Math.random() < 0.55
      });
    };

    // Custom cursor stardust trail pool
    const trailParticles = [];
    const spawnTrailParticle = (x, y, burst = false) => {
      const count = burst ? 8 : 1;
      for (let i = 0; i < count; i++) {
        trailParticles.push({
          x: x + (Math.random() - 0.5) * (burst ? 12 : 4),
          y: y + (Math.random() - 0.5) * (burst ? 12 : 4),
          vx: (Math.random() - 0.5) * (burst ? 2.4 : 0.75),
          vy: (Math.random() - 0.5) * (burst ? 2.4 : 0.75) - 0.25,
          size: (burst ? 2.2 : 1.4) + Math.random() * 1.6,
          life: 1.0,
          decay: burst ? 0.025 : 0.032,
          color: Math.random() < 0.68 ? '#D4AF37' : '#38BDF8'
        });
      }
      if (trailParticles.length > 90) {
        trailParticles.splice(0, trailParticles.length - 90);
      }
    };

    const onMouseMove = (e) => {
      pointer.targetX = e.clientX;
      pointer.targetY = e.clientY;
      pointer.active = true;

      if (isFinePointer && Math.random() < 0.72) {
        spawnTrailParticle(e.clientX, e.clientY, false);
      }

      // Detect hover over interactive buttons/links/cards
      const target = e.target;
      const interactive = target && target.closest && target.closest('a, button, input, select, [role="button"], .interactive-card');
      pointer.hovering = Boolean(interactive);
    };

    const onMouseDown = (e) => {
      pointer.down = true;
      if (isFinePointer) spawnTrailParticle(e.clientX, e.clientY, true);
    };

    const onMouseUp = () => {
      pointer.down = false;
    };

    const onMouseLeave = () => {
      pointer.active = false;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    let rafId;
    let lastTime = performance.now();

    const render = (now) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      const frameScale = dt * 60;
      lastTime = now;
      const t = now * 0.001;

      // Smooth pointer interpolation
      pointer.x += (pointer.targetX - pointer.x) * Math.min(1, 0.06 * frameScale);
      pointer.y += (pointer.targetY - pointer.y) * Math.min(1, 0.06 * frameScale);
      pointer.ringX += (pointer.targetX - pointer.ringX) * Math.min(1, 0.18 * frameScale);
      pointer.ringY += (pointer.targetY - pointer.ringY) * Math.min(1, 0.18 * frameScale);

      const offsetX = ((pointer.x / width) - 0.5) * -46;
      const offsetY = ((pointer.y / height) - 0.5) * -36;

      // 1. Deep Obsidian to Cosmic Blue sky gradient
      const bgGrad = ctx.createRadialGradient(
        width * 0.65 + offsetX * 0.2,
        height * 0.22 + offsetY * 0.2,
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.95
      );
      bgGrad.addColorStop(0, '#0B192C');
      bgGrad.addColorStop(0.45, '#060E1B');
      bgGrad.addColorStop(1, '#030712');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Slow-panning Milky Way Nebula Texture with subtle parallax
      const panX = Math.sin(t * 0.05) * 28 + offsetX * 0.35;
      const panY = Math.cos(t * 0.04) * 18 + offsetY * 0.35;
      ctx.save();
      ctx.globalAlpha = 0.88;
      ctx.drawImage(nebulaCanvas, panX - width * 0.08, panY - height * 0.08, width * 1.18, height * 1.18);
      ctx.restore();

      // 3. Multi-depth twinkling Starfield
      for (let i = 0; i < STAR_COUNT; i++) {
        const s = stars[i];
        s.nx = (s.nx + s.driftX * frameScale + 1.2) % 1.2;
        s.ny = (s.ny + s.driftY * frameScale + 1.2) % 1.2;
        const sx = (s.nx - 0.1) * width + offsetX * s.depth;
        const sy = (s.ny - 0.1) * height + offsetY * s.depth;

        if (sx < -4 || sx > width + 4 || sy < -4 || sy > height + 4) continue;

        const twinkle = 0.58 + 0.42 * Math.sin(t * s.twinkleSpeed + s.twinklePhase);
        ctx.globalAlpha = s.alpha * twinkle;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(sx, sy, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 4. Subtle cyan & gold Milky Way dust motes
      for (let i = 0; i < DUST_COUNT; i++) {
        const d = dust[i];
        d.nx = (d.nx + d.vx * frameScale + 1) % 1;
        d.ny = (d.ny + d.vy * frameScale + 1) % 1;
        const dx = d.nx * width + offsetX * (d.depth * 1.25);
        const dy = d.ny * height + offsetY * (d.depth * 1.25);
        const pulse = 0.18 + 0.14 * Math.sin(t * 1.3 + d.phase);
        ctx.fillStyle = d.isGold
          ? `rgba(212, 175, 55, ${pulse})`
          : `rgba(56, 189, 248, ${pulse})`;
        ctx.beginPath();
        ctx.arc(dx, dy, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Shooting Stars with Glowing Particle Trails
      if (now >= nextShootTime) {
        spawnShootingStar();
        nextShootTime = now + 2600 + Math.random() * 3400;
      }
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const st = shootingStars[i];
        st.x += st.vx * frameScale;
        st.y += st.vy * frameScale;
        st.life -= st.decay * frameScale;
        if (st.life <= 0) {
          shootingStars.splice(i, 1);
          continue;
        }
        const tailX = st.x - (st.vx / 14) * st.length * st.life;
        const tailY = st.y - (st.vy / 14) * st.length * st.life;

        const grad = ctx.createLinearGradient(st.x, st.y, tailX, tailY);
        const headColor = st.isGold ? `rgba(254, 243, 199, ${st.life})` : `rgba(224, 242, 254, ${st.life})`;
        const midColor = st.isGold ? `rgba(212, 175, 55, ${st.life * 0.65})` : `rgba(56, 189, 248, ${st.life * 0.65})`;
        grad.addColorStop(0, headColor);
        grad.addColorStop(0.35, midColor);
        grad.addColorStop(1, 'rgba(3, 7, 18, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(st.x, st.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // Luminous spark head
        ctx.fillStyle = headColor;
        ctx.beginPath();
        ctx.arc(st.x, st.y, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Custom Cursor Stardust Particle Trail
      for (let i = trailParticles.length - 1; i >= 0; i--) {
        const p = trailParticles[i];
        p.x += p.vx * frameScale;
        p.y += p.vy * frameScale;
        p.life -= p.decay * frameScale;
        if (p.life <= 0) {
          trailParticles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life * 0.85;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Update DOM Custom Gold Ring Cursor at 60fps via GPU transform
      if (isFinePointer && cursorRingRef.current && cursorDotRef.current) {
        const ringEl = cursorRingRef.current;
        const dotEl = cursorDotRef.current;
        if (pointer.active) {
          ringEl.style.opacity = '1';
          dotEl.style.opacity = '1';
          const scale = pointer.down ? 0.8 : pointer.hovering ? 1.55 : 1;
          ringEl.style.transform = `translate3d(${pointer.ringX}px, ${pointer.ringY}px, 0) translate(-50%, -50%) scale(${scale})`;
          dotEl.style.transform = `translate3d(${pointer.targetX}px, ${pointer.targetY}px, 0) translate(-50%, -50%) scale(${pointer.hovering ? 0.5 : 1})`;
          ringEl.dataset.hover = pointer.hovering ? 'true' : 'false';
        } else {
          ringEl.style.opacity = '0';
          dotEl.style.opacity = '0';
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <canvas ref={canvasRef} className="cosmic-canvas" aria-hidden="true" />
      <div ref={cursorRingRef} className="cosmic-cursor-ring" aria-hidden="true" />
      <div ref={cursorDotRef} className="cosmic-cursor-dot" aria-hidden="true" />
    </>
  );
}
