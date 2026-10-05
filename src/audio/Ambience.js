import { audio as A } from './AudioEngine.js';
import { bell } from './sfx.js';

// Long-running ambient layers. Each layer owns its nodes and exposes
// start/stop plus a few expressive parameters that scenes animate.

const rnd = (a, b) => a + Math.random() * (b - a);

class Layer {
  constructor() {
    this.nodes = [];
    this.sources = [];
    this.timers = [];
    this.running = false;
  }

  track(...nodes) {
    nodes.forEach((n) => {
      this.nodes.push(n);
      if (n.start) this.sources.push(n);
    });
    return nodes[0];
  }

  every(ms, fn) {
    const id = setInterval(fn, ms);
    this.timers.push(id);
  }

  stop(fade = 1.5) {
    if (!this.running || !A.ctx) return;
    this.running = false;
    const t = A.now;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(Math.max(this.out.gain.value, 0.0001), t);
    this.out.gain.linearRampToValueAtTime(0.0001, t + Math.max(fade, 0.01));
    this.timers.forEach(clearInterval);
    this.timers = [];
    A.stopLater(this.sources, t + fade + 0.05);
    const nodes = this.nodes;
    setTimeout(() => nodes.forEach((n) => { try { n.disconnect(); } catch { /* */ } }), (fade + 0.2) * 1000);
    this.nodes = [];
    this.sources = [];
  }

  fadeTo(value, time = 1) {
    if (!this.running) return;
    const t = A.now;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(Math.max(this.out.gain.value, 0.0001), t);
    this.out.gain.linearRampToValueAtTime(Math.max(value, 0.0001), t + time);
  }

  begin(dest, gain, fadeIn) {
    this.running = true;
    this.out = A.gain(0.0001);
    this.out.connect(dest);
    this.out.gain.linearRampToValueAtTime(gain, A.now + fadeIn);
    this.track(this.out);
    return this.out;
  }
}

// Low building HVAC + the city through thick glass.
export class RoomTone extends Layer {
  start({ gain = 1, fadeIn = 3 } = {}) {
    if (!A.ready || this.running) return this;
    const out = this.begin(A.amb, gain, fadeIn);
    const hv = this.track(A.noiseSource(A.brown));
    const hvf = this.track(A.filter('lowpass', 130, 0.9));
    const hvg = this.track(A.gain(0.11));
    A.chain(hv, hvf, hvg, out);
    // Very slow wobble so it never sounds like a static loop.
    const lfo = this.track(A.osc('sine', 0.07));
    const lfoG = this.track(A.gain(30));
    lfo.connect(lfoG); lfoG.connect(hvf.frequency);
    const city = this.track(A.noiseSource(A.pink));
    this.cityFilter = this.track(A.filter('bandpass', 320, 0.5));
    this.cityGain = this.track(A.gain(0.05));
    A.chain(city, this.cityFilter, this.cityGain, out);
    hv.start(); city.start(); lfo.start();
    return this;
  }

  // 0 = sealed glass night, 1 = the city screaming through open shutters.
  setCity(level, time = 2) {
    if (!this.running) return;
    const t = A.now;
    this.cityGain.gain.setTargetAtTime(0.05 + level * 0.12, t, time / 3);
    this.cityFilter.frequency.setTargetAtTime(320 + level * 600, t, time / 3);
  }
}

// Emergency sirens across the city. `muffle` 1 = dreamlike, through walls.
export class Sirens extends Layer {
  start({ count = 1, muffle = 1, gain = 0.5, fadeIn = 4 } = {}) {
    if (!A.ready || this.running) return this;
    const out = this.begin(A.amb, gain, fadeIn);
    this.lp = this.track(A.filter('lowpass', 400 + (1 - muffle) * 3000, 0.6));
    this.lp.connect(out);
    const send = this.track(A.gain(0.9));
    this.lp.connect(send); send.connect(A.reverbSend);
    for (let i = 0; i < count; i++) this.addVoice(i);
    return this;
  }

