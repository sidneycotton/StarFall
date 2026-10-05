import Phaser from 'phaser';
import { VIEW_W, VIEW_H } from '../config.js';
import { ui } from '../ui/UI.js';
import { narrative } from '../core/NarrativeState.js';
import { audio } from '../audio/AudioEngine.js';
import { sound } from '../audio/soundscape.js';
import * as sfx from '../audio/sfx.js';
import { ScreenFX } from '../fx/ScreenFX.js';
import { CameraDirector } from '../systems/CameraDirector.js';
import { wait } from '../systems/Cutscene.js';
import { qte } from '../systems/QTE.js';
import { Parallax } from '../entities/Parallax.js';
import { addPainted } from '../art/paint.js';
import { SKY } from '../data/record.js';

// Above the cloud. The helicopter can't follow; what the Record has of this
// is a long lens, the pilot's radio, and a light that turned night into day.

const ADD = Phaser.BlendModes.ADD;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;

export class SkyScene extends Phaser.Scene {
  constructor() {
    super('Sky');
  }

  create() {
    narrative.setStage('sky');
    this.speed = 1;
    this.tweens.timeScale = 1;
    this.time.timeScale = 1;
    this.fx = new ScreenFX(this);
    this.fx.set({ fade: 1, desat: 0.28, aberration: 0.9, grain: 0.13, vignette: 0.7, tintR: 0.92, tintG: 0.98, tintB: 1.08 });
    this.cameraDir = new CameraDirector(this, { minX: 0, maxX: VIEW_W, y: CY });
    this.cameraDir.shot(CX, CY, 1, 0);

    const sky = addPainted(this, CX, CY, 'sk_sky').setScrollFactor(0).setDepth(0);
    sky.setDisplaySize(VIEW_W * 1.5, VIEW_H * 1.5);
    this.spire = this.add.image(1180, 980, 'sk_spire').setOrigin(0.5, 0).setScrollFactor(0).setDepth(2).setScale(0.9);
    this.far = this.add.tileSprite(CX, 560, VIEW_W * 1.6, 500, 'sk_cloud_far').setOrigin(0.5, 0).setTileScale(2, 2).setScrollFactor(0).setDepth(3);
    this.near = this.add.tileSprite(CX, 700, VIEW_W * 1.6, 500, 'sk_cloud_near').setOrigin(0.5, 0).setTileScale(2, 2).setScrollFactor(0).setDepth(30);
    this.wisps = [];
    for (let i = 0; i < 5; i++) {
      const w = addPainted(this, Math.random() * VIEW_W * 1.4, 120 + Math.random() * 600, 'sk_wisp').setScrollFactor(0).setDepth(i % 2 ? 31 : 4).setAlpha(0.8);
      w.v = 500 + Math.random() * 500;
      this.wisps.push(w);
    }

    this.star = new Parallax(this, 560, 520, { outfit: 'star', scale: 0.9 }).setDepth(20);
    this.px = new Parallax(this, 1080, 470, { outfit: 'suit', helmet: true, scale: 0.9 }).setDepth(19);
    [this.star, this.px].forEach((r) => { r.airborne = true; r.posture = 1; r.root.setScrollFactor(0); });
    this.px.projection = true;
    this.px.setHelmet(true, true);
    this.px.visorLevel = 1;
    this.star.face(1, false);
    this.px.face(-1, false);
    this.star.root.setRotation(1.2);
    this.px.root.setRotation(-1.2);
    this.star.pose('fly', 0);
    this.px.pose('fly', 0);
    this.drift = { s: { x: 560, y: 520 }, p: { x: 1080, y: 470 } };
    this.trails = [this.trail(this.star, 0xffe2a0), this.trail(this.px, 0x7b4bc4)];
    this.run();
  }

