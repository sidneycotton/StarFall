import Phaser from 'phaser';

// One channel of the Triune interface: a container of painted layers seen
// through a shaped aperture (circle, ruled rectangle, eclipse) that can open,
// fail and close. Shapes come from each house's visual language.

export class Feed {
  constructor(scene, { x, y, shape, w = 0, h = 0, r = 0, depth = 10 }) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.shape = shape;
    this.w = w;
    this.h = h;
    this.r = r;
    this.open = 0; // 0 closed … 1 open
    this.content = scene.add.container(x, y).setDepth(depth);
    this.maskG = scene.make.graphics({ x: 0, y: 0, add: false });
    this.content.setMask(this.maskG.createGeometryMask());
    this.overlays = scene.add.container(x, y).setDepth(depth + 1);
    this.overlays.setMask(this.content.mask);

    const size = shape === 'rect' ? [w, h] : [r * 2, r * 2];
    this.scan = scene.add.tileSprite(0, 0, size[0], size[1], 'scanlines').setAlpha(0.22);
    this.noise = scene.add.tileSprite(0, 0, size[0], size[1], 'static').setAlpha(0).setBlendMode(Phaser.BlendModes.SCREEN);
    this.white = scene.add.rectangle(0, 0, size[0] + 40, size[1] + 40, 0xffffff, 0);
    this.overlays.add([this.scan, this.noise, this.white]);
    this.drawMask();
  }

  add(...objs) {
    this.content.add(objs);
    return objs[0];
  }

  drawMask() {
    const g = this.maskG;
    g.clear();
    g.fillStyle(0xffffff);
    const k = this.open;
    if (k <= 0.001) return;
    const cx = this.content.x;
    const cy = this.content.y;
    if (this.shape === 'rect') {
      // Unfolds from a horizontal line, like a ledger opening.
      const hh = Math.max(1, this.h * k);
      g.fillRect(cx - this.w / 2, cy - hh / 2, this.w, hh);
    } else {
      g.fillCircle(cx, cy, Math.max(0.5, this.r * k));
    }
  }

  setOpen(k) {
    this.open = k;
    this.drawMask();
  }

  tweenOpen(to, duration = 1200, ease = 'Cubic.easeInOut') {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this, open: to, duration, ease,
        onUpdate: () => this.drawMask(),
        onComplete: resolve,
      });
    });
  }

  // Jitter the whole channel (signal tearing).
  jolt(dx = 16, rot = 0.04) {
    this.content.x = this.x + dx;
    this.content.rotation = rot;
    this.overlays.x = this.content.x;
    this.overlays.rotation = rot;
    this.drawMask();
  }

  settle() {
    this.content.x = this.x;
    this.content.rotation = 0;
    this.overlays.x = this.x;
    this.overlays.rotation = 0;
    this.drawMask();
  }

  update(time) {
    this.scan.tilePositionY = (time / 40) % 4;
    if (this.noise.alpha > 0) {
      this.noise.tilePositionX = Math.random() * 256;
      this.noise.tilePositionY = Math.random() * 256;
    }
  }
}
