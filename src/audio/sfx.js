import { audio } from './AudioEngine.js';

// One-shot sound recipes. Each takes optional overrides and schedules itself
// on the shared AudioContext. Kept deliberately physical — glass, cloth, stone,
// air — rather than "game UI" sounds.

const A = audio;
const ok = () => A.ready && A.ctx;
const rnd = (a, b) => a + Math.random() * (b - a);

function out(bus = A.sfx, pan = 0, reverb = 0.15) {
  const p = A.panner(pan);
  p.connect(bus);
  if (reverb > 0) {
    const s = A.gain(reverb);
    p.connect(s);
    s.connect(A.reverbSend);
  }
  return p;
}

export function glassClink({ when = 0, pitch = 1, gain = 0.25, pan = 0 } = {}) {
  if (!ok()) return;
  const t = A.now + when;
  const dest = out(A.sfx, pan, 0.3);
  // Inharmonic partials of a thin crystal glass.
  [1, 2.32, 4.25, 6.63].forEach((ratio, i) => {
    const o = A.osc('sine', 1850 * pitch * ratio * rnd(0.995, 1.005));
    const g = A.gain();
    o.connect(g); g.connect(dest);
    A.env(g.gain, t, gain / (i + 1.2), 0.002, 0.25 + 0.6 / (i + 1));
    o.start(t); o.stop(t + 1.2);
  });
  const n = A.noiseSource(A.noise, false);
  const f = A.filter('highpass', 5000);
  const g = A.gain();
  A.chain(n, f, g, dest);
  A.env(g.gain, t, gain * 0.5, 0.001, 0.03);
  n.start(t); n.stop(t + 0.1);
}

export function glassRoll({ when = 0, duration = 1.4, gain = 0.06, pan = 0 } = {}) {
  if (!ok()) return;
  const t = A.now + when;
  const n = A.noiseSource();
  const bp = A.filter('bandpass', 2600, 6);
  const g = A.gain();
  A.chain(n, bp, g, out(A.sfx, pan, 0.2));
  g.gain.setValueAtTime(0.0001, t);
  // Irregular amplitude to suggest an uneven rolling contact.
  const steps = Math.floor(duration * 22);
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    g.gain.linearRampToValueAtTime(gain * (1 - k) * rnd(0.3, 1), t + k * duration);
  }
  bp.frequency.setValueAtTime(2600, t);
  bp.frequency.linearRampToValueAtTime(1700, t + duration);
  n.start(t); n.stop(t + duration + 0.1);
}

export function glassKnockOver({ pan = -0.2 } = {}) {
  glassClink({ when: 0, pitch: 1.1, gain: 0.12, pan });
  glassClink({ when: 0.42, pitch: 0.92, gain: 0.3, pan });
  glassClink({ when: 0.55, pitch: 0.94, gain: 0.08, pan });
  glassRoll({ when: 0.6, duration: 2.1, gain: 0.05, pan });
}

export function cloth({ when = 0, duration = 0.6, gain = 0.08, pan = 0, bright = 1 } = {}) {
  if (!ok()) return;
  const t = A.now + when;
  const n = A.noiseSource(A.pink);
  const bp = A.filter('bandpass', 1400 * bright, 0.8);
  const g = A.gain();
  A.chain(n, bp, g, out(A.sfx, pan, 0.08));
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + duration * 0.35);
  g.gain.linearRampToValueAtTime(gain * 0.4, t + duration * 0.6);
  g.gain.linearRampToValueAtTime(0.0001, t + duration);
  bp.frequency.setValueAtTime(900 * bright, t);
  bp.frequency.linearRampToValueAtTime(2200 * bright, t + duration * 0.4);
  bp.frequency.linearRampToValueAtTime(1100 * bright, t + duration);
  n.start(t); n.stop(t + duration + 0.05);
}

