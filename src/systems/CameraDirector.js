import Phaser from 'phaser';
import { settings } from '../core/Settings.js';
import { VIEW_W } from '../config.js';

// Cinematic side-on camera. In "follow" it leads ahead of the player, settles
// toward nearby points of interest and stays still when the player is still.
// "Shots" temporarily take control with eased framing, then hand back.

export class CameraDirector {
  constructor(scene, { minX = 0, maxX = 10000, y = 450 } = {}) {
    this.scene = scene;
    this.cam = scene.cameras.main;
    this.minX = minX;
    this.maxX = maxX;
    this.baseY = y;
    this.mode = 'shot';
    this.target = null;
    this.lead = 0;
    this.focus = null;     // { x, weight }
    this.lag = 0.05;
    this.leadAmount = 170;
    this.zoom = 1;
    this.followZoom = 1;
    this.shake = 0;
    this.drift = 0;
    this.cx = VIEW_W / 2;
    this.cy = y;
  }

  setBounds(minX, maxX) {
    this.minX = minX;
    this.maxX = maxX;
  }

  follow(target, { lag = 0.05, lead = 170, zoom = this.followZoom, blend = 1400 } = {}) {
    this.target = target;
    this.lag = lag;
    this.leadAmount = lead;
    this.followZoom = zoom;
    this.mode = 'follow';
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({ targets: this, zoom, cy: this.baseY, duration: blend, ease: 'Sine.easeInOut' });
  }

  // Keep two figures in frame (duels): centre between them, pull back as they part.
  pair(a, b, { zoom = 1.15, minZoom = 0.82, y = this.baseY, lag = 0.08, blend = 900 } = {}) {
    this.pairA = a;
    this.pairB = b;
    this.pairZoom = zoom;
    this.pairMin = minZoom;
    this.lag = lag;
    this.mode = 'pair';
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({ targets: this, cy: y, duration: blend, ease: 'Sine.easeInOut' });
  }

  // Frame a point. Returns a promise for the end of the move.
  shot(x, y, zoom = 1, duration = 1600, ease = 'Sine.easeInOut') {
    this.mode = 'shot';
    this.scene.tweens.killTweensOf(this);
    if (duration <= 0) {
      this.cx = x; this.cy = y; this.zoom = zoom;
      this.apply();
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.scene.tweens.add({ targets: this, cx: x, cy: y, zoom, duration, ease, onComplete: resolve });
    });
  }

  setFocus(x, weight = 0.35) {
    this.focus = x == null ? null : { x, weight };
  }

  kick(amount = 8) {
    if (settings.get('reduceMotion')) return;
    this.shake = Math.max(this.shake, amount);
  }

  update(dt) {
    if (this.mode === 'follow' && this.target) {
      const vx = this.target.vx || 0;
      const wantLead = Phaser.Math.Clamp(vx * 0.45, -this.leadAmount, this.leadAmount);
      this.lead += (wantLead - this.lead) * Math.min(1, dt * 1.6);
      let tx = this.target.x + this.lead;
      if (this.focus) tx = Phaser.Math.Linear(tx, this.focus.x, this.focus.weight);
      const k = 1 - Math.pow(1 - this.lag, dt * 60);
      this.cx += (tx - this.cx) * k;
    }
    if (this.mode === 'pair' && this.pairA && this.pairB) {
      const k = 1 - Math.pow(1 - this.lag, dt * 60);
      const mid = (this.pairA.x + this.pairB.x) / 2;
      const gap = Math.abs(this.pairA.x - this.pairB.x);
      const want = Phaser.Math.Clamp((this.cam.width * 0.62) / Math.max(gap + 360, 1), this.pairMin, this.pairZoom);
      this.cx += (mid - this.cx) * k;
      this.zoom += (want - this.zoom) * k * 0.6;
    }
    this.drift += dt;
    this.apply();
  }

  apply() {
    const cam = this.cam;
    const z = this.zoom;
    cam.setZoom(z);
    const halfW = cam.width / (2 * z);
    const minX = this.minX + halfW;
    const maxX = this.maxX - halfW;
    let x = minX > maxX ? (this.minX + this.maxX) / 2 : Phaser.Math.Clamp(this.cx, minX, maxX);
    let y = this.cy;
    // Breathing handheld drift — tiny, and absent under reduced motion.
    if (!settings.get('reduceMotion')) {
      x += Math.sin(this.drift * 0.31) * 1.6;
      y += Math.sin(this.drift * 0.23 + 1) * 1.2;
    }
    if (this.shake > 0.1) {
      x += (Math.random() - 0.5) * this.shake;
      y += (Math.random() - 0.5) * this.shake;
      this.shake *= 0.86;
    }
    cam.centerOn(x, y);
  }

  // Convert a world point (on a layer with scrollFactor sf) to design-space screen px.
  toScreen(wx, wy, sf = 1) {
    const cam = this.cam;
    const z = cam.zoom;
    const sx = (wx - cam.scrollX * sf - cam.width / 2) * z + cam.width / 2;
    const sy = (wy - cam.scrollY * sf - cam.height / 2) * z + cam.height / 2;
    return { x: sx, y: sy };
  }
}
