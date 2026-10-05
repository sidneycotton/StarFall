import Phaser from 'phaser';
import { CinematicPipeline, FX_DEFAULTS } from './CinematicPipeline.js';
import { settings } from '../core/Settings.js';
import { VIEW_W, VIEW_H } from '../config.js';

// Per-scene handle on the camera's film pass. Scenes tween named parameters;
// on the Canvas renderer (no shaders) we fall back to a plain fade overlay so
// the sequence still reads.

export class ScreenFX {
  constructor(scene, camera = scene.cameras.main) {
    this.scene = scene;
    this.camera = camera;
    this.webgl = scene.game.renderer.type === Phaser.WEBGL;
    if (this.webgl) {
      camera.setPostPipeline(CinematicPipeline);
      const pipe = camera.getPostPipeline(CinematicPipeline);
      this.pipe = Array.isArray(pipe) ? pipe[0] : pipe;
      this.p = this.pipe.params;
    } else {
      this.p = { ...FX_DEFAULTS };
      this.fallback = scene.add.rectangle(VIEW_W / 2, VIEW_H / 2, VIEW_W * 3, VIEW_H * 3, 0x000000, 0).setScrollFactor(0).setDepth(10000);
      scene.events.on('update', () => {
        this.fallback.setAlpha(Math.max(this.p.fade, 0));
        this.fallback.setFillStyle(this.p.flash > this.p.fade ? 0xffffff : 0x000000, 1);
        if (this.p.flash > this.p.fade) this.fallback.setAlpha(this.p.flash);
      });
    }
    this.applyMotion();
  }

  applyMotion() {
    if (settings.get('reduceMotion')) {
      this.motionScale = 0.35;
    } else {
      this.motionScale = 1;
    }
  }

  set(values) {
    Object.assign(this.p, values);
    return this;
  }

  tween(values, duration = 1000, ease = 'Sine.easeInOut', delay = 0) {
    return new Promise((resolve) => {
      this.scene.tweens.add({ targets: this.p, ...values, duration, ease, delay, onComplete: resolve });
    });
  }

  fadeTo(fade, duration = 1000, ease = 'Sine.easeInOut') {
    this.scene.tweens.killTweensOf(this.p, ['fade']);
    return this.tween({ fade }, duration, ease);
  }

  flash({ r = 1, g = 1, b = 1, peak = 1, attack = 30, release = 600 } = {}) {
    const reduce = settings.get('reduceMotion');
    Object.assign(this.p, { flashR: r, flashG: g, flashB: b });
    this.scene.tweens.killTweensOf(this.p, ['flash']);
    const top = reduce ? Math.min(peak, 0.45) : peak;
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.p, flash: top, duration: reduce ? attack + 120 : attack, ease: 'Quad.easeOut',
        onComplete: () => this.scene.tweens.add({ targets: this.p, flash: 0, duration: release, ease: 'Sine.easeOut', onComplete: resolve }),
      });
    });
  }
}