  trail(rig, tint) {
    const t = this.add.image(0, 0, 'light_streak').setOrigin(1, 0.5).setBlendMode(ADD).setTint(tint).setScrollFactor(0).setDepth(rig.root.depth - 1).setAlpha(0.6).setScale(0.8, 0.6);
    t.rig = rig;
    return t;
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    const t = time / 1000;
    const v = this.speed;
    this.far.tilePositionX += 40 * v * dt;
    this.near.tilePositionX += 140 * v * dt;
    this.wisps.forEach((w) => {
      w.x -= w.v * v * dt;
      if (w.x < -400) { w.x = VIEW_W + 400; w.y = 120 + Math.random() * 600; }
    });
    // They bank and bob around their marks.
    const d = this.drift;
    this.star.root.setPosition(d.s.x + Math.sin(t * 1.3) * 10, d.s.y + Math.sin(t * 1.9) * 14);
    this.px.root.setPosition(d.p.x + Math.sin(t * 1.1 + 2) * 10, d.p.y + Math.sin(t * 1.7 + 1) * 14);
    this.trails.forEach((tr) => {
      const r = tr.rig;
      const back = r === this.star ? -1 : 1;
      tr.setPosition(r.root.x + back * -20, r.root.y - 70).setFlipX(back > 0).setOrigin(back > 0 ? 0 : 1, 0.5);
      tr.setVisible(r.root.visible);
    });
    this.star.update(dt);
    this.px.update(dt);
    this.cameraDir.update(dt);
    ui.record.advance(dt);
  }

  move(who, x, y, ms, ease = 'Sine.easeInOut') {
    return new Promise((r) => this.tweens.add({ targets: this.drift[who], x, y, duration: ms, ease, onComplete: r }));
  }

  hitFlash(tint) {
    this.cameraDir.kick(18);
    this.fx.flash({ r: tint[0], g: tint[1], b: tint[2], peak: 0.45, release: 500 });
  }

