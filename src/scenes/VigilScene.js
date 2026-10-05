import Phaser from 'phaser';
import { VIEW_W, VIEW_H } from '../config.js';
import { ui } from '../ui/UI.js';
import { narrative } from '../core/NarrativeState.js';
import { input } from '../systems/Input.js';
import { audio } from '../audio/AudioEngine.js';
import { sound } from '../audio/soundscape.js';
import { elegy } from '../audio/Music.js';
import * as sfx from '../audio/sfx.js';
import { ScreenFX } from '../fx/ScreenFX.js';
import { CameraDirector } from '../systems/CameraDirector.js';
import { wait } from '../systems/Cutscene.js';
import { addPainted, rng } from '../art/paint.js';
import { VIGIL_W } from '../art/vigil.js';
import { VIGIL, theNames } from '../data/record.js';

// Vesper Plaza, seven years after the Starfall. The player is nobody in
// particular: a slow drift through the crowd toward the civic screen.
// On the way out (data.end) the same plaza watches the Record finish.

const ADD = Phaser.BlendModes.ADD;
const GROUND = 760;
const SCREEN = { x: 2180, y: 300, w: 900, h: 520 };

export class VigilScene extends Phaser.Scene {
  constructor() {
    super('Vigil');
  }

  create(data = {}) {
    this.ending = Boolean(data.end);
    narrative.setStage(this.ending ? 'vigilEnd' : 'vigil');
    this.fx = new ScreenFX(this);
    this.fx.set({ fade: 1, grain: 0.06, aberration: 0.35, vignette: 0.55, desat: 0.05 });
    this.cameraDir = new CameraDirector(this, { minX: 0, maxX: VIGIL_W, y: 450 });
    this.view = { x: 380, vx: 0 };
    this.buildPlaza();
    this.buildScreen();
    this.run();
  }

  buildPlaza() {
    const sky = addPainted(this, VIEW_W / 2, VIEW_H / 2, 'vg_sky').setScrollFactor(0).setDepth(0);
    sky.setDisplaySize(VIEW_W * 1.5, VIEW_H * 1.5);
    addPainted(this, -200, 80, 'vg_city', 0, 0).setScrollFactor(0.3).setDepth(1);
    // The statue, floodlit from below; she towers over the screen.
    this.add.image(1260, GROUND - 60, 'light_cone').setOrigin(0.5, 1).setScale(3.4, 1.6).setFlipY(true).setBlendMode(ADD).setTint(0xe2bc72).setAlpha(0.12).setScrollFactor(0.55).setDepth(2);
    this.statue = this.add.image(1260, GROUND + 20, 'vg_statue').setOrigin(0.5, 1).setScrollFactor(0.55).setDepth(3).setScale(0.95);
    this.floor = this.add.tileSprite(-400, GROUND - 40, VIGIL_W + 1200, 260, 'vg_floor').setOrigin(0, 0).setDepth(6);

    // Three rows of mourners: far, middle, and silhouettes close to the lens.
    const r = rng(23);
    this.candles = [];
    this.people = [];
    const row = (y, n, scale, sf, depth, tint, spread) => {
      for (let i = 0; i < n; i++) {
        const x = -100 + (i / n) * (VIGIL_W + 300) + (r() - 0.5) * spread;
        const v = Math.floor(r() * 6);
        const key = r() < 0.06 ? 'vg_child' : `vg_mourner${v}`;
        const p = this.add.image(x, y + (r() - 0.5) * 10, key).setOrigin(0.5, 1).setScale(scale * (0.92 + r() * 0.16)).setScrollFactor(sf).setDepth(depth).setTint(tint);
        p.setFlipX(r() < 0.5);
        this.people.push(p);
        if (v !== 5 && tint !== 0x050308) {
          const c = this.add.image(x + 6 * scale * (p.flipX ? -1 : 1), p.y - p.displayHeight * 0.62, 'light_soft').setScale(0.22 * scale).setBlendMode(ADD).setTint(0xffbe70).setAlpha(0.5).setScrollFactor(sf).setDepth(depth + 0.5);
          c.seed = r() * 10;
          this.candles.push(c);
        }
      }
    };
    row(GROUND - 20, 70, 0.8, 0.95, 8, 0x8a8090, 30);
    row(GROUND + 30, 46, 1.05, 1, 12, 0xc8c0c8, 50);
    row(VIEW_H + 160, 16, 2.6, 1.3, 40, 0x050308, 80);
    // Ground glow from all those candles.
    this.add.image(VIGIL_W / 2, GROUND + 10, 'light_soft').setScale(VIGIL_W / 140, 0.6).setBlendMode(ADD).setTint(0xffa860).setAlpha(0.18).setDepth(7);
    this.embers = this.add.particles(0, 0, 'mote', {
      x: { min: 0, max: VIGIL_W }, y: { min: GROUND - 60, max: GROUND + 40 },
      speedY: { min: -30, max: -10 }, speedX: { min: -6, max: 6 },
      lifespan: 5000, scale: { start: 0.25, end: 0 }, alpha: { start: 0.6, end: 0 },
      tint: 0xffc880, blendMode: 'ADD', frequency: 140,
    }).setDepth(14);
  }