  addVoice(i) {
    const base = rnd(560, 760);
    const o = this.track(A.osc(i % 2 ? 'triangle' : 'sawtooth', base));
    const lfo = this.track(A.osc(i % 2 ? 'square' : 'sine', i % 2 ? rnd(0.9, 1.3) : rnd(0.1, 0.18)));
    const lfoG = this.track(A.gain(base * 0.28));
    lfo.connect(lfoG); lfoG.connect(o.frequency);
    const g = this.track(A.gain(i === 0 ? 0.05 : 0.03));
    const p = this.track(A.panner(i === 0 ? -0.3 : rnd(-0.9, 0.9)));
    A.chain(o, g, p, this.lp);
    o.start(); lfo.start();
  }

  setMuffle(muffle, time = 3) {
    if (!this.running) return;
    this.lp.frequency.setTargetAtTime(400 + (1 - muffle) * 3000, A.now, time / 3);
  }

  grow(extra) {
    if (!this.running) return;
    for (let i = 0; i < extra; i++) this.addVoice(i + 2);
  }
}

// The Seer convergence alarm: a vibrating low pulse under a three-voice
// ceremonial chord (one voice per Seer). Visuals read pulseAt() so the red
// lighting and the sound share one clock.
export class ConvergenceAlarm extends Layer {
  constructor() {
    super();
    this.period = 1.7;
    this.origin = 0;
    this.proximity = 0;
  }

  start({ fadeIn = 6 } = {}) {
    if (!A.ready || this.running) return this;
    const out = this.begin(A.amb, 1, fadeIn);
    this.lp = this.track(A.filter('lowpass', 420, 0.8));
    this.lp.connect(out);
    this.origin = A.now + 0.1;
    this.nextPulse = this.origin;
    this.pulseIndex = 0;
    this.every(90, () => this.schedule());
    this.schedule();
    return this;
  }

  schedule() {
    if (!this.running) return;
    while (this.nextPulse < A.now + 0.4) {
      this.pulse(this.nextPulse, this.pulseIndex++);
      this.nextPulse += this.period;
    }
  }

  pulse(t, i) {
    // Vibrating buzz — a device rattling against stone.
    const o = A.osc('square', 52);
    const am = A.osc('square', 31);
    const amG = A.gain(0.5);
    const g = A.gain(0.0001);
    const vca = A.gain(0.5);
    am.connect(amG); amG.connect(vca.gain);
    A.chain(o, A.filter('lowpass', 220, 2), vca, g, this.lp);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.02);
    g.gain.setValueAtTime(0.2, t + 0.38);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.start(t); am.start(t); o.stop(t + 0.6); am.stop(t + 0.6);
    // Ceremonial voices — clearer with proximity.
    const chord = [[329.63, 0.6, 2], [246.94, 0, 3.5], [110, -0.6, 1.5]];
    const voice = chord[i % 3];
    const level = 0.02 + this.proximity * 0.08;
    const when = t - A.now;
    if (when > -0.05) {
      bell({ freq: voice[0], when: Math.max(0, when), gain: level, ratio: voice[2], index: 1.2, decay: 3.2, pan: voice[1] * 0.3, hall: 0.3 + this.proximity * 0.5, bus: this.lp });
    }
  }

  setProximity(p) {
    if (!this.running) return;
    this.proximity = Math.max(0, Math.min(1, p));
    this.lp.frequency.setTargetAtTime(420 + this.proximity * 5200, A.now, 0.2);
  }

  // 0..1 envelope of the current pulse: sharp attack, quick decay.
  pulseAt(t = A.now) {
    if (!this.running) return 0;
    const local = t - this.origin;
    if (local < 0) return 0;
    const ph = (local % this.period) / this.period;
    if (ph < 0.012) return ph / 0.012;
    return Math.exp(-(ph - 0.012) * 7.5);
  }

  // Hard stop with no tail — the moment the room goes silent.
  kill() {
    this.stop(0.015);
  }
}

// Last night's sound system, still looping a lounge progression, slowly dying.
export class PartyLoop extends Layer {
  start({ gain = 0.6, life = 75 } = {}) {
    if (!A.ready || this.running) return this;
    const out = this.begin(A.amb, gain, 6);
    this.lp = this.track(A.filter('lowpass', 900, 0.7));
    this.lp.connect(out);
    this.detune = 0;
    this.bar = 0;
    this.nextBar = A.now + 0.3;
    this.deathAt = A.now + life;
    this.every(100, () => this.schedule());
    return this;
  }

