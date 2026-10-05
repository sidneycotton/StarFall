import Phaser from 'phaser';
import { VIEW_W, VIEW_H } from '../config.js';
import { ui } from '../ui/UI.js';
import { narrative } from '../core/NarrativeState.js';
import { settings } from '../core/Settings.js';
import { audio } from '../audio/AudioEngine.js';
import { sound } from '../audio/soundscape.js';
import * as sfx from '../audio/sfx.js';
import { ScreenFX } from '../fx/ScreenFX.js';
import { wait, tween } from '../systems/Cutscene.js';
import { addPainted } from '../art/paint.js';
import { Feed } from './call/Feed.js';
import { CALL, CAPTIONS } from '../data/script.js';

// The Triune: video conferencing descended from ritual. Three apertures in a
// triangle — Providence upper-left, Continuance upper-right, Ruin below.

const ADD = Phaser.BlendModes.ADD;
const POS = {
  a: { x: 430, y: 285 },
  b: { x: 1170, y: 285 },
  c: { x: 800, y: 560 },
};

export class SeerCallScene extends Phaser.Scene {
  constructor() {
    super('SeerCall');
  }

  create() {
    this.fx = new ScreenFX(this);
    this.fx.set({ fade: 1, grain: 0.08, aberration: 0.7, vignette: 0.85 });
    this.cam = this.cameras.main;
    this.cam.setBackgroundColor('#000000');
    this.cam.setZoom(1.14);
    this.t = 0;
    this.tremble = 0.25;     // Candlemas
    this.eyeA = { x: -4, y: 4 };
    this.eyeB = { x: 0, y: 0 };
    this.lineK = { ca: 0, cb: 0, ab: 0, fadeA: 1, fadeAB: 1, fadeBC: 1 };
    this.visorLevel = 1;
    this.candleAlive = true;

    this.buildBackdrop();
    this.buildCandlemas();
    this.buildAlmanac();
    this.buildParallax();
    this.buildVisionLayer();
    this.run();
  }

  // ------------------------------------------------------------------ build
  buildBackdrop() {
    const add = (x, y, tint, s, a) => this.add.image(x, y, 'light_soft').setTint(tint).setScale(s).setAlpha(a).setBlendMode(ADD).setDepth(1);
    this.glowA = add(POS.a.x, POS.a.y, 0xd9b46a, 4.2, 0.0);
    this.glowB = add(POS.b.x, POS.b.y, 0x8fb7bf, 4.0, 0.0);
    this.glowC = add(POS.c.x, POS.c.y, 0x7b4bc4, 4.0, 0.0);
    this.lines = this.add.graphics().setDepth(2);
    // The convergence mark at the triangle's centre.
    const cx = (POS.a.x + POS.b.x + POS.c.x) / 3;
    const cy = (POS.a.y + POS.b.y + POS.c.y) / 3;
    this.centroid = { x: cx, y: cy };
    this.mark = this.add.image(cx, cy, 'eclipse_ring').setScale(0.12).setAlpha(0).setDepth(3);
  }

  buildCandlemas() {
    const f = new Feed(this, { ...POS.a, shape: 'circle', r: 205, depth: 10 });
    this.A = f;
    const bg = f.add(addPainted(this, 0, 0, 'cand_bg'));
    const halo = f.add(this.add.image(0, -66, 'cand_halo').setScale(0.95).setBlendMode(ADD).setAlpha(0.8));
    const head = f.add(this.add.image(0, -170, 'cand_head').setOrigin(0.5, 0));
    const body = f.add(this.add.image(0, 58, 'cand_body').setOrigin(0.5, 0));
    const irisL = f.add(this.add.image(-30, -60, 'cand_iris').setScale(0.9));
    const irisR = f.add(this.add.image(30, -60, 'cand_iris').setScale(0.9));
    const lidL = f.add(this.add.image(-30, -62, 'cand_lid').setScale(0.9, 0).setOrigin(0.5, 0.4));
    const lidR = f.add(this.add.image(30, -62, 'cand_lid').setScale(0.9, 0).setOrigin(0.5, 0.4));
    const hands = f.add(this.add.image(0, 172, 'cand_hands'));
    const gun = f.add(this.add.image(120, 330, 'cand_gun').setFlipX(true).setOrigin(0.4, 0.6).setRotation(0.25));
    this.cand = { bg, halo, head, body, irisL, irisR, lidL, lidR, hands, gun, sweat: [] };
    this.candFrame = this.add.image(POS.a.x, POS.a.y, 'frame_aureate').setDepth(12).setAlpha(0);
    this.nextBlinkA = 2;
    this.nextSweat = 1.5;
  }

