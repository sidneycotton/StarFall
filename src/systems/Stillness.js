import { audio } from '../audio/AudioEngine.js';
import { settings } from '../core/Settings.js';

// Wallflower's power. Let go of everything (walking, turning, buttons) and
// after a moment people stop being able to hold on to you: their eyes slide
// off. Move, and you are a person again.
//
// `value` runs 0 (an ordinary person) to 1 (gone from notice). The scene
// reports how much the body moved this frame; this does the rest: the screen
// edges settle, the world goes close and soft, and watchers stop seeing you.
//
// A watcher is anyone whose attention matters: a position, the way their head
// is turned (yaw: 0 looks along +z, like the camera), a cone and a range.

const SETTLE = 0.35;   // seconds of quiet before the fade begins
const FADE = 1.15;     // seconds from the start of the fade to gone
const RETURN = 0.18;   // seconds from gone back to a person

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export class Watcher {
  constructor({ id = '', x = 0, z = 0, yaw = 0, fov = 1.2, range = 12, on = true } = {}) {
    Object.assign(this, { id, x, z, yaw, fov, range, on });
  }

  // Is the point inside this watcher's cone?
  covers(x, z) {
    if (!this.on) return false;
    const dx = x - this.x;
    const dz = z - this.z;
    const d = Math.hypot(dx, dz);
    if (d > this.range) return false;
    if (d < 0.6) return true;
    return Math.abs(wrap(Math.atan2(dx, dz) - this.yaw)) < this.fov / 2;
  }

  // Turn the head toward a yaw, at most `rate` radians per second.
  turnToward(yaw, rate, dt) {
    const d = wrap(yaw - this.yaw);
    const step = Math.min(Math.abs(d), rate * dt);
    this.yaw = wrap(this.yaw + Math.sign(d) * step);
    return Math.abs(d) - step;
  }

  yawTo(x, z) {
    return Math.atan2(x - this.x, z - this.z);
  }
}

export class Stillness {
  constructor(scene, { fx, threshold = 0.6, audioOn = true } = {}) {
    this.scene = scene;
    this.fx = fx;
    this.value = 0;
    this.quiet = 0;
    this.threshold = threshold;
    this.watchers = [];
    this.enabled = true;
    this.audioOn = audioOn;
    this.forced = null;      // scripted override (cutscenes), or null
    this.moving = false;
    this.lastAudio = -1;
    scene.events.once('shutdown', () => this.reset());
  }

  watch(opts) {
    const w = opts instanceof Watcher ? opts : new Watcher(opts);
    this.watchers.push(w);
    return w;
  }

  unwatch(w) {
    this.watchers = this.watchers.filter((x) => x !== w);
  }

  // `motion` is how much the body did this frame: metres walked plus radians
  // turned (head turns count less), and whether a button is held.
  update(dt, { walked = 0, turned = 0, held = false } = {}) {
    const moving = held || walked / Math.max(dt, 1e-3) > 0.05 || turned / Math.max(dt, 1e-3) > 0.12;
    this.moving = moving;
    if (!this.enabled) {
      this.quiet = 0;
      this.value = Math.max(0, this.value - dt / RETURN);
    } else if (this.forced !== null) {
      this.value += (this.forced - this.value) * Math.min(1, dt * 3);
    } else if (moving) {
      this.quiet = 0;
      this.value = Math.max(0, this.value - dt / RETURN);
    } else {
      this.quiet += dt;
      if (this.quiet > SETTLE) this.value = Math.min(1, this.value + dt / FADE);
    }
    this.apply();
  }

  // Gone enough that eyes slide off.
  get hidden() {
    return this.value >= this.threshold;
  }

  // Seconds of quiet so far (for hints).
  get quietFor() {
    return this.quiet;
  }

  // The first watcher that can see the point, given how faded you are.
  isSeen(x, z) {
    if (this.hidden) return null;
    return this.watchers.find((w) => w.covers(x, z)) || null;
  }

  // The first watcher whose cone the point is in, regardless of stillness.
  inCone(x, z) {
    return this.watchers.find((w) => w.covers(x, z)) || null;
  }

  apply() {
    const v = this.value;
    const eased = v * v * (3 - 2 * v);
    const k = settings.get('reduceMotion') ? 0.7 : 1;
    if (this.fx) this.fx.p.still = eased * 0.85 * k;
    if (this.audioOn && Math.abs(eased - this.lastAudio) > 0.01) {
      this.lastAudio = eased;
      audio.setStill(eased);
    }
  }

  reset() {
    this.value = 0;
    if (this.fx) this.fx.p.still = 0;
    audio.setStill(0);
    this.lastAudio = 0;
  }
}