  schedule() {
    if (!this.running) return;
    const chords = [
      [146.83, 220, 261.63, 329.63, 369.99],
      [130.81, 196, 246.94, 293.66, 329.63],
      [123.47, 185, 220, 293.66, 329.63],
      [110, 164.81, 207.65, 246.94, 311.13],
    ];
    while (this.nextBar < A.now + 0.5) {
      const t = this.nextBar;
      const dying = Math.max(0, (t - (this.deathAt - 14)) / 14);
      const rate = 1 - dying * 0.35;
      const chord = chords[this.bar % chords.length];
      chord.forEach((f, i) => {
        const pitch = f * rate * Math.pow(2, -dying * 1.2 / 12);
        const o = A.osc('sine', pitch);
        const m = A.osc('sine', pitch * 1);
        const mg = A.gain(pitch * 0.8);
        m.connect(mg); mg.connect(o.frequency);
        const g = A.gain();
        A.chain(o, g, this.lp);
        A.env(g.gain, t + i * 0.012, 0.05 * (1 - dying * 0.6), 0.01, 2.6 * rate);
        o.start(t); m.start(t); o.stop(t + 3); m.stop(t + 3);
      });
      // Soft sub pulse on the beat, like a kick heard from the next room.
      for (let b = 0; b < 4; b++) {
        const bt = t + b * (0.62 / rate);
        const k = A.osc('sine', 60);
        const kg = A.gain();
        A.chain(k, kg, this.lp);
        k.frequency.setValueAtTime(90, bt);
        k.frequency.exponentialRampToValueAtTime(42, bt + 0.12);
        A.env(kg.gain, bt, 0.12 * (1 - dying), 0.004, 0.22);
        k.start(bt); k.stop(bt + 0.3);
      }
      this.nextBar += 2.48 / rate;
      this.bar++;
      if (t > this.deathAt) {
        this.stop(1.2);
        return;
      }
    }
  }
}

// The vision: sub-bass, wind, and stone grinding across a continent.
export class VisionDrone extends Layer {
  start({ gain = 1, fadeIn = 1.5 } = {}) {
    if (!A.ready || this.running) return this;
    const out = this.begin(A.voice, gain, fadeIn);
    const sub = this.track(A.osc('sine', 31));
    const sub2 = this.track(A.osc('sine', 46.5));
    const sg = this.track(A.gain(0.35));
    const sg2 = this.track(A.gain(0.12));
    sub.connect(sg); sub2.connect(sg2); sg.connect(out); sg2.connect(out);
    // Wind.
    const w = this.track(A.noiseSource(A.pink));
    this.windF = this.track(A.filter('bandpass', 600, 1.8));
    const wg = this.track(A.gain(0.28));
    const wl = this.track(A.osc('sine', 0.17));
    const wlg = this.track(A.gain(380));
    wl.connect(wlg); wlg.connect(this.windF.frequency);
    A.chain(w, this.windF, wg, out);
    // Grinding: brown noise, narrow, with jittered amplitude.
    const gr = this.track(A.noiseSource(A.brown));
    const grf = this.track(A.filter('bandpass', 85, 3));
    this.grind = this.track(A.gain(0.0));
    A.chain(gr, grf, A.shaper(8), this.grind, out);
    // Distant harmonic distortion.
    const h = this.track(A.osc('sawtooth', 61.7));
    const hf = this.track(A.filter('lowpass', 300, 4));
    const hg = this.track(A.gain(0.03));
    A.chain(h, A.shaper(30), hf, hg, out);
    [sub, sub2, w, wl, gr, h].forEach((s) => s.start());
    this.every(70, () => {
      if (!this.running) return;
      this.grind.gain.setTargetAtTime(this.grindLevel * rnd(0.3, 1), A.now, 0.03);
    });
    this.grindLevel = 0.15;
    return this;
  }