export function footstep({ kind = 'soft', pan = 0, gain = 1 } = {}) {
  if (!ok()) return;
  const t = A.now;
  const dest = out(A.sfx, pan, kind === 'run' ? 0.18 : 0.1);
  const heavy = kind === 'boot' || kind === 'run';
  const o = A.osc('sine', heavy ? 95 : 70);
  const g = A.gain();
  o.connect(g); g.connect(dest);
  o.frequency.setValueAtTime(heavy ? 120 : 80, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.09);
  A.env(g.gain, t, (heavy ? 0.22 : 0.1) * gain, 0.004, 0.12);
  o.start(t); o.stop(t + 0.2);
  // A short contact transient; boots get a hard heel, bare feet a soft pad.
  const n = A.noiseSource(A.noise, false);
  const f = A.filter(heavy ? 'bandpass' : 'lowpass', heavy ? 2400 : 900, heavy ? 1.2 : 0.7);
  const ng = A.gain();
  A.chain(n, f, ng, dest);
  A.env(ng.gain, t, (heavy ? 0.06 : 0.025) * gain * rnd(0.7, 1.1), 0.002, heavy ? 0.05 : 0.07);
  n.start(t); n.stop(t + 0.15);
}

// Ceremonial bell: two-operator FM with a long tail into the hall.
export function bell({ freq = 220, when = 0, gain = 0.12, decay = 4, ratio = 1.41, index = 2.2, pan = 0, hall = 0.6, bus } = {}) {
  if (!ok()) return;
  const t = A.now + when;
  const p = A.panner(pan);
  p.connect(bus || A.sfx);
  if (hall) {
    const hs = A.gain(hall);
    p.connect(hs); hs.connect(A.hallSend);
  }
  const car = A.osc('sine', freq);
  const mod = A.osc('sine', freq * ratio);
  const modGain = A.gain(freq * index);
  mod.connect(modGain); modGain.connect(car.frequency);
  modGain.gain.setValueAtTime(freq * index, t);
  modGain.gain.exponentialRampToValueAtTime(freq * 0.05, t + decay * 0.6);
  const g = A.gain();
  car.connect(g); g.connect(p);
  A.env(g.gain, t, gain, 0.006, decay);
  car.start(t); mod.start(t);
  car.stop(t + decay + 0.2); mod.stop(t + decay + 0.2);
}

// Each Seer's channel announces itself in its own timbre.
export function channelOpen(kind) {
  if (kind === 'aureate') {
    bell({ freq: 659.25, gain: 0.07, ratio: 2, index: 1.2, decay: 5, pan: -0.4 });
    bell({ freq: 987.77, when: 0.08, gain: 0.04, ratio: 2, index: 0.8, decay: 4.5, pan: -0.4 });
  } else if (kind === 'meridian') {
    bell({ freq: 493.88, gain: 0.06, ratio: 3.5, index: 0.6, decay: 3, pan: 0.4 });
  } else {
    bell({ freq: 82.41, gain: 0.16, ratio: 1.5, index: 3, decay: 6, pan: 0 });
    bell({ freq: 164.81, when: 0.02, gain: 0.05, ratio: 1.07, index: 1.5, decay: 5, pan: 0 });
  }
}

export function channelClose({ pan = 0.4 } = {}) {
  if (!ok()) return;
  const t = A.now;
  const o = A.osc('sine', 493.88);
  const g = A.gain();
  o.connect(g); g.connect(out(A.sfx, pan, 0.4));
  o.frequency.exponentialRampToValueAtTime(240, t + 0.5);
  A.env(g.gain, t, 0.05, 0.01, 0.5);
  o.start(t); o.stop(t + 0.7);
}

export function lowImpact({ gain = 0.5, freq = 48 } = {}) {
  if (!ok()) return;
  const t = A.now;
  const o = A.osc('sine', freq * 2.2);
  const g = A.gain();
  o.connect(g); g.connect(A.sfx);
  o.frequency.exponentialRampToValueAtTime(freq, t + 0.25);
  A.env(g.gain, t, gain, 0.005, 1.6);
  o.start(t); o.stop(t + 2);
}