  buildAlmanac() {
    const f = new Feed(this, { ...POS.b, shape: 'rect', w: 330, h: 420, depth: 10 });
    this.B = f;
    const bg = f.add(addPainted(this, 0, 0, 'alm_bg'));
    const body = f.add(this.add.image(0, 40, 'alm_body').setOrigin(0.5, 0));
    const head = f.add(this.add.image(0, -200, 'alm_head').setOrigin(0.5, 0));
    const irisL = f.add(this.add.image(-26, -79, 'alm_iris'));
    const irisR = f.add(this.add.image(26, -79, 'alm_iris'));
    const lidL = f.add(this.add.image(-26, -81, 'alm_lid').setScale(1, 0).setOrigin(0.5, 0.4));
    const lidR = f.add(this.add.image(26, -81, 'alm_lid').setScale(1, 0).setOrigin(0.5, 0.4));
    this.alm = { bg, body, head, irisL, irisR, lidL, lidR };
    this.almFrame = this.add.image(POS.b.x, POS.b.y, 'frame_meridian').setDepth(12).setAlpha(0);
    this.nextBlinkB = 3;
  }

  buildParallax() {
    const f = new Feed(this, { ...POS.c, shape: 'circle', r: 140, depth: 10 });
    this.C = f;
    f.add(this.add.image(0, 0, 'light_soft').setTint(0x2a1640).setScale(2.4));
    const ring = f.add(this.add.image(0, -46, 'eclipse_ring').setScale(0.95).setAlpha(0.9));
    const body = f.add(this.add.image(0, 24, 'px_front').setScale(0.68));
    const visor = f.add(this.add.image(0, -24, 'px_front_visor').setScale(0.6, 0.6).setBlendMode(ADD).setTint(0xcbb2ff));
    this.px = { ring, body, visor };
    this.pxFrame = this.add.image(POS.c.x, POS.c.y, 'frame_umbral').setScale(0.92).setDepth(12).setAlpha(0);
  }

  buildVisionLayer() {
    this.vision = {};
    ['v_sun', 'v_city', 'v_beneath', 'v_five', 'v_cape', 'v_ring', 'v_scales', 'v_night'].forEach((k) => {
      this.vision[k] = addPainted(this, VIEW_W / 2, VIEW_H / 2, k).setDepth(100).setVisible(false).setScrollFactor(0);
    });
    this.ridge = addPainted(this, 0, 600, 'v_ridge', 0.5, 1).setDepth(101).setVisible(false).setScrollFactor(0);
    this.star = this.add.image(VIEW_W * 0.62, 260, 'light_core').setScale(0.35).setBlendMode(ADD).setDepth(101).setVisible(false).setScrollFactor(0);
    this.starHalo = this.add.image(VIEW_W * 0.62, 260, 'light_soft').setScale(0.6).setBlendMode(ADD).setTint(0xe8e0ff).setDepth(101).setVisible(false).setScrollFactor(0);
  }

  // ------------------------------------------------------------------ helpers
  say(line) {
    if (!this.sys.isActive()) return new Promise(() => {});
    return ui.dialogue.play([line]);
  }

