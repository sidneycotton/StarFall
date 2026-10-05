import { audio as A } from './AudioEngine.js';

// Parallax's helmet voice. There is no voice acting, so we synthesise the
// *timbre* of a filtered, deliberately masculine, artificial voice and drive it
// with the rhythm of the text: one formant "syllable" per vowel group.
// Kept low and mostly sub/low-mid so it reads as presence rather than gibberish.

const VOWELS = /[aeiouy]+/gi;

function syllables(text) {
  const words = text.replace(/[^\p{L}\s.,!?—-]/gu, '').split(/\s+/).filter(Boolean);
  const out = [];
  words.forEach((w) => {
    const groups = w.match(VOWELS)?.length || 1;
    for (let i = 0; i < groups; i++) out.push({ pause: 0 });
    if (/[.,!?—-]$/.test(w)) out[out.length - 1].pause = /[.!?]$/.test(w) ? 0.32 : 0.16;
    else out[out.length - 1].pause = 0.04;
  });
  return out;
}

const FORMANTS = [
  [310, 870], [400, 1700], [530, 1480], [660, 1100], [350, 600], [450, 1300],
];

export function speakModulated(text, { duration, gain = 0.11, pitch = 1 } = {}) {
  if (!A.ready) return () => {};
  const t0 = A.now + 0.02;
  const syl = syllables(text);
  if (!syl.length) return () => {};
  const total = duration || Math.max(0.6, syl.length * 0.16);
  const step = total / syl.length;

  const out = A.gain(gain);
  out.connect(A.voice);
  const lp = A.filter('lowpass', 2100, 0.8);
  const ring = A.gain(1);
  const ringOsc = A.osc('sine', 34);
  const ringDepth = A.gain(0.35);
  ringOsc.connect(ringDepth); ringDepth.connect(ring.gain);
  const dist = A.shaper(14);
  A.chain(ring, dist, lp, out);

  const src = A.osc('sawtooth', 58 * pitch);
  const vib = A.osc('sine', 5.2);
  const vibG = A.gain(1.6);
  vib.connect(vibG); vibG.connect(src.frequency);
  const sub = A.osc('sine', 29 * pitch);
  const subG = A.gain(0.0001);
  sub.connect(subG); subG.connect(out);

  const f1 = A.filter('bandpass', 400, 7);
  const f2 = A.filter('bandpass', 1200, 9);
  const amp = A.gain(0.0001);
  src.connect(f1); src.connect(f2);
  f1.connect(amp); f2.connect(amp);
  amp.connect(ring);

  let t = t0;
  syl.forEach((s) => {
    const [a, b] = FORMANTS[Math.floor(Math.random() * FORMANTS.length)];
    f1.frequency.setTargetAtTime(a * 0.85, t, 0.025);
    f2.frequency.setTargetAtTime(b * 0.8, t, 0.025);
    const len = step * 0.72;
    amp.gain.setTargetAtTime(1, t, 0.02);
    amp.gain.setTargetAtTime(0.0001, t + len, 0.03);
    subG.gain.setTargetAtTime(0.25, t, 0.03);
    subG.gain.setTargetAtTime(0.0001, t + len, 0.05);
    src.frequency.setTargetAtTime(58 * pitch * (0.94 + Math.random() * 0.1), t, 0.05);
    t += step + s.pause * 0.6;
  });
  const end = t + 0.3;
  [src, vib, sub, ringOsc].forEach((o) => { o.start(t0); o.stop(end); });
  return () => {
    const n = A.now;
    out.gain.cancelScheduledValues(n);
    out.gain.setTargetAtTime(0.0001, n, 0.04);
  };
}