// KSSSH — thump — modulator online.
export function helmetSeal() {
  if (!ok()) return;
  const t = A.now;
  // Pressure seal: high hiss sweeping down, tight.
  const n = A.noiseSource();
  const bp = A.filter('bandpass', 7000, 1.4);
  const hp = A.filter('highpass', 1800);
  const g = A.gain();
  A.chain(n, hp, bp, g, A.voice);
  bp.frequency.setValueAtTime(9000, t);
  bp.frequency.exponentialRampToValueAtTime(2200, t + 0.55);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.16, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);
  n.start(t); n.stop(t + 0.7);
  // Mechanical latches.
  [0.05, 0.11].forEach((dt) => {
    const c = A.noiseSource(A.noise, false);
    const cf = A.filter('bandpass', 3200, 4);
    const cg = A.gain();
    A.chain(c, cf, cg, A.voice);
    A.env(cg.gain, t + dt, 0.12, 0.001, 0.03);
    c.start(t + dt); c.stop(t + dt + 0.06);
  });
  // Low electronic thump.
  const o = A.osc('sine', 110);
  const d = A.shaper(6);
  const og = A.gain();
  A.chain(o, d, og, A.voice);
  o.frequency.setValueAtTime(140, t + 0.62);
  o.frequency.exponentialRampToValueAtTime(38, t + 1.0);
  A.env(og.gain, t + 0.62, 0.42, 0.004, 0.9);
  o.start(t + 0.6); o.stop(t + 1.8);
  // Voice modulator coming online: a formant sweep through a vocal-ish buzz.
  const buzz = A.osc('sawtooth', 58);
  const f1 = A.filter('bandpass', 300, 9);
  const vg = A.gain();
  A.chain(buzz, f1, vg, A.voice);
  f1.frequency.setValueAtTime(220, t + 1.05);
  f1.frequency.exponentialRampToValueAtTime(1400, t + 1.65);
  f1.frequency.exponentialRampToValueAtTime(500, t + 2.1);
  vg.gain.setValueAtTime(0.0001, t + 1.05);
  vg.gain.linearRampToValueAtTime(0.09, t + 1.4);
  vg.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
  buzz.start(t + 1.0); buzz.stop(t + 2.3);
}

export function suitAssemble() {
  if (!ok()) return;
  const t = A.now;
  for (let i = 0; i < 9; i++) {
    const dt = i * 0.13 + rnd(0, 0.05);
    const c = A.noiseSource(A.noise, false);
    const f = A.filter('bandpass', rnd(1200, 3400), 5);
    const g = A.gain();
    A.chain(c, f, g, out(A.sfx, rnd(-0.3, 0.3), 0.25));
    A.env(g.gain, t + dt, 0.09, 0.001, 0.05);
    c.start(t + dt); c.stop(t + dt + 0.1);
  }
  cloth({ when: 1.2, duration: 1.1, gain: 0.12, bright: 0.6 });
}

export function gunshot() {
  if (!ok()) return;
  const t = A.now;
  // Crack.
  const n = A.noiseSource(A.noise, false);
  const hp = A.filter('highpass', 600);
  const d = A.shaper(40);
  const g = A.gain();
  A.chain(n, hp, d, g, A.voice);
  g.gain.setValueAtTime(0.9, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  n.start(t); n.stop(t + 0.4);
  // Body.
  const o = A.osc('sine', 160);
  const og = A.gain();
  A.chain(o, A.shaper(10), og, A.voice);
  o.frequency.exponentialRampToValueAtTime(32, t + 0.3);
  A.env(og.gain, t, 0.9, 0.002, 0.7);
  o.start(t); o.stop(t + 0.9);
  // Through the call's compression: a brief digital clip/tear.
  const s = A.osc('square', 2400);
  const sg = A.gain();
  A.chain(s, A.filter('bandpass', 3000, 2), sg, A.voice);
  A.env(sg.gain, t + 0.02, 0.12, 0.001, 0.18);
  s.start(t); s.stop(t + 0.3);
}

// The ears ringing after the shot, decaying into true silence.
export function tinnitus({ duration = 7 } = {}) {
  if (!ok()) return;
  const t = A.now;
  const o = A.osc('sine', 6100);
  const g = A.gain();
  o.connect(g); g.connect(A.voice);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.018, t + 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  o.start(t); o.stop(t + duration + 0.1);
}

export function chairFall() {
  if (!ok()) return;
  const t = A.now;
  [0, 0.28, 0.4].forEach((dt, i) => {
    const o = A.osc('triangle', [180, 240, 210][i]);
    const g = A.gain();
    A.chain(o, A.filter('lowpass', 900), g, out(A.sfx, 0.2, 0.35));
    o.frequency.exponentialRampToValueAtTime(70, t + dt + 0.2);
    A.env(g.gain, t + dt, [0.25, 0.4, 0.12][i], 0.003, 0.35);
    o.start(t + dt); o.stop(t + dt + 0.5);
    const n = A.noiseSource(A.noise, false);
    const ng = A.gain();
    A.chain(n, A.filter('bandpass', 1500, 1), ng, out(A.sfx, 0.2, 0.35));
    A.env(ng.gain, t + dt, [0.08, 0.16, 0.05][i], 0.002, 0.12);
    n.start(t + dt); n.stop(t + dt + 0.2);
  });
}

export function doorSlide({ gain = 0.12, open = true } = {}) {
  if (!ok()) return;
  const t = A.now;
  const n = A.noiseSource(A.brown);
  const f = A.filter('lowpass', 400, 2);
  const g = A.gain();
  A.chain(n, f, g, out(A.sfx, -0.3, 0.3));
  f.frequency.setValueAtTime(open ? 200 : 500, t);
  f.frequency.linearRampToValueAtTime(open ? 700 : 180, t + 1.1);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.2);
  g.gain.linearRampToValueAtTime(0.0001, t + 1.3);
  n.start(t); n.stop(t + 1.4);
  lowImpact({ gain: 0.18, freq: 40 });
}