  async run() {
    ui.letterbox(true);
    ui.showHud(false);
    ui.record.show(true);
    ui.record.setTime(23, 44, 10);
    ui.record.source(SKY.source, 'SOURCE 0003 / 1412');
    sound.hiss.start({ fadeIn: 1 });
    sound.skyWind.start({ fadeIn: 2 });
    audio.setArchive(true, 0.1);
    sound.duel.start({ bpm: 132, intensity: 2 });
    await this.fx.fadeTo(0, 1600);
    await ui.record.note(SKY.pilot, 5600);
    ui.record.source('RECONSTRUCTION · CH9 LONG LENS · RADAR', 'SOURCE — / 1412');
    sfx.glitch({ gain: 0.1 });

    // He comes at her out of the moon.
    this.move('p', 760, 420, 900, 'Cubic.easeIn');
    sfx.tell({ pan: 0.3, ms: 800 });
    const evade = await qte(this, { type: 'press', label: SKY.prompts.evade, verb: 'dodge', lead: 780, window: 260, x: CX, y: VIEW_H * 0.26 });
    narrative.setRecord('skyEvade', evade);
    sfx.flyBy({ pan: 0.4, gain: 0.12 });
    if (evade === 'success') {
      this.move('s', 520, 600, 260, 'Cubic.easeOut');
      sfx.dodge({});
    } else {
      sfx.umbralStrike({ pan: 0.2 });
      this.hitFlash([0.48, 0.3, 0.77]);
      this.move('s', 420, 580, 300, 'Cubic.easeOut');
    }
    await this.move('p', 300, 360, 600, 'Cubic.easeOut');
    this.px.face(1);
    this.px.root.setRotation(1.2);
    await ui.dialogue.play(SKY.lines1);

    // She turns, and goes through him.
    this.star.face(-1);
    this.star.root.setRotation(-1.2);
    this.star.pose('strike', 200);
    const strike = await qte(this, { type: 'press', label: SKY.prompts.strike, lead: 700, window: 240, x: CX, y: VIEW_H * 0.26 });
    narrative.setRecord('skyStrike', strike);
    this.move('s', 360, 380, 220, 'Cubic.easeIn');
    await wait(this, 200);
    if (strike === 'success') {
      sfx.lightStrike({});
      this.hitFlash([1, 0.9, 0.6]);
      this.move('p', 160, 300, 400, 'Cubic.easeOut');
    } else {
      sfx.parry({});
      this.cameraDir.kick(10);
    }
    this.star.pose('fly', 300);
    // Up, both of them, past the spire's lights, toward the moon.
    this.speed = 2.2;
    this.tweens.add({ targets: this.spire, y: 1300, duration: 4000, ease: 'Sine.easeIn' });
    this.star.face(1);
    this.star.root.setRotation(0.5);
    this.px.root.setRotation(0.5);
    this.move('s', 640, 420, 1600);
    this.move('p', 980, 380, 1600);
    sound.duel.setIntensity(3);
    await wait(this, 1600);
    this.star.root.setRotation(1.2);
    this.px.face(-1);
    this.px.root.setRotation(-1.2);

    // They meet head on.
    const meet = await qte(this, { type: 'mash', label: SKY.prompts.meet, presses: 12, limit: 6500, x: CX, y: VIEW_H * 0.24 });
    narrative.setRecord('skyMeet', meet);
    this.move('s', 760, 430, 200, 'Cubic.easeIn');
    this.move('p', 860, 430, 200, 'Cubic.easeIn');
    await wait(this, 200);
    sfx.lightStrike({});
    sfx.umbralStrike({});
    this.hitFlash([1, 0.95, 1]);
    this.star.pose('hold', 200);
    this.px.pose('hold', 200);
    this.speed = 0.4;
    sound.duel.setIntensity(1);
    await ui.dialogue.play(SKY.lines2);

    // Burn brighter.
    const halo = this.add.image(this.drift.s.x, this.drift.s.y - 80, 'light_soft').setScrollFactor(0).setBlendMode(ADD).setTint(0xffe8b0).setScale(1).setAlpha(0).setDepth(25);
    const burn = await qte(this, {
      type: 'hold', label: SKY.prompts.burn, hold: 2600, x: CX, y: VIEW_H * 0.22,
      onProgress: (p) => {
        this.star.radiance = p;
        halo.setAlpha(p).setScale(1 + p * 6);
        this.fx.set({ exposure: 1 + p * 0.5, desat: 0.28 * (1 - p) });
        if (p > 0.9 && !this.goldFrame) {
          // For one frame, his visor answers in gold.
          this.goldFrame = true;
          this.px.visor.setTint(0xffd27a);
          this.time.delayedCall(40, () => this.px.visor.clearTint());
        }
      },
    });
    narrative.setRecord('skyBurn', burn);
    sound.duel.stop(0.2);
    sfx.flyBy({ gain: 0.2 });
    audio.dip(400, 2);
    this.fx.flash({ r: 1, g: 1, b: 1, peak: 1, attack: 300, release: 99999 });
    this.fx.tween({ exposure: 2.4 }, 400);
    await wait(this, 900);
    sound.skyWind.stop(0.1);
    audio.cutWorld(0.2);
    halo.destroy();
    this.star.setVisible(false);
    this.px.setVisible(false);
    this.trails.forEach((t) => t.destroy());
    this.trails = [];
    await ui.record.note(SKY.whiteout, 6200);
    this.fx.set({ fade: 1, exposure: 1 });
    ui.record.gap('NO FOOTAGE', 'CH9 camera overexposed at 23:47:19. Radar contact lost.');
    await wait(this, 4200);
    ui.record.hideGap();

    // Dawn over the harbour: the cape, coming down by itself.
    audio.restoreWorld(2);
    sound.skyWind.start({ gain: 0.4, fadeIn: 3 });
    ui.record.setTime(4, 2, 30);
    ui.record.source('PHONE · WITNESS 402 · AUREATE QUAY', 'SOURCE 1412 / 1412');
    this.speed = 0.05;
    this.fx.set({ desat: 0.5, tintR: 1.04, tintG: 0.96, tintB: 0.98 });
    const cape = this.add.image(CX + 120, -160, 'st_cape').setScrollFactor(0).setDepth(25).setScale(0.6).setTint(0xc8b8a8);
    this.tweens.add({ targets: cape, y: VIEW_H + 200, duration: 14000, ease: 'Linear' });
    this.tweens.add({ targets: cape, x: CX - 120, angle: 30, duration: 3500, yoyo: true, repeat: 3, ease: 'Sine.easeInOut' });
    this.fx.fadeTo(0, 2400);
    await wait(this, 1500);
    await ui.record.note(SKY.cape, 7400);
    await wait(this, 1800);
    await this.fx.fadeTo(1, 2400);
    ui.record.show(false);
    await ui.record.card(SKY.end, { hold: 2800, step: 2200 });
    sound.hiss.stop(1);
    sound.skyWind.stop(1);
    audio.setArchive(false, 1);
    await wait(this, 1400);
    this.scene.start('Vigil', { end: true });
  }
}