  buildScreen() {
    const { x, y } = SCREEN;
    this.screenGlow = this.add.image(x, y, 'light_soft').setScale(8, 5).setBlendMode(ADD).setTint(0x8fb7bf).setAlpha(0).setScrollFactor(0.8).setDepth(4);
    this.screen = this.add.container(x, y).setScrollFactor(0.8).setDepth(5).setScale(0.62);
    const frame = this.add.image(0, 0, 'vg_screen');
    this.screenBody = this.add.container(0, 0);
    this.screen.add([frame, this.screenBody]);
    const mask = this.make.graphics({ add: false });
    this.screenMask = mask;
    this.screenBody.setMask(mask.createGeometryMask());
    this.updateMask();
    this.add.rectangle(x, y + SCREEN.h * 0.31 + 120, 22, 240, 0x0a080c).setScrollFactor(0.8).setDepth(4);
  }

  // The mask lives in the screen's own layer so it tracks the camera with it.
  updateMask() {
    const s = this.screen.scale;
    const w = (SCREEN.w - 36) * s;
    const h = (SCREEN.h - 36) * s;
    this.screenMask.setScrollFactor(0.8);
    this.screenMask.clear().fillStyle(0xffffff).fillRect(SCREEN.x - w / 2, SCREEN.y - h / 2, w, h);
  }

  screenText(lines, { color = '#cfe2e6', size = 34, font = 'Jost', spacing = 16, letter = 6 } = {}) {
    this.screenBody.removeAll(true);
    const texts = lines.map((l, i) => this.add.text(0, (i - (lines.length - 1) / 2) * (size + spacing) * (i === 0 ? 1 : 1), l, {
      fontFamily: font, fontSize: `${i === 0 ? size : Math.round(size * 0.55)}px`, color, letterSpacing: i === 0 ? letter : 2, align: 'center',
    }).setOrigin(0.5).setAlpha(0));
    this.screenBody.add(texts);
    return texts;
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    if (this.walking) {
      const ax = input.axis();
      if (ax) this.idle = 0; else this.idle += dt;
      const want = ax ? ax * 190 : (this.idle > 5 ? 70 : 0);
      this.view.vx += (want - this.view.vx) * Math.min(1, dt * 3);
      this.view.x = Phaser.Math.Clamp(this.view.x + this.view.vx * dt, 300, VIGIL_W);
      this.barks.forEach((b) => {
        if (!b.done && this.view.x > b.x - 60) {
          b.done = true;
          ui.bark(b.text, { ms: 5200 });
        }
      });
    }
    const t = time / 1000;
    this.candles.forEach((c) => { c.alpha = 0.42 + Math.sin(t * 7 + c.seed) * 0.06 + Math.sin(t * 13.3 + c.seed * 2) * 0.04; });
    this.cameraDir.update(dt);
    this.stageUpdate?.(dt);
  }

  async run() {
    ui.letterbox(false);
    ui.showHud(false);
    sound.vigil.start({ fadeIn: 3 });
    if (this.ending) { this.runEnd(); return; }
    narrative.beginChapterTwo();
    this.cameraDir.shot(this.view.x, 450, 1.0, 0);
    await this.fx.fadeTo(0, 3000);
    ui.hint(VIGIL.place, 4200);
    await wait(this, 4600);
    // The walk: the camera drifts with the crowd toward the screen.
    this.barks = VIGIL.barks.map((b) => ({ ...b }));
    this.walking = true;
    this.idle = 0;
    ui.touch.setMovement(true);
    ui.hint(`${VIGIL.hint} · ◀ ▶`, 5000);
    this.cameraDir.follow(this.view, { lag: 0.06, lead: 0, zoom: 1, blend: 600 });
    await new Promise((resolve) => {
      this.stageUpdate = () => { if (this.view.x >= 2240) { this.stageUpdate = null; resolve(); } };
    });
    this.walking = false;
    ui.touch.setMovement(false);
    ui.hint('');
    sound.vigil.hush(0.25, 2);

    // The screen wakes. Everyone looks the same way.
    this.cameraDir.shot(SCREEN.x * 0.8 + 380, 360, 1.12, 3800);
    await wait(this, 1200);
    sfx.screenWake({ pan: 0.2 });
    this.tweens.add({ targets: this.screenGlow, alpha: 0.28, duration: 900 });
    const t = this.screenText(VIGIL.screen);
    for (const line of t) {
      this.tweens.add({ targets: line, alpha: 1, duration: 900 });
      await wait(this, 1700);
    }
    await wait(this, 1800);
    await ui.chapterCard('Chapter Two', 'The Starfall Record', 4800);
    this.fx.tween({ fade: 1 }, 1400);
    sound.vigil.stop(2);
    await wait(this, 1600);
    this.scene.start('Record', {});
  }