export function shutterRise({ pan = 0, gain = 0.06 } = {}) {
  if (!ok()) return;
  const t = A.now;
  const n = A.noiseSource(A.noise);
  const f = A.filter('bandpass', 800, 3);
  const g = A.gain();
  A.chain(n, f, g, out(A.sfx, pan, 0.25));
  // Slat clatter: rapid AM.
  g.gain.setValueAtTime(0.0001, t);
  for (let i = 0; i < 28; i++) {
    g.gain.linearRampToValueAtTime(gain * (i % 2 ? 0.2 : 1), t + i * 0.045);
  }
  g.gain.linearRampToValueAtTime(0.0001, t + 1.4);
  f.frequency.linearRampToValueAtTime(1300, t + 1.3);
  n.start(t); n.stop(t + 1.5);
}

export function whoosh({ pan = 0, gain = 0.05, duration = 1.6 } = {}) {
  if (!ok()) return;
  const t = A.now;
  const n = A.noiseSource(A.pink);
  const f = A.filter('bandpass', 400, 1.2);
  const g = A.gain();
  const p = A.panner(pan);
  A.chain(n, f, g, p, A.amb);
  if (p.pan) {
    p.pan.setValueAtTime(-pan, t);
    p.pan.linearRampToValueAtTime(pan, t + duration);
  }
  f.frequency.setValueAtTime(300, t);
  f.frequency.exponentialRampToValueAtTime(1500, t + duration * 0.5);
  f.frequency.exponentialRampToValueAtTime(350, t + duration);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + duration * 0.5);
  g.gain.linearRampToValueAtTime(0.0001, t + duration);
  n.start(t); n.stop(t + duration + 0.05);
}

export function screenWake({ pan = 0 } = {}) {
  if (!ok()) return;
  const t = A.now;
  const o = A.osc('sine', 15000);
  const g = A.gain();
  A.chain(o, g, out(A.sfx, pan, 0.05));
  A.env(g.gain, t, 0.006, 0.05, 0.6);
  o.start(t); o.stop(t + 0.8);
  const n = A.noiseSource();
  const ng = A.gain();
  A.chain(n, A.filter('highpass', 3000), ng, out(A.sfx, pan, 0.05));
  A.env(ng.gain, t, 0.025, 0.01, 0.25);
  n.start(t); n.stop(t + 0.3);
}

export function distantBoom({ pan = 0, gain = 0.2 } = {}) {
  if (!ok()) return;
  const t = A.now;
  const n = A.noiseSource(A.brown, false);
  const f = A.filter('lowpass', 160, 1);
  const g = A.gain();
  A.chain(n, f, g, out(A.amb, pan, 0.6));
  A.env(g.gain, t, gain, 0.05, 2.4);
  n.start(t); n.stop(t + 2.6);
}

