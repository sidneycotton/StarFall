import { settings } from '../core/Settings.js';
import { bus } from '../core/EventBus.js';

// Procedural Web Audio engine. Everything audible in STARFALL is synthesised at
// runtime, so there are no audio assets to load. Routing:
//
//   sfx ─┐
//   amb ─┼─> world (helmet low-pass) ─┐
//         │                            ├─> master ─> limiter ─> out
//   voice ────────────────────────────┤
//   music ────────────────────────────┘
//   reverb send ──> convolver ─> world
//
// "world" is everything Parallax hears through air; when the helmet seals we
// close its filter so the room becomes muffled while voice/music stay clear.

class AudioEngineImpl {
  constructor() {
    this.ctx = null;
    this.ready = false;
  }

  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx({ latencyHint: 'interactive' });
    this.ctx = ctx;

    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -10;
    this.limiter.knee.value = 8;
    this.limiter.ratio.value = 8;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.25;
    this.limiter.connect(ctx.destination);

    this.master = ctx.createGain();
    this.master.connect(this.limiter);

    this.worldFilter = ctx.createBiquadFilter();
    this.worldFilter.type = 'lowpass';
    this.worldFilter.frequency.value = 18000;
    this.worldFilter.Q.value = 0.4;
    this.world = ctx.createGain();
    // Stillness (Chapter Three): the world drawn in close and soft.
    this.stillFilter = ctx.createBiquadFilter();
    this.stillFilter.type = 'lowpass';
    this.stillFilter.frequency.value = 20000;
    this.stillGain = ctx.createGain();
    this.world.connect(this.stillFilter);
    this.stillFilter.connect(this.stillGain);
    this.stillGain.connect(this.worldFilter);
    this.worldFilter.connect(this.master);

    this.sfx = this.makeBus(this.world, 1);
    this.amb = this.makeBus(this.world, 1);
    this.voice = this.makeBus(this.master, 1);
    this.music = this.makeBus(this.master, 1);

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.makeImpulse(3.2, 2.6);
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 1;
    this.reverbSend.connect(this.reverb);
    this.reverb.connect(this.world);

    // A second, longer "cathedral" space for the ceremonial interface and the title.
    this.hall = ctx.createConvolver();
    this.hall.buffer = this.makeImpulse(6.5, 3.4);
    this.hallSend = ctx.createGain();
    this.hallSend.connect(this.hall);
    this.hall.connect(this.master);

    this.noise = this.makeNoise('white', 4);
    this.brown = this.makeNoise('brown', 6);
    this.pink = this.makeNoise('pink', 6);