  // A fragment of the vision, cut in hard over the interface.
  async flash(key, ms, { ridge = false, star = false, surge = 1 } = {}) {
    const reduce = settings.get('reduceMotion');
    const img = this.vision[key];
    img.setVisible(true).setAlpha(reduce ? 0 : 1);
    if (reduce) this.tweens.add({ targets: img, alpha: 0.85, duration: 140 });
    sound.vision.surge(surge, 0.08);
    sfx.lowImpact({ gain: 0.18 * surge, freq: 36 });
    this.fx.set({ aberration: 2.2 });
    if (ridge) {
      this.ridge.setVisible(true).setPosition(-400, 640);
      this.tweens.add({ targets: this.ridge, x: 1900, duration: ms * 1.4, ease: 'Sine.easeInOut' });
    }
    if (star) {
      this.star.setVisible(true).setAlpha(1);
      this.starHalo.setVisible(true).setAlpha(0.5);
      this.tweens.add({ targets: [this.star, this.starHalo], alpha: 0, duration: 260, delay: ms * 0.55, ease: 'Expo.easeIn' });
    }
    await wait(this, ms);
    img.setVisible(false);
    this.ridge.setVisible(false);
    this.star.setVisible(false);
    this.starHalo.setVisible(false);
    this.fx.set({ aberration: 0.7 });
    sound.vision.settle(0.6);
  }

  // ------------------------------------------------------------------ the call
  async run() {
    narrative.setStage('call');
    ui.letterbox(false);
    sound.vision.start({ gain: 0.25, fadeIn: 3 });
    sound.vision.settle(0.1);
    if (!sound.alarm.running) sound.alarm.start({ fadeIn: 1 });
    sound.alarm.setProximity(1);
    if (!sound.callTone.running) sound.callTone.start({ gain: 0.5, fadeIn: 2 });
    audio.setHelmet(true, 0.05);

    await this.fx.fadeTo(0, 1600);

    // The ritual: lines drawn from Ruin to the others, then the apertures open.
    tween(this, { targets: this.lineK, ca: 1, cb: 1, duration: 1800, ease: 'Sine.easeInOut' });
    tween(this, { targets: this.mark, alpha: 0.6, duration: 2400 });
    await wait(this, 900);
    sfx.channelOpen('umbral');
    this.tweens.add({ targets: this.glowC, alpha: 0.07, duration: 2000 });
    this.tweens.add({ targets: this.pxFrame, alpha: 1, duration: 1500 });
    await this.C.tweenOpen(1, 1500);
    await wait(this, 500);
    tween(this, { targets: this.lineK, ab: 1, duration: 1600 });
    sfx.channelOpen('aureate');
    this.A.noise.setAlpha(0.6);
    this.tweens.add({ targets: this.A.noise, alpha: 0, duration: 1600, delay: 600 });
    this.tweens.add({ targets: this.glowA, alpha: 0.1, duration: 2000 });
    this.tweens.add({ targets: this.candFrame, alpha: 1, duration: 1400 });
    await this.A.tweenOpen(1, 1500);
    await wait(this, 300);
    sfx.channelOpen('meridian');
    this.B.noise.setAlpha(0.5);
    this.tweens.add({ targets: this.B.noise, alpha: 0, duration: 1200, delay: 400 });
    this.tweens.add({ targets: this.glowB, alpha: 0.08, duration: 2000 });
    this.tweens.add({ targets: this.almFrame, alpha: 1, duration: 1400 });
    await this.B.tweenOpen(1, 1300);
    await wait(this, 2400);

    // Parallax opens. Ruin speaks first.
    await this.say(CALL.open1);
    this.flash('v_sun', 260, { surge: 0.6 });
    await wait(this, 1300);
    await this.say(CALL.open2);
    await this.flash('v_sun', 900);
    await this.flash('v_beneath', 1100, { ridge: true });
    await wait(this, 900);
    await this.say(CALL.almanacRuin);
    await wait(this, 500);

    this.lookC('b');
    await this.say(CALL.toAlmanac);
    this.lookC('a');
    await wait(this, 400);
    await this.say(CALL.toCandlemas1);
    await wait(this, 700);
    await this.say(CALL.toCandlemas2);
    this.lookC(null);
    // Candlemas cannot answer. A bead of sweat. His hands.
    this.tremble = 0.6;
    this.spawnSweat(true);
    await wait(this, 2600);

    // Almanac tries.
    await this.say(CALL.almanac1);
    await this.flash('v_city', 700);
    await this.say(CALL.almanac2);
    await this.flash('v_ring', 950);
    await this.say(CALL.almanac3);
    await this.flash('v_beneath', 1200, { ridge: true, surge: 1.3 });
    await this.flash('v_scales', 330, { surge: 1.4 });
    this.tremble = 1;
    ui.dialogue.say(CALL.almanac4).then(() => {});
    await wait(this, 900);
    this.flash('v_five', 380, { surge: 0.9 });
    await wait(this, 500);
    ui.dialogue.complete();
    ui.dialogue.hide();

    // She stops. Looks toward Candlemas. Focus is pulled to him.
    this.eyeB = { x: -4, y: 1 };
    this.tweens.add({ targets: this.alm.head, rotation: -0.03, duration: 900 });
    await wait(this, 900);
    this.pullFocusToA();
    this.tremble = 1.6;
    await wait(this, 3200);
    await this.say(CALL.name);
    await this.flash('v_night', 1100, { star: true, surge: 0.5 });
    await wait(this, 800);

    // He looks up — the first time he has met anyone's eyes.
    this.eyeA = { x: 0, y: 0 };
    this.tremble = 0.9;
    await wait(this, 1300);
    await this.say(CALL.candlemas);
    await wait(this, 500);
    this.gunshot();
  }

