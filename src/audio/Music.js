import { audio as A } from './AudioEngine.js';
import { bell } from './sfx.js';

// Music is used sparingly: nothing in the bedroom, a held tone at the
// workstation, silence after the shot, then this cue when Parallax runs.

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

export class RunCue {
  constructor() {
    this.running = false;
    this.timers = [];
  }

  start() {
    if (!A.ready || this.running) return;
    this.running = true;
    this.out = A.gain(0.0001);
    this.out.connect(A.music);
    this.out.gain.linearRampToValueAtTime(0.9, A.now + 1.2);
    this.padBus = A.filter('lowpass', 500, 0.9);
    this.padBus.connect(this.out);
    const send = A.gain(0.35);
    this.out.connect(send); send.connect(A.hallSend);
    this.bpm = 104;
    this.step = 0;
    this.layer = 0; // grows with escalation
    this.next = A.now + 0.05;
    this.timers.push(setInterval(() => this.schedule(), 60));
  }

  escalate(level) {
    this.layer = Math.max(this.layer, level);
    if (this.padBus) this.padBus.frequency.setTargetAtTime(500 + level * 700, A.now, 1.2);
  }

  schedule() {
    if (!this.running) return;
    const sixteenth = 60 / this.bpm / 4;
    // E Phrygian-leaning: Em — F — Em — Dm/F (b2 for dread).
    const roots = [40, 41, 40, 38];
    while (this.next < A.now + 0.25) {
      const t = this.next;
      const bar = Math.floor(this.step / 16);
      const s = this.step % 16;
      const root = roots[bar % roots.length];

      // Sub pulse on eighths with ducking shape.
      if (s % 2 === 0) this.sub(t, midi(root - 12 + 12), s % 8 === 0 ? 0.22 : 0.12);
      // Taiko-like low drum on 1 and the "and" of 2.
      if (s === 0 || s === 6 || (this.layer >= 2 && s === 10)) this.drum(t, s === 0 ? 0.5 : 0.3);
      // Held pad per bar.
      if (s === 0) this.pad(t, root, sixteenth * 16);
      // High ostinato from layer 1.
      if (this.layer >= 1 && s % 2 === 0) {
        const pattern = [0, 7, 3, 7, 12, 7, 3, 1];
        this.pluck(t, midi(root + 24 + pattern[(s / 2) % 8]), 0.035 + this.layer * 0.008);
      }
      // A bright ringing accent every second bar at full escalation.
      if (this.layer >= 3 && s === 0 && bar % 2 === 1) {
        bell({ freq: midi(root + 36), gain: 0.03, ratio: 3.01, index: 1, decay: 3, bus: this.out, hall: 0.4 });
      }
      this.step++;
      this.next += sixteenth;
    }
  }

  sub(t, f, g) {
    const o = A.osc('sine', f);
    const og = A.gain();
    A.chain(o, og, this.out);
    A.env(og.gain, t, g, 0.008, 0.2);
    o.start(t); o.stop(t + 0.3);
  }

  drum(t, g) {
    const o = A.osc('sine', 120);
    const og = A.gain();
    A.chain(o, A.shaper(3), og, this.out);
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.18);
    A.env(og.gain, t, g, 0.003, 0.45);
    o.start(t); o.stop(t + 0.6);
    const n = A.noiseSource(A.noise, false);
    const ng = A.gain();
    A.chain(n, A.filter('lowpass', 1200), ng, this.out);
    A.env(ng.gain, t, g * 0.25, 0.002, 0.08);
    n.start(t); n.stop(t + 0.12);
  }

  pad(t, root, dur) {
    [root + 12, root + 19, root + 24, root + 27].forEach((n, i) => {
      [-7, 7].forEach((det) => {
        const o = A.osc('sawtooth', midi(n));
        o.detune.value = det;
        const g = A.gain();
        A.chain(o, g, this.padBus);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.022 / (i * 0.4 + 1), t + dur * 0.3);
        g.gain.linearRampToValueAtTime(0.0001, t + dur * 1.05);
        o.start(t); o.stop(t + dur * 1.1);
      });
    });
  }

  pluck(t, f, g) {
    const o = A.osc('triangle', f);
    const og = A.gain();
    A.chain(o, A.filter('lowpass', 2400), og, this.out);
    A.env(og.gain, t, g, 0.003, 0.28);
    o.start(t); o.stop(t + 0.35);
  }

  // Strip back to the pad; used on entering the chamber.
  thin(time = 2) {
    this.layer = 0;
    if (this.out) {
      this.out.gain.setTargetAtTime(0.35, A.now, time / 3);
    }
  }

  stop(fade = 2) {
    if (!this.running) return;
    this.running = false;
    this.timers.forEach(clearInterval);
    const t = A.now;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(Math.max(this.out.gain.value, 0.0001), t);
    this.out.gain.linearRampToValueAtTime(0.0001, t + fade);
  }
}

// A single restrained motif for the title — five notes, one for each of them.
export function titleMotif() {
  if (!A.ready) return;
  const notes = [[76, 0], [71, 1.1], [79, 2.0], [74, 3.3], [83, 4.9]];
  notes.forEach(([n, when], i) => {
    bell({ freq: midi(n), when, gain: i === 4 ? 0.06 : 0.045, ratio: 3.5, index: 0.9, decay: 5.5, bus: A.music, hall: 0.9 });
    bell({ freq: midi(n - 24), when, gain: 0.02, ratio: 1.0, index: 0.4, decay: 6, bus: A.music, hall: 0.6 });
  });
}

// A soft, tonal hum under the chamber discovery.
export class ChamberPad {
  start() {
    if (!A.ready || this.out) return;
    this.out = A.gain(0.0001);
    this.out.connect(A.music);
    this.out.gain.linearRampToValueAtTime(0.5, A.now + 3);
    const lp = A.filter('lowpass', 700, 0.6);
    lp.connect(this.out);
    this.oscs = [52, 59, 64, 71].map((n, i) => {
      const o = A.osc(i % 2 ? 'triangle' : 'sine', midi(n));
      const g = A.gain(0.05 / (i + 1));
      o.connect(g); g.connect(lp);
      o.start();
      return o;
    });
  }

  stop(fade = 0.05) {
    if (!this.out) return;
    const t = A.now;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(Math.max(this.out.gain.value, 0.0001), t);
    this.out.gain.linearRampToValueAtTime(0.0001, t + fade);
    this.oscs.forEach((o) => o.stop(t + fade + 0.05));
    this.out = null;
  }
}