// A soft exhale used for unhelmeted Parallax beats. Human, not a UI sound.
export function exhale({ gain = 0.03, duration = 1.3 } = {}) {
  if (!ok()) return;
  const t = A.now;
  const n = A.noiseSource(A.pink);
  const f = A.filter('bandpass', 900, 0.9);
  const g = A.gain();
  A.chain(n, f, g, A.sfx);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  f.frequency.linearRampToValueAtTime(600, t + duration);
  n.start(t); n.stop(t + duration + 0.05);
}

export function sheetPull() {
  cloth({ duration: 0.9, gain: 0.07, bright: 1.2 });
}

export function paperShuffle() {
  cloth({ duration: 0.35, gain: 0.05, bright: 2.4 });
  cloth({ when: 0.2, duration: 0.25, gain: 0.03, bright: 2.8 });
}

export function metalSet({ pan = 0 } = {}) {
  if (!ok()) return;
  const t = A.now;
  [1, 2.76, 5.4].forEach((r, i) => {
    const o = A.osc('sine', 420 * r);
    const g = A.gain();
    A.chain(o, g, out(A.sfx, pan, 0.25));
    A.env(g.gain, t, 0.05 / (i + 1), 0.002, 0.5);
    o.start(t); o.stop(t + 0.6);
  });
}

// ---------------------------------------------------------------------------
// Chapter Two: the Record, the bridge, the duel.

// Prompt feedback: small, tonal, not "gamey".
export function qteTick({ p = 0, soft = false } = {}) {
  if (!ok()) return;
  const t = A.now;
  const o = A.osc('sine', 520 + p * 640);
  const g = A.gain();
  A.chain(o, g, out(A.sfx, 0, 0.05));
  A.env(g.gain, t, soft ? 0.008 : 0.02, 0.003, soft ? 0.05 : 0.09);
  o.start(t); o.stop(t + 0.15);
}

export function qteOk() {
  if (!ok()) return;
  bell({ freq: 880, gain: 0.03, ratio: 2, index: 0.6, decay: 1.4, hall: 0.3 });
  bell({ freq: 1318.5, when: 0.05, gain: 0.02, ratio: 2, index: 0.4, decay: 1.2, hall: 0.3 });
}

export function qteFail() {
  if (!ok()) return;
  const t = A.now;
  const o = A.osc('triangle', 196);
  const g = A.gain();
  A.chain(o, A.filter('lowpass', 900), g, out(A.sfx, 0, 0.1));
  o.frequency.exponentialRampToValueAtTime(150, t + 0.4);
  A.env(g.gain, t, 0.03, 0.01, 0.45);
  o.start(t); o.stop(t + 0.5);
}

// Her blows: a bright crack of light with a ringing tail.
export function lightStrike({ pan = 0, gain = 1, hit = true } = {}) {
  if (!ok()) return;
  const t = A.now;
  const n = A.noiseSource(A.noise, false);
  const f = A.filter('bandpass', 3200, 0.9);
  const g = A.gain();
  A.chain(n, f, g, out(A.sfx, pan, 0.35));
  f.frequency.setValueAtTime(5200, t);
  f.frequency.exponentialRampToValueAtTime(900, t + 0.18);
  A.env(g.gain, t, 0.16 * gain, 0.002, 0.2);
  n.start(t); n.stop(t + 0.3);
  if (hit) {
    lowImpact({ gain: 0.22 * gain, freq: 62 });
    bell({ freq: 1567.98, gain: 0.025 * gain, ratio: 2.76, index: 1.4, decay: 1.6, pan, hall: 0.4 });
  }
}

// His: a hollow, inward thud, as if the air folded.
export function umbralStrike({ pan = 0, gain = 1 } = {}) {
  if (!ok()) return;
  const t = A.now;
  const o = A.osc('sine', 180);
  const g = A.gain();
  A.chain(o, A.shaper(6), g, out(A.sfx, pan, 0.4));
  o.frequency.setValueAtTime(240, t);
  o.frequency.exponentialRampToValueAtTime(38, t + 0.35);
  A.env(g.gain, t, 0.3 * gain, 0.004, 0.6);
  o.start(t); o.stop(t + 0.8);
  const n = A.noiseSource(A.brown, false);
  const ng = A.gain();
  A.chain(n, A.filter('lowpass', 600), ng, out(A.sfx, pan, 0.3));
  ng.gain.setValueAtTime(0.0001, t);
  ng.gain.exponentialRampToValueAtTime(0.25 * gain, t + 0.12);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  n.start(t); n.stop(t + 0.4);
}