  lookC(where) {
    const r = { a: [-10, -4, -0.06], b: [10, -4, 0.06], null: [0, 0, 0] }[where];
    this.tweens.add({ targets: this.px.body, x: r[0], duration: 700, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: [this.px.visor, this.px.ring], x: r[0] * 1.4, duration: 700, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.C.content, rotation: r[2] * 0.1, duration: 700 });
  }

  pullFocusToA() {
    // Composition, light, sound: everything leans toward him.
    this.tweens.add({ targets: this.B.content, alpha: 0.55, duration: 1800 });
    this.tweens.add({ targets: this.almFrame, alpha: 0.35, duration: 1800 });
    this.tweens.add({ targets: this.glowB, alpha: 0.02, duration: 1800 });
    this.tweens.add({ targets: this.glowA, alpha: 0.2, duration: 2400 });
    this.tweens.add({ targets: this.lineK, fadeAB: 0.35, fadeBC: 0.35, duration: 1800 });
    this.tweens.add({ targets: this.cam, zoom: 1.26, scrollX: -110, scrollY: -40, duration: 5200, ease: 'Sine.easeInOut' });
    sound.callTone.fadeTo(0.2, 3);
    this.breathTimer = this.time.addEvent({ delay: 760, loop: true, callback: () => sfx.exhale({ gain: 0.018, duration: 0.5 }) });
  }

