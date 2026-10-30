/**
 * Web Audio API procedural sound engine for Frontline Command
 */

export class SoundEngine {
  private static ctx: AudioContext | null = null;
  private static noiseBuffer: AudioBuffer | null = null;
  private static reverbConvolver: ConvolverNode | null = null;
  private static masterGain: GainNode | null = null;
  private static lastDistantTime: Record<string, number> = {};
  private static outNode: AudioNode | null = null;
  private static outDelay: number = 0;
  private static pitchMultiplier: number = 1;

  public static muted: boolean = false;
  public static soundMode: number = 0; // 0: fog echo, 1: everywhere, 2: muffled silent
  public static masterVolume: number = 0.8;
  public static sfxVolume: number = 0.85;

  private static getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.masterVolume * this.sfxVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public static updateVolumes(muted: boolean, master: number, sfx: number, soundMode: number): void {
    this.muted = muted;
    this.masterVolume = master;
    this.sfxVolume = sfx;
    this.soundMode = soundMode;
    if (this.ctx && this.masterGain) {
      const gainVal = muted ? 0 : master * sfx;
      this.masterGain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    }
  }

  private static tone(f: number, ty: OscillatorType, d: number, v = 0.15, sl = 0, dl = 0): void {
    if (this.muted) return;
    try {
      const ac = this.getContext();
      const t = ac.currentTime + dl + this.outDelay;
      const osc = ac.createOscillator();
      const gain = ac.createGain();

      const adjustedF = f * this.pitchMultiplier;
      const adjustedSl = sl * this.pitchMultiplier;

      osc.type = ty;
      osc.frequency.setValueAtTime(Math.max(20, adjustedF), t);
      if (adjustedSl) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, adjustedF + adjustedSl), t + d);
      }

      gain.gain.setValueAtTime(v, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + d);

      osc.connect(gain);
      gain.connect(this.outNode || this.masterGain || ac.destination);

      osc.start(t);
      osc.stop(t + d);
    } catch {
      // Audio safety
    }
  }

  private static noise(d: number, v = 0.2, f = 1500, dl = 0): void {
    if (this.muted) return;
    try {
      const ac = this.getContext();
      if (!this.noiseBuffer || this.noiseBuffer.sampleRate !== ac.sampleRate) {
        this.noiseBuffer = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = Math.random() * 2 - 1;
        }
      }

      const t = ac.currentTime + dl + this.outDelay;
      const src = ac.createBufferSource();
      const fl = ac.createBiquadFilter();
      const gain = ac.createGain();

      src.buffer = this.noiseBuffer;
      fl.type = 'lowpass';
      fl.frequency.value = f;

      gain.gain.setValueAtTime(v, t);
      gain.gain.linearRampToValueAtTime(0, t + d);

      src.connect(fl);
      fl.connect(gain);
      gain.connect(this.outNode || this.masterGain || ac.destination);

      src.start(t, Math.random() * 0.9, d);
    } catch {
      // Audio safety
    }
  }

  private static farEcho(effectFn: () => void, k: string, x: number, y: number, isLocal: boolean, viewerX?: number, viewerY?: number, mapSize = 15): void {
    try {
      const ac = this.getContext();
      const now = ac.currentTime;
      if (k in this.lastDistantTime && now - this.lastDistantTime[k] < 0.07) return;
      this.lastDistantTime[k] = now;

      if (!this.reverbConvolver) {
        const len = (ac.sampleRate * 2.2) | 0;
        const ir = ac.createBuffer(2, len, ac.sampleRate);
        for (let c = 0; c < 2; c++) {
          const arr = ir.getChannelData(c);
          for (let i = 0; i < len; i++) {
            arr[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
          }
        }
        this.reverbConvolver = ac.createConvolver();
        this.reverbConvolver.buffer = ir;
        const wetGain = ac.createGain();
        wetGain.gain.value = 0.8;
        this.reverbConvolver.connect(wetGain);
        wetGain.connect(this.masterGain || ac.destination);
      }

      const dist = Math.hypot((viewerX ?? mapSize / 2) - x, (viewerY ?? mapSize / 2) - y);
      const fr = Math.min(1, dist / (mapSize * 0.75));

      const lp = ac.createBiquadFilter();
      const dr = ac.createGain();
      const sd = ac.createGain();

      const heavyMult = k === 'big' ? 2 : 'ABJLFMYTV'.includes(k) ? 1 : k === 'boom' ? 1.6 : k === 'hit' ? 0.4 : 0.5;

      lp.type = 'lowpass';
      lp.frequency.value = Math.max(100, 1500 - 950 * fr);
      dr.gain.value = Math.max(0.05, 0.9 - 0.5 * fr);
      sd.gain.value = 0.5 + 0.6 * fr;

      lp.connect(dr);
      dr.connect(this.masterGain || ac.destination);
      lp.connect(sd);
      sd.connect(this.reverbConvolver);

      this.outNode = lp;
      this.outDelay = Math.min(0.7, 0.04 + dist * 0.045);
      this.pitchMultiplier = 1 - 0.25 * fr;

      effectFn();

      if (!isLocal) {
        this.tone(46 + Math.random() * 16, 'sine', 0.5 + 0.5 * heavyMult, 0.13 * heavyMult, -12);
      }
    } finally {
      this.outNode = null;
      this.outDelay = 0;
      this.pitchMultiplier = 1;
    }
  }

  public static play(k: string, x?: number, y?: number, visible = true, isLocal = false, viewerPos?: { x: number; y: number }, mapSize = 15): void {
    if (this.muted) return;

    const F: Record<string, () => void> = {
      sel: () => this.tone(660, 'square', 0.07, 0.05),
      mv: () => {
        this.noise(0.1, 0.12, 500);
        this.tone(110, 'triangle', 0.12, 0.08);
      },
      fly: () => {
        this.noise(0.35, 0.1, 2500);
        this.tone(300, 'triangle', 0.35, 0.05, 200);
      },
      R: () => {
        this.noise(0.08, 0.25, 3500);
        this.tone(220, 'square', 0.08, 0.08, -150);
      },
      G: () => F.R(),
      M: () => {
        F.R();
        this.noise(0.08, 0.25, 3500, 0.1);
      },
      Y: () => {
        for (let i = 0; i < 4; i++) this.noise(0.05, 0.2, 3000, i * 0.07);
      },
      S: () => {
        this.tone(1400, 'sine', 0.18, 0.12, -1000);
        this.noise(0.04, 0.3, 7000);
      },
      A: () => {
        this.tone(90, 'sawtooth', 0.45, 0.3, -55);
        this.noise(0.4, 0.4, 500);
      },
      B: () => {
        this.tone(75, 'sawtooth', 0.35, 0.3, -40);
        this.noise(0.3, 0.35, 800);
      },
      J: () => {
        F.B();
        this.tone(60, 'square', 0.4, 0.25, -30, 0.05);
      },
      L: () => {
        this.noise(0.6, 0.18, 1800);
        this.tone(180, 'sawtooth', 0.6, 0.1, 700);
      },
      F: () => this.tone(500, 'triangle', 0.4, 0.1, -350),
      E: () => {
        this.tone(200, 'sawtooth', 0.4, 0.1, 1400);
        this.tone(1600, 'square', 0.2, 0.05, -1200, 0.2);
      },
      P: () => {
        [523, 659, 784].forEach((f, i) => this.tone(f, 'sine', 0.2, 0.1, 0, i * 0.09));
      },
      C: () => F.R(),
      T: () => F.M(),
      Z: () => F.Y(),
      N: () => F.P(),
      K: () => F.P(),
      V: () => {
        this.tone(900, 'sawtooth', 0.3, 0.1, -700);
        this.noise(0.3, 0.4, 1000, 0.28);
      },
      D: () => {
        // Railgun Destroyer: hyper-velocity kinetic discharge
        this.tone(1600, 'sawtooth', 0.22, 0.25, -1300);
        this.noise(0.25, 0.4, 3800);
      },
      U: () => {
        // Flak Halftrack: rapid double thud autocannon
        this.noise(0.07, 0.3, 2200);
        this.tone(150, 'square', 0.08, 0.12, -60);
      },
      Q: () => {
        // Hovercraft: high-energy pulse discharge
        this.tone(620, 'sine', 0.14, 0.15, -320);
        this.noise(0.06, 0.18, 1400);
      },
      I: () => {
        // Infiltrator: suppressed subsonic crack
        this.tone(850, 'triangle', 0.08, 0.12, -650);
        this.noise(0.03, 0.18, 6500);
      },
      X: () => {
        // Shock Trooper: pressurized incendiary roar
        this.noise(0.38, 0.35, 850);
        this.tone(110, 'sawtooth', 0.25, 0.12, 30);
      },
      hit: () => {
        this.noise(0.15, 0.3, 900);
        this.tone(120, 'sine', 0.15, 0.2, -70);
      },
      boom: () => {
        this.noise(0.8, 0.5, 600);
        this.tone(60, 'sawtooth', 0.7, 0.35, -35);
      },
      big: () => {
        this.noise(1.1, 0.5, 450);
        this.tone(52, 'sawtooth', 0.9, 0.4, -28);
        this.noise(0.35, 0.35, 1600, 0.04);
        this.tone(100, 'square', 0.25, 0.15, -60);
      },
      cap: () => {
        [392, 523, 659, 784].forEach((f, i) => this.tone(f, 'triangle', 0.15, 0.1, 0, i * 0.07));
      },
      spawn: () => this.tone(300, 'sine', 0.2, 0.1, 500),
      turn: () => {
        this.tone(440, 'sine', 0.15, 0.1);
        this.tone(660, 'sine', 0.25, 0.1, 0, 0.12);
      },
      go: () => {
        [262, 330, 392, 523].forEach((f, i) => this.tone(f, 'square', 0.2, 0.07, 0, i * 0.1));
      },
      win: () => {
        [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 'triangle', 0.3, 0.12, 0, i * 0.12));
      },
      lose: () => {
        [392, 330, 262, 196].forEach((f, i) => this.tone(f, 'sawtooth', 0.4, 0.1, 0, i * 0.2));
      },
    };

    if (x === undefined || y === undefined) {
      if (F[k]) F[k]();
      return;
    }

    if (this.soundMode === 1) {
      this.farEcho(F[k] || (() => {}), k, x, y, isLocal, viewerPos?.x, viewerPos?.y, mapSize);
    } else if (visible) {
      if (F[k]) F[k]();
    } else if (this.soundMode === 0 && !isLocal) {
      this.farEcho(F[k] || (() => {}), k, x, y, isLocal, viewerPos?.x, viewerPos?.y, mapSize);
    }
  }
}
