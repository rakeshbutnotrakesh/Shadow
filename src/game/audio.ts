import { AreaId, EnemyType } from './types';

export type MusicContext = 'intro' | 'menu' | AreaId;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  private masterVol = 0.75;
  private sfxVol = 0.85;
  private ambienceVol = 0.65;
  private initialized = false;
  private currentArea: AreaId = 'forest';
  private musicContext: MusicContext = 'menu';
  private musicTimer: number | null = null;
  private musicStep = 0;
  private musicPlaying = false;
  private unlockAttached = false;
  private detachUnlock: (() => void) | null = null;
  private onUnlockedCb: (() => void) | null = null;
  private lastHitAt = 0;
  private lastDeathAt = 0;
  private lastGrowlAt = 0;
  private lastFootstepAt = 0;

  private cleanupAfterStop(osc: AudioScheduledSourceNode, ...nodes: AudioNode[]): void {
    osc.onended = () => {
      try {
        osc.disconnect();
        for (const n of nodes) n.disconnect();
      } catch {
        // Ignore already-disconnected nodes
      }
    };
  }

  public setOnUnlocked(cb: () => void): void {
    this.onUnlockedCb = cb;
  }

  public isRunning(): boolean {
    return this.ctx?.state === 'running';
  }

  public init(): void {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume().then(() => this.handleAudioRunning());
      }
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.ambienceGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.masterGain.gain.value = this.masterVol;
      this.sfxGain.gain.value = this.sfxVol;
      this.ambienceGain.gain.value = this.ambienceVol;
      this.musicGain.gain.value = this.ambienceVol * 0.82;

      this.sfxGain.connect(this.masterGain);
      this.ambienceGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.setupAmbience();
      this.initialized = true;
      this.setAreaAmbience(this.currentArea);

      this.ctx.onstatechange = () => {
        if (this.ctx?.state === 'running') {
          this.handleAudioRunning();
        }
      };

      this.attachAutoUnlock();
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().then(() => this.handleAudioRunning());
      } else if (this.ctx.state === 'running') {
        this.handleAudioRunning();
      }
    } catch {
      // Ignore audio errors if blocked
    }
  }

  private attachAutoUnlock(): void {
    if (this.unlockAttached) return;
    this.unlockAttached = true;

    const unlock = () => {
      if (!this.ctx) {
        this.init();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume().then(() => {
          this.handleAudioRunning();
        });
      } else if (this.ctx?.state === 'running') {
        this.handleAudioRunning();
      }
    };

    window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
    window.addEventListener('touchstart', unlock, { capture: true, passive: true });
    window.addEventListener('keydown', unlock, { capture: true, passive: true });
    this.detachUnlock = () => {
      window.removeEventListener('pointerdown', unlock, { capture: true });
      window.removeEventListener('touchstart', unlock, { capture: true });
      window.removeEventListener('keydown', unlock, { capture: true });
      this.unlockAttached = false;
      this.detachUnlock = null;
    };
  }

  private handleAudioRunning(): void {
    if (!this.ctx || this.ctx.state !== 'running') return;
    this.detachUnlock?.();
    this.onUnlockedCb?.();
  }

  public setVolumes(master: number, sfx: number, ambience: number): void {
    this.masterVol = master;
    this.sfxVol = sfx;
    this.ambienceVol = ambience;
    if (!this.ctx || !this.masterGain || !this.sfxGain || !this.ambienceGain || !this.musicGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(master, now, 0.05);
    this.sfxGain.gain.setTargetAtTime(sfx, now, 0.05);
    this.ambienceGain.gain.setTargetAtTime(ambience, now, 0.05);
    this.musicGain.gain.setTargetAtTime(ambience * 0.82, now, 0.05);
  }

  private setupAmbience(): void {
    if (!this.ctx || !this.ambienceGain) return;

    // 1. Dark tanpura/temple horror drone (C#2 + G#2 detuned)
    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.value = 180;

    const droneGain = this.ctx.createGain();
    droneGain.gain.value = 0.16;

    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sawtooth';
    this.droneOsc1.frequency.value = 69.3; // C#2

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'triangle';
    this.droneOsc2.frequency.value = 103.83; // G#2

    this.droneOsc1.connect(this.droneFilter);
    this.droneOsc2.connect(this.droneFilter);
    this.droneFilter.connect(droneGain);
    droneGain.connect(this.ambienceGain);

    this.droneOsc1.start();
    this.droneOsc2.start();

    // 2. Procedural wind / cavern air noise buffer
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.03 * white) / 1.03;
      lastOut = data[i];
      data[i] *= 2.8;
    }

    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = buffer;
    noiseSrc.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 320;
    this.windFilter.Q.value = 1.6;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.14;

    noiseSrc.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.ambienceGain);
    noiseSrc.start();
  }

  public setAreaAmbience(area: AreaId): void {
    this.currentArea = area;
    if (!this.ctx || !this.droneFilter || !this.windFilter || !this.windGain || !this.droneOsc1 || !this.droneOsc2) {
      return;
    }
    const now = this.ctx.currentTime;
    switch (area) {
      case 'forest':
        this.droneOsc1.frequency.setTargetAtTime(65.4, now, 0.8);
        this.droneOsc2.frequency.setTargetAtTime(98.0, now, 0.8);
        this.droneFilter.frequency.setTargetAtTime(140, now, 0.8);
        this.windFilter.frequency.setTargetAtTime(420, now, 0.8);
        this.windGain.gain.setTargetAtTime(0.18, now, 0.8);
        break;
      case 'temple':
        this.droneOsc1.frequency.setTargetAtTime(73.4, now, 0.8);
        this.droneOsc2.frequency.setTargetAtTime(110.0, now, 0.8);
        this.droneFilter.frequency.setTargetAtTime(220, now, 0.8);
        this.windFilter.frequency.setTargetAtTime(280, now, 0.8);
        this.windGain.gain.setTargetAtTime(0.11, now, 0.8);
        break;
      case 'catacombs':
        this.droneOsc1.frequency.setTargetAtTime(55.0, now, 0.8);
        this.droneOsc2.frequency.setTargetAtTime(82.4, now, 0.8);
        this.droneFilter.frequency.setTargetAtTime(125, now, 0.8);
        this.windFilter.frequency.setTargetAtTime(170, now, 0.8);
        this.windGain.gain.setTargetAtTime(0.09, now, 0.8);
        break;
      case 'sunken_stepwell':
        this.droneOsc1.frequency.setTargetAtTime(69.3, now, 0.8);
        this.droneOsc2.frequency.setTargetAtTime(103.8, now, 0.8);
        this.droneFilter.frequency.setTargetAtTime(195, now, 0.8);
        this.windFilter.frequency.setTargetAtTime(250, now, 0.8);
        this.windGain.gain.setTargetAtTime(0.12, now, 0.8);
        break;
      case 'ashram_ruins':
        this.droneOsc1.frequency.setTargetAtTime(77.8, now, 0.8);
        this.droneOsc2.frequency.setTargetAtTime(116.5, now, 0.8);
        this.droneFilter.frequency.setTargetAtTime(240, now, 0.8);
        this.windFilter.frequency.setTargetAtTime(380, now, 0.8);
        this.windGain.gain.setTargetAtTime(0.15, now, 0.8);
        break;
      case 'asura_fortress':
        this.droneOsc1.frequency.setTargetAtTime(51.9, now, 0.8);
        this.droneOsc2.frequency.setTargetAtTime(77.8, now, 0.8);
        this.droneFilter.frequency.setTargetAtTime(290, now, 0.8);
        this.windFilter.frequency.setTargetAtTime(480, now, 0.8);
        this.windGain.gain.setTargetAtTime(0.17, now, 0.8);
        break;
      case 'astral_observatory':
        this.droneOsc1.frequency.setTargetAtTime(82.4, now, 0.8);
        this.droneOsc2.frequency.setTargetAtTime(123.5, now, 0.8);
        this.droneFilter.frequency.setTargetAtTime(310, now, 0.8);
        this.windFilter.frequency.setTargetAtTime(440, now, 0.8);
        this.windGain.gain.setTargetAtTime(0.14, now, 0.8);
        break;
      case 'serpent_caverns':
        this.droneOsc1.frequency.setTargetAtTime(58.2, now, 0.8);
        this.droneOsc2.frequency.setTargetAtTime(87.3, now, 0.8);
        this.droneFilter.frequency.setTargetAtTime(150, now, 0.8);
        this.windFilter.frequency.setTargetAtTime(190, now, 0.8);
        this.windGain.gain.setTargetAtTime(0.1, now, 0.8);
        break;
      case 'sanctum':
        this.droneOsc1.frequency.setTargetAtTime(61.7, now, 0.8);
        this.droneOsc2.frequency.setTargetAtTime(92.5, now, 0.8);
        this.droneFilter.frequency.setTargetAtTime(270, now, 0.8);
        this.windFilter.frequency.setTargetAtTime(520, now, 0.8);
        this.windGain.gain.setTargetAtTime(0.16, now, 0.8);
        break;
      case 'final_chamber':
        this.droneOsc1.frequency.setTargetAtTime(58.2, now, 0.8);
        this.droneOsc2.frequency.setTargetAtTime(87.3, now, 0.8);
        this.droneFilter.frequency.setTargetAtTime(340, now, 0.8);
        this.windFilter.frequency.setTargetAtTime(240, now, 0.8);
        this.windGain.gain.setTargetAtTime(0.13, now, 0.8);
        break;
    }
  }

  public playFootstep(isStone: boolean, sprinting: boolean): void {
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;
    const perfNow = performance.now();
    if (perfNow - this.lastFootstepAt < 140) return;
    this.lastFootstepAt = perfNow;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isStone ? 'triangle' : 'sine';
    const baseFreq = isStone ? (sprinting ? 145 : 120) : (sprinting ? 95 : 78);
    osc.frequency.setValueAtTime(baseFreq + Math.random() * 20, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.08);

    gain.gain.setValueAtTime(sprinting ? 0.16 : 0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    this.cleanupAfterStop(osc, gain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playSwing(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.14);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playBowRelease(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Bowstring twang
    const twang = this.ctx.createOscillator();
    const twangGain = this.ctx.createGain();
    twang.type = 'triangle';
    twang.frequency.setValueAtTime(240, now);
    twang.frequency.exponentialRampToValueAtTime(92, now + 0.14);
    twangGain.gain.setValueAtTime(0.18, now);
    twangGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    twang.connect(twangGain);
    twangGain.connect(this.sfxGain);
    twang.start(now);
    twang.stop(now + 0.17);

    // Arrow air whistle
    const whistle = this.ctx.createOscillator();
    const whistleGain = this.ctx.createGain();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(1180, now);
    whistle.frequency.exponentialRampToValueAtTime(540, now + 0.16);
    whistleGain.gain.setValueAtTime(0.09, now);
    whistleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    whistle.connect(whistleGain);
    whistleGain.connect(this.sfxGain);
    whistle.start(now);
    whistle.stop(now + 0.18);
  }

  public playHit(heavy = false): void {
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;
    const perfNow = performance.now();
    if (perfNow - this.lastHitAt < 45) return;
    this.lastHitAt = perfNow;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(heavy ? 180 : 240, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.16);

    gain.gain.setValueAtTime(heavy ? 0.28 : 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    this.cleanupAfterStop(osc, gain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playSacredWave(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.03);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.4, now + 0.35);

      gain.gain.setValueAtTime(0.14, now + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.03);
      osc.stop(now + 0.4);
    });
  }

  public playShieldActivate(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(293.66, now);
    osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.25);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  public playPlayerHurt(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.22);

    gain.gain.setValueAtTime(0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playEnemyGrowl(type: EnemyType): void {
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;
    const perfNow = performance.now();
    if (perfNow - this.lastGrowlAt < 280) return;
    this.lastGrowlAt = perfNow;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type === 'dark_spirit' ? 'sine' : 'sawtooth';
    const startFreq =
      type === 'dark_spirit' ? 520 : type === 'boss_kali' ? 84 : 140;
    const endFreq =
      type === 'dark_spirit' ? 280 : type === 'boss_kali' ? 42 : 72;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.32);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = type === 'dark_spirit' ? 1200 : 380;

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    this.cleanupAfterStop(osc, filter, gain);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  public playEnemyDeath(): void {
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;
    const perfNow = performance.now();
    if (perfNow - this.lastDeathAt < 70) return;
    this.lastDeathAt = perfNow;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.42);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    this.cleanupAfterStop(osc, gain);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  public playBell(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Rich Indian temple bell partials
    [220, 440, 656, 885, 1180].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      const amp = 0.18 / (idx + 1);
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 2.4 - idx * 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 2.5);
    });
  }

  public playArtifactPickup(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [293.66, 369.99, 440, 587.33, 739.99].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      gain.gain.setValueAtTime(0.16, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.7);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.72);
    });
  }

  public playLevelUp(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [261.63, 329.63, 392.0, 523.25].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0.18, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.07);
      osc.stop(now + 1.15);
    });
  }

  public playTandavaDamaru(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Deep Om / Rudra Shankha drone
    [110, 164.81, 220].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx === 0 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 340;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.16 / (idx + 1), now + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 5.2);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 5.3);
    });

    // Rhythmic Damaru double-strike pattern (ta-ka-dhi-mi)
    const beats = [0, 0.22, 0.44, 0.72, 0.94, 1.16, 1.44, 1.66, 1.88, 2.16, 2.38, 2.6, 2.88, 3.1, 3.32, 3.6];
    beats.forEach((offset, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const pitch = i % 2 === 0 ? 195 : 260;
      osc.frequency.setValueAtTime(pitch, now + offset);
      osc.frequency.exponentialRampToValueAtTime(75, now + offset + 0.14);
      gain.gain.setValueAtTime(0.24, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.16);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.18);
    });
  }

  public playGodAscension(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [220, 277.18, 329.63, 440, 554.37, 659.25, 880].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.16, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.1);
      osc.stop(now + 2.7);
    });
  }

  public playPortal(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.6);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.66);
  }

  public setMusicContext(ctxMode: MusicContext): void {
    this.musicContext = ctxMode;
  }

  public startMusic(): void {
    this.init();
    if (this.musicPlaying) return;
    this.musicPlaying = true;
    this.musicTimer = window.setInterval(() => {
      this.scheduleMusicStep();
    }, 520);
  }

  private scheduleMusicStep(): void {
    if (!this.ctx || !this.musicGain || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const step = this.musicStep++;

    // Raga-inspired mythological scales (Hz)
    // Bhairav / Kalyug atmospheric scales
    const scales: Record<string, number[]> = {
      intro: [220.0, 233.08, 277.18, 293.66, 329.63, 349.23, 415.3, 440.0],
      menu: [220.0, 246.94, 277.18, 329.63, 369.99, 440.0],
      forest: [196.0, 207.65, 246.94, 261.63, 293.66, 311.13, 392.0],
      temple: [220.0, 233.08, 277.18, 293.66, 329.63, 349.23, 440.0],
      catacombs: [164.81, 174.61, 207.65, 220.0, 246.94, 261.63, 329.63],
      sunken_stepwell: [174.61, 196.0, 220.0, 261.63, 293.66, 349.23],
      ashram_ruins: [220.0, 246.94, 293.66, 329.63, 392.0, 440.0],
      asura_fortress: [146.83, 164.81, 185.0, 220.0, 246.94, 293.66],
      astral_observatory: [246.94, 277.18, 329.63, 369.99, 440.0, 493.88],
      serpent_caverns: [164.81, 185.0, 207.65, 246.94, 277.18, 329.63],
      sanctum: [185.0, 196.0, 233.08, 246.94, 277.18, 293.66, 369.99],
      final_chamber: [146.83, 155.56, 185.0, 220.0, 233.08, 277.18, 293.66],
    };

    const scale = scales[this.musicContext] ?? scales.forest;
    const isBoss = this.musicContext === 'final_chamber';
    const isQuiet = this.musicContext === 'intro';

    // 1. Soft Bansuri / Veena melody every 2nd step (or every step in final chamber)
    if (isBoss || step % 2 === 0) {
      const pattern = [0, 2, 4, 3, 5, 4, 2, 1];
      const idx = pattern[(step >> (isBoss ? 0 : 1)) % pattern.length] % scale.length;
      const freq = scale[idx];

      const osc = this.ctx.createOscillator();
      const overtone = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = isBoss ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(freq * 1.5, now);

      filter.type = 'lowpass';
      filter.frequency.value = isBoss ? 880 : 640;

      const peak = isQuiet ? 0.055 : isBoss ? 0.11 : 0.085;
      const dur = isBoss ? 0.55 : 1.05;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(filter);
      overtone.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      this.cleanupAfterStop(osc, overtone, filter, gain);
      osc.start(now);
      overtone.start(now);
      osc.stop(now + dur + 0.04);
      overtone.stop(now + dur + 0.04);
    }

    // 2. Subtle Tanpura fifth pluck every 4 steps
    if (step % 4 === 0) {
      const root = scale[0] * 0.5;
      const fifth = root * 1.5;
      [fifth, root].forEach((f, i) => {
        if (!this.ctx || !this.musicGain) return;
        const t0 = now + i * 0.24;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t0);
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.linearRampToValueAtTime(isQuiet ? 0.05 : 0.08, t0 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.4);
        osc.connect(gain);
        gain.connect(this.musicGain);
        this.cleanupAfterStop(osc, gain);
        osc.start(t0);
        osc.stop(t0 + 1.45);
      });
    }

    // 3. Rhythmic Mridangam / Damaru pulse in gameplay/boss areas
    if (this.musicContext !== 'intro' && (isBoss || step % 2 === 1)) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const base = isBoss && step % 2 === 0 ? 115 : 82;
      osc.frequency.setValueAtTime(base, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.14);
      gain.gain.setValueAtTime(isBoss ? 0.15 : 0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(this.musicGain);
      this.cleanupAfterStop(osc, gain);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  }

  public playAnvilForge(): void {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Double blacksmith anvil hammer clang
    [0, 0.22].forEach((offset) => {
      [520, 1045, 1620, 2340].forEach((freq, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = i % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now + offset);
        gain.gain.setValueAtTime(0.18 / (i + 1), now + offset);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + offset + 0.55);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + offset);
        osc.stop(now + offset + 0.58);
      });
    });
  }

  public playYaggaIgnition(): void {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [146.83, 220.0, 293.66, 440.0].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i === 0 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 620;
      gain.gain.setValueAtTime(0.001, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.14 / (i + 1), now + i * 0.05 + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.05);
      osc.stop(now + 1.45);
    });
  }

  public playVedaMantraChant(swaraHz: number[], canRetry = true): void {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    if (this.ctx.state === 'suspended') {
      if (canRetry) {
        void this.ctx.resume().then(() => {
          if (this.ctx?.state === 'running') {
            this.playVedaMantraChant(swaraHz, false);
          }
        });
      }
      return;
    }
    const now = this.ctx.currentTime + 0.04;

    swaraHz.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const t0 = now + i * 0.34;
      const osc = this.ctx.createOscillator();
      const sub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(freq * 0.5, t0);

      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(0.15, t0 + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.38);

      osc.connect(gain);
      sub.connect(gain);
      gain.connect(this.sfxGain);
      this.cleanupAfterStop(osc, sub, gain);
      osc.start(t0);
      sub.start(t0);
      osc.stop(t0 + 0.4);
      sub.stop(t0 + 0.4);
    });
  }

  public playBossRoar(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [72, 108, 144].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.55, now + 1.1);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      gain.gain.setValueAtTime(0.2 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 1.2);
    });
  }

  public dispose(): void {
    this.detachUnlock?.();
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.musicPlaying = false;
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.initialized = false;
    }
  }
}
