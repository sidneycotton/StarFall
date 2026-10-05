import Phaser from 'phaser';
import { input } from '../systems/Input.js';
import { footstep } from '../audio/sfx.js';

// Turns input into Parallax's motion. Two temperaments:
//   tired   — slower top speed, soft acceleration, a faint unevenness.
//   precise — immediate, exact; with `run` it becomes a sprint.
// Never sluggish enough to be irritating: input always gets a response within
// a couple of frames.

const PROFILES = {
  tired: { speed: 150, accel: 520, decel: 900 },
  precise: { speed: 220, accel: 1600, decel: 2200 },
  run: { speed: 400, accel: 1500, decel: 2000 },
};

export class PlayerController {
  constructor(scene, rig, { minX = 0, maxX = 10000 } = {}) {
    this.scene = scene;
    this.rig = rig;
    this.minX = minX;
    this.maxX = maxX;
    this.profile = 'tired';
    this.enabled = false;
    this.speedScale = 1;
    this.autoTarget = null;
    this.time = 0;
    rig.stepCallback = (kind) => footstep({ kind, gain: kind === 'soft' ? 0.8 : 1 });
  }

  setProfile(name) {
    this.profile = name;
  }

  setBounds(minX, maxX) {
    this.minX = minX;
    this.maxX = maxX;
  }

  // Scripted walk to x. Resolves on arrival.
  walkTo(x, { speed } = {}) {
    return new Promise((resolve) => {
      this.autoTarget = { x, speed, resolve };
    });
  }

  update(dt) {
    this.time += dt;
    const rig = this.rig;
    const prof = PROFILES[this.profile];
    let want = 0;
    let topSpeed = prof.speed * this.speedScale;

    if (this.autoTarget) {
      const dx = this.autoTarget.x - rig.x;
      if (Math.abs(dx) < 4) {
        rig.x = this.autoTarget.x;
        rig.vx = 0;
        const r = this.autoTarget.resolve;
        this.autoTarget = null;
        r();
      } else {
        want = Math.sign(dx);
        if (this.autoTarget.speed) topSpeed = this.autoTarget.speed;
        // Ease in to the mark rather than skidding.
        topSpeed = Math.min(topSpeed, Math.abs(dx) * 3 + 30);
      }
    } else if (this.enabled) {
      want = input.axis();
    }

    // Hangover: speed wavers slightly, like attention drifting.
    if (this.profile === 'tired') topSpeed *= 0.92 + Math.sin(this.time * 1.3) * 0.08;

    const target = want * topSpeed;
    const rate = Math.abs(target) > Math.abs(rig.vx) ? prof.accel : prof.decel;
    rig.vx = approach(rig.vx, target, rate * dt);
    let nx = rig.x + rig.vx * dt;
    if (!this.autoTarget) nx = Phaser.Math.Clamp(nx, this.minX, this.maxX);
    if ((nx <= this.minX || nx >= this.maxX) && !this.autoTarget) rig.vx = 0;
    rig.x = nx;
    if (want !== 0) rig.face(want > 0 ? 1 : -1);
  }
}

function approach(v, target, step) {
  if (v < target) return Math.min(v + step, target);
  return Math.max(v - step, target);
}