  surge(level = 1, time = 0.4) {
    if (!this.running) return;
    this.grindLevel = 0.15 + level * 0.9;
    this.fadeTo(0.6 + level * 0.7, time);
  }

  settle(time = 1.2) {
    if (!this.running) return;
    this.grindLevel = 0.12;
    this.fadeTo(0.35, time);
  }
}

// Breathing heard inside the helmet. rate: breaths per second.
export class HelmetBreath extends Layer {
  start({ gain = 1, rate = 0.22 } = {}) {
    if (!A.ready || this.running) return this;
    this.begin(A.voice, gain, 1);
    this.rate = rate;
    this.next = A.now + 0.2;
    this.inhale = true;
    this.every(100, () => this.schedule());
    return this;
  }

  setRate(rate, gain) {
    this.rate = rate;
    if (gain !== undefined) this.fadeTo(gain, 0.6);
  }

  schedule() {
    if (!this.running) return;
    while (this.next < A.now + 0.3) {
      const t = this.next;
      const dur = (0.5 / this.rate) * (this.inhale ? 0.42 : 0.58);
      const n = A.noiseSource();
      const f = A.filter('bandpass', this.inhale ? 1500 : 950, 1.2);
      const f2 = A.filter('lowpass', 2600);
      const g = A.gain();
      A.chain(n, f, f2, g, this.out);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(this.inhale ? 0.03 : 0.04, t + dur * 0.4);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      n.start(t); n.stop(t + dur + 0.05);
      this.next += dur + (this.inhale ? 0.05 : 0.25 / this.rate);
      this.inhale = !this.inhale;
    }
  }
}

// A low sustained tone for the workstation ritual.
export class CallTone extends Layer {
  start({ gain = 0.6, fadeIn = 4 } = {}) {
    if (!A.ready || this.running) return this;
    const out = this.begin(A.music, gain, fadeIn);
    const lp = this.track(A.filter('lowpass', 420, 0.5));
    lp.connect(out);
    [[55, 0.14], [82.6, 0.06], [110.3, 0.035], [164.4, 0.012]].forEach(([f, g]) => {
      const o = this.track(A.osc('sine', f));
      const og = this.track(A.gain(g));
      o.connect(og); og.connect(lp);
      o.start();
    });
    return this;
  }
}

// ---------------------------------------------------------------------------
// Chapter Two.

// Tape/stream hiss under everything in the Record, with dropouts.
export class ArchiveHiss extends Layer {
  start({ gain = 1, fadeIn = 1 } = {}) {
    if (!A.ready || this.running) return this;
    const out = this.begin(A.amb, gain, fadeIn);
    const n = this.track(A.noiseSource(A.pink));
    const f = this.track(A.filter('bandpass', 4200, 0.4));
    const g = this.track(A.gain(0.018));
    A.chain(n, f, g, out);
    const hum = this.track(A.osc('sine', 60));
    const hg = this.track(A.gain(0.006));
    A.chain(hum, hg, out);
    n.start(); hum.start();
    this.g = g;
    this.every(1700, () => {
      if (Math.random() < 0.35) {
        const t = A.now;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.setValueAtTime(0.018, t + rnd(0.03, 0.12));
      }
    });
    return this;
  }
}