  async gunshot() {
    const c = this.cand;
    const reduce = settings.get('reduceMotion');
    // The gun comes up from below the frame.
    this.tweens.add({ targets: c.gun, x: 96, y: -30, rotation: -0.35, duration: 520, ease: 'Quad.easeOut' });
    this.tremble = 0.4;
    await wait(this, 240);
    ui.dialogue.say(CALL.wait);
    await wait(this, 430);

    // The shot. The room's alarm dies in the same instant.
    ui.dialogue.complete();
    ui.dialogue.hide();
    sfx.gunshot();
    sound.alarm.kill();
    sound.callTone.stop(0.02);
    sound.vision.stop(0.05);
    this.breathTimer?.remove();
    audio.cutWorld(0.02);
    sfx.tinnitus({ duration: 6.5 });
    ui.caption(CAPTIONS.gunshot, 1600);
    this.fx.flash({ peak: 0.5, attack: 10, release: 420 });
    if (!reduce) this.cam.shake(160, 0.006);

    // Gold becomes white. The figure drops out of frame as a shadow.
    this.candleAlive = false;
    this.A.white.setFillStyle(0xffffff, 1);
    this.candFrame.setTintFill(0xffffff);
    this.glowA.setTint(0xffffff).setAlpha(0.35);
    this.tweens.add({ targets: this.glowA, alpha: 0, duration: 2600 });
    const parts = [c.head, c.body, c.hands, c.gun, c.irisL, c.irisR, c.lidL, c.lidR];
    parts.forEach((o) => o.setTintFill(0x2a2018));
    this.A.content.list.filter((o) => o.texture?.key === 'sweat').forEach((o) => o.destroy());
    this.tweens.add({ targets: parts, y: '+=360', x: '-=30', duration: 560, ease: 'Quad.easeIn' });
    this.tweens.add({ targets: c.head, rotation: -0.4, duration: 560, ease: 'Quad.easeIn' });
    this.tweens.add({ targets: this.A.white, fillAlpha: 0.55, duration: 700, ease: 'Quad.easeOut' });
    this.A.jolt(22, 0.05);
    await wait(this, 90);
    this.A.jolt(-14, -0.03);
    await wait(this, 70);
    this.A.jolt(8, 0.02);
    await wait(this, 80);
    this.A.settle();

    // The connection tearing.
    this.A.noise.setAlpha(0.65);
    for (let i = 0; i < 10; i++) {
      if (!reduce) this.A.jolt((Math.random() - 0.5) * 22, 0);
      await wait(this, 60 + Math.random() * 90);
    }
    this.A.settle();
    c.bg.setTint(0x8a8680);
    c.halo.setTint(0xbab6b0);
    this.tweens.add({ targets: this.A.noise, alpha: 0, duration: 1800 });
    this.tweens.add({ targets: this.A.white, fillAlpha: 0.1, duration: 2600 });
    this.tweens.add({ targets: [c.bg, c.halo], alpha: 0.18, duration: 2600 });
    this.tweens.add({ targets: this.candFrame, alpha: 0.4, duration: 2600 });
    this.time.delayedCall(1400, () => ui.caption(CAPTIONS.silence, 3200));

    // Hold. Do not rush.
    await wait(this, 5400);
    this.pxBreath = 0.32;
    await this.say(CALL.whatDidHeSee);
    await wait(this, 1300);

    // Almanac looks directly at Parallax's channel. Says nothing.
    this.almStill = true;
    this.eyeB = { x: -3, y: 3.5 };
    this.tweens.add({ targets: this.alm.head, rotation: 0.0, duration: 1600 });
    this.tweens.add({ targets: this.B.content, alpha: 1, duration: 1600 });
    this.tweens.add({ targets: this.almFrame, alpha: 0.9, duration: 1600 });
    this.tweens.add({ targets: this.cam, zoom: 1.18, scrollX: 60, scrollY: -10, duration: 3400, ease: 'Sine.easeInOut' });
    await wait(this, 4800);

    // Disconnect. No explanation.
    sfx.channelClose({ pan: 0.4 });
    this.tweens.add({ targets: this.lineK, fadeAB: 0, fadeBC: 0, duration: 900 });
    this.tweens.add({ targets: [this.almFrame, this.glowB], alpha: 0, duration: 700 });
    await this.B.tweenOpen(0, 820, 'Cubic.easeIn');
    await wait(this, 900);
    this.tweens.add({ targets: this.lineK, fadeA: 0, duration: 1800 });
    this.tweens.add({ targets: [this.candFrame, this.glowA, this.mark], alpha: 0, duration: 1800 });
    await this.A.tweenOpen(0, 2000, 'Sine.easeInOut');

    // Only Parallax remains. Violet. Breathing.
    sound.breath.start({ gain: 0.9, rate: 0.3 });
    sound.breath.setRate(0.52, 1.0);
    this.pxBreath = 0.5;
    this.tweens.add({ targets: this.glowC, alpha: 0.18, duration: 3000 });
    this.tweens.add({ targets: this.cam, zoom: 1.6, scrollX: 0, scrollY: POS.c.y - VIEW_H / 2, duration: 6000, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this, visorLevel: 0.55, duration: 140, yoyo: true, repeat: 2, delay: 2200 });
    await wait(this, 5200);
    await this.fx.fadeTo(1, 1800);
    narrative.setStage('aftermath');
    this.scene.start('Penthouse', { start: 'aftermath' });
  }

