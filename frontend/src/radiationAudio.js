/**
 * GadaSpace Real-Time Cosmic Radiation & Spallation Sonification Engine
 * Uses pure browser Web Audio API (zero external audio dependencies).
 * Muted by default; activates cleanly on explicit user gesture so judges
 * can audibly hear secondary neutron cascades silence under Shield C.
 */
class RadiationSonifier {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.droneOsc = null;
    this.droneGain = null;
    this.timerId = null;
    this.active = false;
    this.totalRate = 0.6;
    this.secNeutron = 0.04;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
      const compressor = this.ctx.createDynamicsCompressor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.14;
      compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.compressor = compressor;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return true;
  }

  start(totalRate = 0.6, secNeutron = 0.04) {
    if (!this.initContext()) return false;
    this.updateRates(totalRate, secNeutron);
    if (this.active) return true;
    this.active = true;

    // Subtle deep-space obsidian harmonic drone (55 Hz warm sine)
    try {
      this.droneOsc = this.ctx.createOscillator();
      this.droneGain = this.ctx.createGain();
      this.droneOsc.type = 'sine';
      this.droneOsc.frequency.value = 55;
      this.droneGain.gain.value = 0.08;
      this.droneOsc.connect(this.droneGain);
      this.droneGain.connect(this.compressor);
      this.droneOsc.start();
    } catch {
      // Ignore oscillator initialization issues on locked audio hardware
    }

    this.scheduleNextTick();
    return true;
  }

  scheduleNextTick() {
    if (!this.active) return;
    // Higher totalRate / secNeutron compresses interval into urgent Geiger bursts
    const dangerFactor = Math.min(12.0, this.totalRate + this.secNeutron * 3.5);
    const meanIntervalMs = Math.max(48, 720 / Math.max(0.45, dangerFactor));
    const jitter = (0.35 + Math.random() * 1.3) * meanIntervalMs;

    this.timerId = setTimeout(() => {
      if (!this.active) return;
      this.triggerGeigerPulse();
      this.scheduleNextTick();
    }, jitter);
  }

  triggerGeigerPulse() {
    if (!this.ctx || !this.active) return;
    const now = this.ctx.currentTime;
    const isHighNeutron = this.secNeutron > 0.25 || this.totalRate > 2.2;

    if (isHighNeutron) {
      // Sharp spallation neutron Geiger-Muller click + secondary ionization snap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const baseFreq = 1650 + Math.random() * 1400;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.024);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(now);
      osc.stop(now + 0.032);
    } else {
      // Calm nominal bio-hybrid telemetry: delicate crystalline harmonic ping
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const notes = [528, 660, 792, 880];
      osc.frequency.setValueAtTime(notes[Math.floor(Math.random() * notes.length)], now);

      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.16);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(now);
      osc.stop(now + 0.18);
    }

    // Modulate underlying cosmic drone tension subtly with dose rate
    if (this.droneOsc && this.droneGain) {
      const targetFreq = isHighNeutron ? 82 : 55;
      this.droneOsc.frequency.setTargetAtTime(targetFreq, now, 0.25);
    }
  }

  updateRates(totalRate, secNeutron) {
    this.totalRate = Number.isFinite(totalRate) ? totalRate : 0.6;
    this.secNeutron = Number.isFinite(secNeutron) ? secNeutron : 0.04;
  }

  stop() {
    this.active = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.droneOsc) {
      try {
        this.droneOsc.stop();
        this.droneOsc.disconnect();
      } catch {
        // Ignore already-stopped oscillator
      }
      this.droneOsc = null;
    }
    if (this.droneGain) {
      try {
        this.droneGain.disconnect();
      } catch {
        // Ignore disconnect error
      }
      this.droneGain = null;
    }
  }

  // Astronaut Smart EVA Suit Audio Cues
  triggerSuitWarningChime(fluxMsvHr = 5.0) {
    if (!this.initContext()) return;
    const now = this.ctx.currentTime;
    try {
      // Dual-tone urgent aerospace alert beep
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = fluxMsvHr >= 12.0 ? 1174 : 880; // D6 or A5
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.setValueAtTime(baseFreq * 1.5, now + 0.08);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 2, now);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.compressor);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.24);
      osc2.stop(now + 0.24);
    } catch {
      // Audio safety fallback
    }
  }

  triggerSuitShieldEngagedSound() {
    if (!this.initContext()) return;
    const now = this.ctx.currentTime;
    try {
      // Resonant high-tech ReBCO magnetic forcefield power-up surge
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.28);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.45);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Audio safety fallback
    }
  }

  triggerSuitGeigerClick(fluxMsvHr = 1.0) {
    if (!this.initContext()) return;
    const now = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = fluxMsvHr >= 5.0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(1400 + Math.random() * 800, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.018);

      gain.gain.setValueAtTime(Math.min(0.3, 0.08 + fluxMsvHr * 0.01), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(now);
      osc.stop(now + 0.024);
    } catch {
      // Audio safety fallback
    }
  }
}

export const radiationSonifier = new RadiationSonifier();