// Blade meets guard: metal and light, no blood.
export function parry({ pan = 0 } = {}) {
  if (!ok()) return;
  const t = A.now;
  [1, 2.71, 4.13].forEach((r, i) => {
    const o = A.osc('square', 610 * r * rnd(0.99, 1.01));
    const g = A.gain();
    A.chain(o, A.filter('bandpass', 610 * r, 6), g, out(A.sfx, pan, 0.5));
    A.env(g.gain, t, 0.04 / (i + 1), 0.001, 0.5 - i * 0.1);
    o.start(t); o.stop(t + 0.6);
  });
  const n = A.noiseSource();
  const ng = A.gain();
  A.chain(n, A.filter('highpass', 2500), ng, out(A.sfx, pan, 0.2));
  A.env(ng.gain, t, 0.08, 0.001, 0.06);
  n.start(t); n.stop(t + 0.1);
}

export function dodge({ pan = 0 } = {}) {
  if (!ok()) return;
  const t = A.now;
  const n = A.noiseSource(A.pink);
  const f = A.filter('bandpass', 900, 1.4);
  const g = A.gain();
  A.chain(n, f, g, out(A.sfx, pan, 0.1));
  f.frequency.setValueAtTime(1800, t);
  f.frequency.exponentialRampToValueAtTime(500, t + 0.22);
  A.env(g.gain, t, 0.09, 0.02, 0.22);
  n.start(t); n.stop(t + 0.3);
}

// The tell before he moves: a dry intake and a rising sliver of tone.
export function tell({ pan = 0, ms = 700 } = {}) {
  if (!ok()) return;
  const t = A.now;
  const d = ms / 1000;
  const o = A.osc('sine', 330);
  const g = A.gain();
  A.chain(o, g, out(A.sfx, pan, 0.4));
  o.frequency.setValueAtTime(330, t);
  o.frequency.exponentialRampToValueAtTime(990, t + d);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.03, t + d * 0.9);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.05);
  o.start(t); o.stop(t + d + 0.1);
  const n = A.noiseSource();
  const ng = A.gain();
  const nf = A.filter('bandpass', 1400, 2);
  A.chain(n, nf, ng, out(A.sfx, pan, 0.2));
  nf.frequency.exponentialRampToValueAtTime(5000, t + d);
  ng.gain.setValueAtTime(0.0001, t);
  ng.gain.exponentialRampToValueAtTime(0.04, t + d);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.03);
  n.start(t); n.stop(t + d + 0.1);
}

// Slow motion: the world drops a register for a moment.
export function timeSlip() {
  if (!ok()) return;
  const t = A.now;
  const o = A.osc('sine', 110);
  const g = A.gain();
  A.chain(o, g, out(A.sfx, 0, 0.8));
  o.frequency.exponentialRampToValueAtTime(55, t + 0.8);
  A.env(g.gain, t, 0.12, 0.01, 1.4);
  o.start(t); o.stop(t + 1.5);
  bell({ freq: 246.94, gain: 0.04, ratio: 0.5, index: 1.5, decay: 2.5, hall: 0.8 });
}

// A hanger cable parting: a whip-crack and a long singing wire.
export function cableSnap({ pan = 0, gain = 1 } = {}) {
  if (!ok()) return;
  const t = A.now;
  const n = A.noiseSource(A.noise, false);
  const g = A.gain();
  A.chain(n, A.filter('highpass', 1500), g, out(A.sfx, pan, 0.5));
  A.env(g.gain, t, 0.3 * gain, 0.001, 0.12);
  n.start(t); n.stop(t + 0.2);
  [1, 1.5, 2.25].forEach((r, i) => {
    const o = A.osc('sawtooth', 140 * r);
    const og = A.gain();
    A.chain(o, A.filter('bandpass', 700 * r, 8), og, out(A.sfx, pan, 0.6));
    o.frequency.setValueAtTime(220 * r, t);
    o.frequency.exponentialRampToValueAtTime(70 * r, t + 1.8);
    A.env(og.gain, t, 0.05 * gain / (i + 1), 0.002, 1.9);
    o.start(t); o.stop(t + 2);
  });
}