    this.applyVolumes();
    bus.on('settings:changed', () => this.applyVolumes());
    this.ready = true;
  }

  async unlock() {
    this.init();
    if (this.ctx && this.ctx.state !== 'running') {
      try { await this.ctx.resume(); } catch { /* ignored */ }
    }
  }

  get now() {
    return this.ctx ? this.ctx.currentTime : performance.now() / 1000;
  }

  makeBus(dest, gain) {
    const g = this.ctx.createGain();
    g.gain.value = gain;
    g.connect(dest);
    return g;
  }

  applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const m = settings.get('muted') ? 0 : settings.get('master');
    this.master.gain.setTargetAtTime(m, t, 0.05);
    this.music.gain.setTargetAtTime(settings.get('music'), t, 0.05);
  }

  makeNoise(kind, seconds) {
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let last = 0;
      let b0 = 0; let b1 = 0; let b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (kind === 'brown') {
          last = (last + 0.02 * w) / 1.02;
          d[i] = last * 3.5;
        } else if (kind === 'pink') {
          b0 = 0.99765 * b0 + w * 0.099046;
          b1 = 0.963 * b1 + w * 0.2965164;
          b2 = 0.57 * b2 + w * 1.0526913;
          d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18;
        } else {
          d[i] = w;
        }
      }
    }
    return buf;
  }

  makeImpulse(seconds, decay) {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        // Slight pre-delay and a darker tail make it feel like stone, not a plate.
        const env = Math.pow(1 - t, decay) * (i < rate * 0.012 ? i / (rate * 0.012) : 1);
        d[i] = (Math.random() * 2 - 1) * env * (1 - 0.6 * t);
      }
    }
    return buf;
  }

  // --- small building blocks used by recipes -------------------------------

  noiseSource(buffer = this.noise, loop = true) {
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = loop;
    src.loopStart = Math.random() * (buffer.duration - 1);
    return src;
  }

  filter(type, freq, q = 0.7) {
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  gain(value = 0) {
    const g = this.ctx.createGain();
    g.gain.value = value;
    return g;
  }

  panner(pan = 0) {
    if (!this.ctx.createStereoPanner) return this.gain(1);
    const p = this.ctx.createStereoPanner();
    p.pan.value = pan;
    return p;
  }

  osc(type, freq) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    return o;
  }

  shaper(amount = 20) {
    const ws = this.ctx.createWaveShaper();
    const n = 1024;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
    }
    ws.curve = curve;
    ws.oversample = '2x';
    return ws;
  }

  // Connect a chain of nodes left to right; returns the first node.
  chain(...nodes) {
    for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
    return nodes[0];
  }

  // Envelope helper: attack/hold/release on an AudioParam.
  env(param, t, peak, attack, release, hold = 0) {
    param.cancelScheduledValues(t);
    param.setValueAtTime(0.0001, t);
    param.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    if (hold) param.setValueAtTime(Math.max(peak, 0.0002), t + attack + hold);
    param.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
  }

  // Stop a set of nodes after a delay without clicks.
  stopLater(sources, when) {
    sources.forEach((s) => {
      try { s.stop(when); } catch { /* already stopped */ }
    });
  }

  // --- global moments --------------------------------------------------------

  setHelmet(sealed, time = 0.35) {
    if (!this.ctx) return;
    const t = this.now;
    this.helmet = sealed;
    this.worldFilter.frequency.cancelScheduledValues(t);
    this.worldFilter.frequency.setTargetAtTime(sealed ? 1500 : this.openFreq(), t, time);
    this.worldFilter.Q.setTargetAtTime(sealed ? 1.6 : 0.4, t, time);
  }

  openFreq() {
    return this.archive ? 5200 : 18000;
  }

  // Archive footage: the world is heard through a narrower, older channel.
  setArchive(on, time = 0.4) {
    this.archive = on;
    if (!this.ctx || this.helmet) return;
    this.worldFilter.frequency.setTargetAtTime(this.openFreq(), this.now, time);
  }

  // Momentary dip (slow motion), returning to the current base.
  dip(freq = 700, hold = 0.8) {
    if (!this.ctx) return;
    const t = this.now;
    const f = this.worldFilter.frequency;
    f.cancelScheduledValues(t);
    f.setTargetAtTime(freq, t, 0.04);
    f.setTargetAtTime(this.helmet ? 1500 : this.openFreq(), t + hold, 0.25);
  }

  // 0..1: how far Wallflower has faded from notice.
  setStill(s) {
    if (!this.ctx) return;
    const t = this.now;
    this.stillFilter.frequency.setTargetAtTime(20000 * Math.pow(1400 / 20000, s), t, 0.08);
    this.stillGain.gain.setTargetAtTime(1 - s * 0.35, t, 0.08);
  }

  // Hard cut of everything in the world (used for the gunshot silence).
  cutWorld(fadeOut = 0.02) {
    if (!this.ctx) return;
    const t = this.now;
    [this.world, this.music].forEach((g) => {
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0.0001, t + fadeOut);
    });
  }

  restoreWorld(time = 2) {
    if (!this.ctx) return;
    const t = this.now;
    this.world.gain.cancelScheduledValues(t);
    this.world.gain.setValueAtTime(Math.max(this.world.gain.value, 0.0001), t);
    this.world.gain.linearRampToValueAtTime(1, t + time);
    this.music.gain.cancelScheduledValues(t);
    this.music.gain.setValueAtTime(Math.max(this.music.gain.value, 0.0001), t);
    this.music.gain.linearRampToValueAtTime(settings.get('music'), t + time);
  }
}

export const audio = new AudioEngineImpl();