// The bridge: high wind through cables, the river far below, fires, a crowd.
export class BridgeAmbience extends Layer {
  start({ gain = 1, fadeIn = 3 } = {}) {
    if (!A.ready || this.running) return this;
    const out = this.begin(A.amb, gain, fadeIn);
    const wind = this.track(A.noiseSource(A.pink));
    this.windF = this.track(A.filter('bandpass', 500, 0.6));
    this.windG = this.track(A.gain(0.07));
    A.chain(wind, this.windF, this.windG, out);
    const lfo = this.track(A.osc('sine', 0.09));
    const lfoG = this.track(A.gain(260));
    lfo.connect(lfoG); lfoG.connect(this.windF.frequency);
    // Cables singing: two thin tones that swell with the wind.
    [311, 466].forEach((f, i) => {
      const o = this.track(A.osc('sine', f));
      const og = this.track(A.gain(0.004));
      const l = this.track(A.osc('sine', 0.13 + i * 0.07));
      const lg = this.track(A.gain(0.004));
      l.connect(lg); lg.connect(og.gain);
      A.chain(o, og, out);
      o.start(); l.start();
    });
    const river = this.track(A.noiseSource(A.brown));
    const rf = this.track(A.filter('lowpass', 260, 0.7));
    const rg = this.track(A.gain(0.12));
    A.chain(river, rf, rg, out);
    // Crowd: a band of murmur, rising and falling.
    const crowd = this.track(A.noiseSource(A.pink));
    const cf = this.track(A.filter('bandpass', 700, 1.6));
    this.crowdG = this.track(A.gain(0.035));
    A.chain(crowd, cf, this.crowdG, out);
    wind.start(); lfo.start(); river.start(); crowd.start();
    // Fire crackle and distant collapses.
    this.every(140, () => {
      if (Math.random() < 0.5) return;
      const t = A.now;
      const c = A.noiseSource(A.noise, false);
      const cg = A.gain();
      A.chain(c, A.filter('highpass', 2000), cg, out);
      A.env(cg.gain, t, rnd(0.004, 0.02), 0.001, rnd(0.01, 0.04));
      c.start(t); c.stop(t + 0.06);
    });
    this.every(6500, () => {
      if (Math.random() < 0.6) {
        const t = A.now;
        const b = A.noiseSource(A.brown, false);
        const bg = A.gain();
        A.chain(b, A.filter('lowpass', 140), bg, out);
        A.env(bg.gain, t, rnd(0.06, 0.15), 0.05, 2.2);
        b.start(t); b.stop(t + 2.4);
      }
    });
    return this;
  }

  setCrowd(level, time = 1.5) {
    if (!this.running) return;
    this.crowdG.gain.setTargetAtTime(0.01 + level * 0.07, A.now, time / 3);
  }

  setWind(level, time = 2) {
    if (!this.running) return;
    this.windG.gain.setTargetAtTime(0.04 + level * 0.12, A.now, time / 3);
  }
}

// High over the clouds: one huge, smooth wind and nothing else.
export class SkyWind extends Layer {
  start({ gain = 1, fadeIn = 2 } = {}) {
    if (!A.ready || this.running) return this;
    const out = this.begin(A.amb, gain, fadeIn);
    [A.pink, A.brown].forEach((buf, i) => {
      const n = this.track(A.noiseSource(buf));
      const f = this.track(A.filter(i ? 'lowpass' : 'bandpass', i ? 220 : 800, 0.5));
      const g = this.track(A.gain(i ? 0.18 : 0.05));
      const l = this.track(A.osc('sine', 0.05 + i * 0.04));
      const lg = this.track(A.gain(i ? 60 : 400));
      l.connect(lg); lg.connect(f.frequency);
      A.chain(n, f, g, out);
      n.start(); l.start();
    });
    return this;
  }
}

// A vigil: hundreds of quiet people outdoors, a far city, a breeze.
export class VigilCrowd extends Layer {
  start({ gain = 1, fadeIn = 4 } = {}) {
    if (!A.ready || this.running) return this;
    const out = this.begin(A.amb, gain, fadeIn);
    const city = this.track(A.noiseSource(A.brown));
    const cf = this.track(A.filter('lowpass', 200, 0.6));
    const cg = this.track(A.gain(0.06));
    A.chain(city, cf, cg, out);
    // Murmur: two bands of pink noise with syllabic wobble.
    [480, 1100].forEach((f, i) => {
      const n = this.track(A.noiseSource(A.pink));
      const bf = this.track(A.filter('bandpass', f, 2.2));
      const g = this.track(A.gain(0.02 - i * 0.008));
      const l = this.track(A.osc('sine', 3.2 + i * 1.7));
      const lg = this.track(A.gain(0.008 - i * 0.003));
      l.connect(lg); lg.connect(g.gain);
      A.chain(n, bf, g, out);
      const s = this.track(A.gain(0.3));
      g.connect(s); s.connect(A.reverbSend);
      n.start(); l.start();
    });
    this.murmur = out;
    city.start();
    // Now and then: a cough, a shuffle.
    this.every(2600, () => {
      if (Math.random() < 0.5) return;
      const t = A.now;
      const c = A.noiseSource(A.noise, false);
      const g = A.gain();
      const p = A.panner(rnd(-0.8, 0.8));
      A.chain(c, A.filter('bandpass', rnd(400, 1200), 1.5), g, p, out);
      A.env(g.gain, t, rnd(0.004, 0.012), 0.01, rnd(0.08, 0.2));
      c.start(t); c.stop(t + 0.3);
    });
    return this;
  }