  spawnSweat(force = false) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const s = this.add.image(side * (44 + Math.random() * 10), -112 + Math.random() * 20, 'sweat').setScale(0.6).setAlpha(0);
    this.A.add(s);
    this.tweens.add({ targets: s, alpha: 0.8, duration: 400 });
    this.tweens.add({
      targets: s, y: s.y + 70 + Math.random() * 30, duration: force ? 2600 : 3600, ease: 'Quad.easeIn',
      onComplete: () => this.tweens.add({ targets: s, alpha: 0, duration: 300, onComplete: () => s.destroy() }),
    });
  }

  // ------------------------------------------------------------------ frame
  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    this.t += dt;
    const t = this.t;
    this.A.update(time); this.B.update(time); this.C.update(time);
    this.drawLines();

    // Candlemas: shallow fast breath, tremor, eyes that will not settle.
    if (this.candleAlive) {
      const c = this.cand;
      const br = Math.sin(t * Math.PI * 2 * 0.95);
      const tr = this.tremble;
      c.body.y = 58 + br * 2.2;
      c.head.y = -170 + br * 1.4 + Math.sin(t * 13) * 0.25 * tr;
      c.head.rotation = Math.sin(t * 0.7) * 0.01 + Math.sin(t * 17) * 0.002 * tr;
      c.hands.x = (Math.random() - 0.5) * 1.6 * tr;
      c.hands.y = 172 + br * 2 + (Math.random() - 0.5) * 1.2 * tr;
      const dart = Math.sin(t * 2.3) * 1.5 * tr + (Math.random() < 0.02 * tr ? (Math.random() - 0.5) * 6 : 0);
      [c.irisL, c.irisR].forEach((ir, i) => {
        ir.x += ((i ? 30 : -30) + this.eyeA.x + dart - ir.x) * Math.min(1, dt * 10);
        ir.y += (-60 + this.eyeA.y + c.head.y + 170 - ir.y) * Math.min(1, dt * 10);
      });
      [c.lidL, c.lidR].forEach((l) => { l.y = c.head.y + 170 - 62; });
      this.nextBlinkA -= dt;
      if (this.nextBlinkA <= 0) {
        this.nextBlinkA = 1.2 + Math.random() * 2.2;
        this.tweens.add({ targets: [c.lidL, c.lidR], scaleY: 0.9, duration: 70, yoyo: true, hold: 40 });
      }
      this.nextSweat -= dt;
      if (this.nextSweat <= 0) {
        this.nextSweat = 2.5 + Math.random() * 3 / Math.max(0.5, tr);
        this.spawnSweat();
      }
      c.halo.rotation += dt * 0.02;
    }

    // Almanac: slow, measured.
    const a = this.alm;
    const bb = Math.sin(t * Math.PI * 2 * 0.22);
    a.body.y = 40 + bb * 1.2;
    a.head.y = -200 + bb * 0.8;
    [a.irisL, a.irisR].forEach((ir, i) => {
      ir.x += ((i ? 26 : -26) + this.eyeB.x - ir.x) * Math.min(1, dt * 4);
      ir.y += (-79 + this.eyeB.y + bb * 0.8 - ir.y) * Math.min(1, dt * 4);
    });
    [a.lidL, a.lidR].forEach((l) => { l.y = -81 + bb * 0.8; });
    this.nextBlinkB -= dt;
    if (this.nextBlinkB <= 0 && !this.almStill) {
      this.nextBlinkB = 3 + Math.random() * 3;
      this.tweens.add({ targets: [a.lidL, a.lidR], scaleY: 1, duration: 80, yoyo: true, hold: 50 });
    }

    // Parallax: a breathing presence.
    const pb = Math.sin(t * Math.PI * 2 * (this.pxBreath || 0.2));
    this.px.body.y = 24 + pb * 1.4;
    this.px.visor.setAlpha((this.visorLevel ?? 1) * (0.85 + Math.sin(t * 29) * 0.05 + (Math.random() < 0.01 ? -0.4 : 0)));
  }

  drawLines() {
    const g = this.lines;
    g.clear();
    const k = this.lineK;
    const seg = (p, q, amt, alpha, col = 0xa9a4b6) => {
      if (amt <= 0) return;
      g.lineStyle(1, col, alpha);
      g.beginPath();
      g.moveTo(p.x, p.y);
      g.lineTo(p.x + (q.x - p.x) * amt, p.y + (q.y - p.y) * amt);
      g.strokePath();
    };
    seg(POS.c, POS.a, k.ca, 0.28 * k.fadeA, 0xd9c08a);
    seg(POS.c, POS.b, k.cb, 0.28 * k.fadeBC, 0x9fc0c8);
    seg(POS.a, POS.b, k.ab, 0.22 * k.fadeAB);
  }
}