// Steel under load: a slow, deep complaint.
export function bridgeGroan({ pan = 0, gain = 1, duration = 3 } = {}) {
  if (!ok()) return;
  const t = A.now;
  const o = A.osc('sawtooth', 42);
  const g = A.gain();
  const f = A.filter('bandpass', 180, 6);
  A.chain(o, f, g, out(A.sfx, pan, 0.7));
  o.frequency.setValueAtTime(46, t);
  o.frequency.linearRampToValueAtTime(34, t + duration);
  f.frequency.setValueAtTime(140, t);
  f.frequency.linearRampToValueAtTime(260, t + duration * 0.5);
  f.frequency.linearRampToValueAtTime(120, t + duration);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.22 * gain, t + duration * 0.3);
  g.gain.linearRampToValueAtTime(0.0001, t + duration);
  o.start(t); o.stop(t + duration + 0.1);
}

// The span going: tearing steel, then the long fall, then the water.
export function collapse() {
  if (!ok()) return;
  bridgeGroan({ gain: 1.6, duration: 2.2 });
  [0, 0.3, 0.55, 0.9].forEach((w, i) => setTimeout(() => cableSnap({ pan: (i - 1.5) * 0.4, gain: 0.8 }), w * 1000));
  const t = A.now;
  const n = A.noiseSource(A.brown, false);
  const f = A.filter('lowpass', 300, 0.8);
  const g = A.gain();
  A.chain(n, f, g, out(A.sfx, 0, 0.8));
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.7, t + 1.2);
  g.gain.linearRampToValueAtTime(0.4, t + 3.5);
  g.gain.linearRampToValueAtTime(0.0001, t + 6);
  f.frequency.linearRampToValueAtTime(900, t + 1.5);
  f.frequency.linearRampToValueAtTime(140, t + 6);
  n.start(t); n.stop(t + 6.2);
  setTimeout(() => lowImpact({ gain: 0.6, freq: 30 }), 3200);
}

// Archive damage: a digital tear in the footage.
export function glitch({ gain = 1 } = {}) {
  if (!ok()) return;
  const t = A.now;
  const o = A.osc('square', rnd(80, 300));
  const g = A.gain();
  A.chain(o, A.filter('bandpass', rnd(900, 3000), 3), g, out(A.sfx, rnd(-0.5, 0.5), 0));
  for (let i = 0; i < 6; i++) o.frequency.setValueAtTime(rnd(60, 1200), t + i * 0.025);
  A.env(g.gain, t, 0.05 * gain, 0.001, 0.16);
  o.start(t); o.stop(t + 0.2);
  const n = A.noiseSource();
  const ng = A.gain();
  A.chain(n, A.filter('highpass', 4000), ng, out(A.sfx, 0, 0));
  A.env(ng.gain, t, 0.04 * gain, 0.001, 0.1);
  n.start(t); n.stop(t + 0.15);
}

// Her arrival: light hitting stone from a great height.
export function landing({ gain = 1 } = {}) {
  if (!ok()) return;
  lowImpact({ gain: 0.5 * gain, freq: 40 });
  const t = A.now;
  const n = A.noiseSource(A.noise, false);
  const g = A.gain();
  A.chain(n, A.filter('lowpass', 2400), g, out(A.sfx, 0, 0.6));
  A.env(g.gain, t, 0.22 * gain, 0.002, 0.5);
  n.start(t); n.stop(t + 0.6);
  bell({ freq: 587.33, gain: 0.03 * gain, ratio: 1.5, index: 1, decay: 3, hall: 0.8 });
}

// Lanterns dying one by one: a low electric pop with a violet whine.
export function lanternOut({ pan = 0 } = {}) {
  if (!ok()) return;
  const t = A.now;
  const o = A.osc('sawtooth', 120);
  const g = A.gain();
  A.chain(o, A.filter('lowpass', 800), g, out(A.sfx, pan, 0.3));
  o.frequency.exponentialRampToValueAtTime(40, t + 0.2);
  A.env(g.gain, t, 0.05, 0.002, 0.25);
  o.start(t); o.stop(t + 0.3);
}

// A cloth-and-air rush for flight.
export function flyBy({ pan = 0, gain = 0.08 } = {}) {
  whoosh({ pan, gain, duration: 0.9 });
}