  hush(level = 0.3, time = 2) {
    this.fadeTo(level, time);
  }
}

// Inside Tram 6: traction motor, wheels on rail, the carriage's own hum, and
// the night outside when the doors are open. The scene drives speed.
export class TramAmbience extends Layer {
  start({ gain = 1, fadeIn = 2 } = {}) {
    if (!A.ready || this.running) return this;
    const out = this.begin(A.amb, gain, fadeIn);
    // Carriage hum: a constant, slightly resonant room.
    const room = this.track(A.noiseSource(A.brown));
    const rf = this.track(A.filter('lowpass', 180, 1.2));
    const rg = this.track(A.gain(0.05));
    A.chain(room, rf, rg, out);
    // Traction motor: a low buzz and a whine, both rising with speed.
    this.motor = this.track(A.osc('sawtooth', 36));
    const mf = this.track(A.filter('lowpass', 160, 1.4));
    this.motorG = this.track(A.gain(0.004));
    A.chain(this.motor, mf, this.motorG, out);
    this.whine = this.track(A.osc('sine', 220));
    this.whineG = this.track(A.gain(0.0001));
    A.chain(this.whine, this.whineG, out);
    // Wheels on rail: a rumbling band.
    const roll = this.track(A.noiseSource(A.pink));
    this.rollF = this.track(A.filter('bandpass', 240, 0.8));
    this.rollG = this.track(A.gain(0.0001));
    A.chain(roll, this.rollF, this.rollG, out);
    // Outside: wind and the river, heard through the open doors.
    const air = this.track(A.noiseSource(A.pink));
    const af = this.track(A.filter('bandpass', 600, 0.5));
    this.airG = this.track(A.gain(0.008));
    A.chain(air, af, this.airG, out);
    room.start(); this.motor.start(); this.whine.start(); roll.start(); air.start();
    this.out = out;
    return this;
  }

  // v in metres per second (0..~11).
  setSpeed(v) {
    if (!this.running) return;
    const t = A.now;
    const k = Math.min(1, v / 11);
    this.motor.frequency.setTargetAtTime(36 + k * 34, t, 0.3);
    this.motorG.gain.setTargetAtTime(0.004 + k * 0.03, t, 0.3);
    this.whine.frequency.setTargetAtTime(220 + k * 520, t, 0.3);
    this.whineG.gain.setTargetAtTime(0.0001 + k * 0.006, t, 0.4);
    this.rollF.frequency.setTargetAtTime(160 + k * 300, t, 0.3);
    this.rollG.gain.setTargetAtTime(0.0001 + k * 0.08, t, 0.3);
  }

  setOpen(open) {
    if (!this.running) return;
    this.airG.gain.setTargetAtTime(open ? 0.06 : 0.008, A.now, 0.5);
  }

  // Rail joint: a double knock, front bogie then back.
  clack(gain = 1) {
    if (!this.running) return;
    const t = A.now;
    [0, 0.11].forEach((d, i) => {
      const n = A.noiseSource(A.noise, false);
      const f = A.filter('bandpass', 900 - i * 200, 1.5);
      const g = A.gain();
      A.chain(n, f, g, this.out);
      A.env(g.gain, t + d, 0.05 * gain, 0.002, 0.06);
      n.start(t + d); n.stop(t + d + 0.1);
      const o = A.osc('sine', 80);
      const og = A.gain();
      A.chain(o, og, this.out);
      A.env(og.gain, t + d, 0.06 * gain, 0.002, 0.09);
      o.start(t + d); o.stop(t + d + 0.12);
    });
  }
}