  // The Record ends where it began: the names, a child's question, and then
  // the broadcast cut by something in the sky.
  async runEnd() {
    narrative.setStage('vigilEnd');
    this.view.x = 2240;
    this.cameraDir.shot(SCREEN.x * 0.8 + 380, 360, 1.12, 0);
    sound.vigil.hush(0.25, 0.1);
    this.screenGlow.setAlpha(0.28);
    // The names, in four columns, rising slowly.
    this.screenBody.removeAll(true);
    const names = theNames(311);
    const cols = 4;
    const per = Math.ceil(names.length / cols);
    const head = this.add.text(0, -200, '311', { fontFamily: 'Cormorant Garamond', fontSize: '44px', color: '#e8dcc0' }).setOrigin(0.5);
    const scroll = this.add.container(0, 260);
    for (let c = 0; c < cols; c++) {
      const txt = this.add.text(-330 + c * 220, 0, names.slice(c * per, (c + 1) * per).join('\n'), {
        fontFamily: 'Jost', fontSize: '17px', color: '#b8c8cc', lineSpacing: 10, align: 'center',
      }).setOrigin(0.5, 0);
      scroll.add(txt);
    }
    this.screenBody.add([scroll, head]);
    await this.fx.fadeTo(0, 2600);
    elegy();
    this.tweens.add({ targets: scroll, y: -per * 37 - 200, duration: 52000, ease: 'Linear' });
    this.tweens.add({ targets: head, alpha: 0, duration: 3000, delay: 4000 });
    await wait(this, 9000);
    // Pull back a little: the crowd, the statue, the screen.
    this.cameraDir.shot(SCREEN.x * 0.8 + 120, 420, 1.0, 9000);
    await wait(this, 7000);
    await ui.dialogue.play(VIGIL.close);
    await wait(this, 3200);

    // The broadcast cuts out.
    sfx.glitch({ gain: 0.5 });
    this.screenBody.removeAll(true);
    this.tweens.killTweensOf(scroll);
    const card = this.screenText([VIGIL.interrupt, VIGIL.interruptSub], { color: '#e6eaec', size: 30, letter: 4 });
    card.forEach((c) => c.setAlpha(1));
    this.screenGlow.setTint(0xe6eaec);
    sound.vigil.hush(0.6, 0.4);
    await wait(this, 2600);
    // People look up. Phones come out, one after another.
    const phones = [];
    const rr = rng(4);
    for (let i = 0; i < 46; i++) {
      this.time.delayedCall(rr() * 3600, () => {
        const p = this.people[Math.floor(rr() * this.people.length)];
        if (!p || p.scrollFactorX > 1.1) return;
        const ph = this.add.image(p.x + (rr() - 0.5) * 10, p.y - p.displayHeight * 0.95, 'pixel').setDisplaySize(5, 9).setTint(0xdfeaff).setScrollFactor(p.scrollFactorX).setDepth(p.depth + 1);
        const g = this.add.image(ph.x, ph.y, 'light_soft').setScale(0.12).setBlendMode(ADD).setTint(0xcfe0ff).setAlpha(0.5).setScrollFactor(p.scrollFactorX).setDepth(p.depth + 1);
        phones.push(ph, g);
      });
    }
    let m = 0;
    this.time.addEvent({ delay: 1500, repeat: VIGIL.murmurs.length - 1, callback: () => ui.bark(VIGIL.murmurs[m++], { ms: 2400 }) });
    // Tilt up: something new in the sky, low and steady, where no star should be.
    const point = this.add.image(1040, 120, 'light_core').setBlendMode(ADD).setTint(0xf2f0e0).setScale(0.05).setAlpha(0).setScrollFactor(0).setDepth(1);
    const ring = this.add.image(1040, 120, 'st_halo').setBlendMode(ADD).setTint(0xd8e8c8).setScale(0.12, 0.07).setAlpha(0).setScrollFactor(0).setDepth(1);
    this.cameraDir.shot(SCREEN.x * 0.8, 260, 0.96, 5000);
    this.tweens.add({ targets: point, alpha: 1, scale: 0.16, duration: 6000, ease: 'Sine.easeIn' });
    this.tweens.add({ targets: ring, alpha: 0.4, duration: 7000, ease: 'Sine.easeIn' });
    this.tweens.add({ targets: ring, angle: 360, duration: 30000, repeat: -1 });
    await wait(this, 7600);
    sound.vigil.stop(0.6);
    this.fx.set({ fade: 1 });
    audio.cutWorld(0.02);
    await wait(this, 1200);
    this.scene.start('Title', { chapter: 2 });
  }
}
