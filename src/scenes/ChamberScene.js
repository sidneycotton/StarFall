import Phaser from 'phaser';
import { VIEW_W, VIEW_H } from '../config.js';
import { ui } from '../ui/UI.js';
import { narrative } from '../core/NarrativeState.js';
import { settings } from '../core/Settings.js';
import { audio } from '../audio/AudioEngine.js';
import { sound } from '../audio/soundscape.js';
import * as sfx from '../audio/sfx.js';
import { ScreenFX } from '../fx/ScreenFX.js';
import { CameraDirector } from '../systems/CameraDirector.js';
import { wait } from '../systems/Cutscene.js';
import { Parallax } from '../entities/Parallax.js';
import { PlayerController } from '../entities/PlayerController.js';
import { addPainted } from '../art/paint.js';
import { CHAMBER_W } from '../art/chamber.js';
import { HEROES } from '../data/heroes.js';
import { CHAMBER } from '../data/script.js';

// The one immaculate room. Parallax walks to the classification wall; five
// unremarkable profiles light up; the vision answers; the title follows.

const ADD = Phaser.BlendModes.ADD;
const LANE = 800;
const WALL = { x: 1180, y: 70, w: 1120, h: 610 };
const TIERS = ['Ω', 'S', 'A', 'B', 'C', 'D'];

export class ChamberScene extends Phaser.Scene {
  constructor() {
    super('Chamber');
  }

  create() {
    narrative.setStage('chamber');
    this.fx = new ScreenFX(this);
    this.fx.set({ fade: 1, desat: 0.1, aberration: 0.5, grain: 0.07 });
    this.cameraDir = new CameraDirector(this, { minX: 0, maxX: CHAMBER_W, y: 450 });
    this.buildRoom();
    this.buildWall();
    this.rig = new Parallax(this, 150, LANE, { outfit: 'suit', helmet: true }).setDepth(50);
    this.rig.posture = 1;
    this.rig.setHelmet(true, true);
    this.rig.face(1, false);
    this.player = new PlayerController(this, this.rig, { minX: 120, maxX: 1520 });
    this.player.setProfile('precise');
    this.cards = [];
    this.run();
  }

  buildRoom() {
    this.add.image(0, 0, 'ch_wall').setOrigin(0, 0).setDepth(1);
    this.add.image(-100, 690, 'ch_floor').setOrigin(0, 0).setDisplaySize(CHAMBER_W + 200, 230).setDepth(2);
    addPainted(this, 980, 794, 'ch_cases', 0.5, 1).setDepth(10);
    // Hard overhead lights: thin bars, cones, and their reflections in the floor.
    [380, 900, 1700].forEach((x) => {
      this.add.image(x, 20, 'ch_lightbar').setDepth(3);
      this.add.image(x, 22, 'light_cone').setOrigin(0.5, 0).setScale(2.6, 1.6).setBlendMode(ADD).setTint(0xcfc8ea).setAlpha(0.06).setDepth(4);
      this.add.image(x, 790, 'light_soft').setScale(2.6, 0.3).setBlendMode(ADD).setTint(0xcfc8ea).setAlpha(0.12).setDepth(3);
      this.add.image(x, 860, 'light_drip').setScale(4, 0.5).setBlendMode(ADD).setTint(0xcfc8ea).setAlpha(0.05).setDepth(3);
    });
    // The door Parallax came in through.
    this.add.image(150, 0, 'door_frame').setOrigin(0.5, 0).setDepth(5).setTint(0x8a8698);
    this.doorGlow = this.add.image(150, 520, 'light_soft').setScale(1.4, 3).setTint(0xb79cff).setBlendMode(ADD).setAlpha(0.22).setDepth(4);
  }

  // The classification wall: tiers from Ω to D, dense with dim profiles.
  buildWall() {
    const rowH = (WALL.h - 90) / TIERS.length;
    this.tiles = [];
    TIERS.forEach((tier, r) => {
      const y = WALL.y + 30 + r * rowH;
      this.add.text(WALL.x + 26, y + rowH / 2, tier, { fontFamily: 'Cormorant Garamond', fontSize: '30px', color: '#8a8698' }).setOrigin(0.5).setDepth(6);
      this.add.image(WALL.x + 52, y + rowH - 4, 'pixel').setOrigin(0, 0.5).setDisplaySize(WALL.w - 70, 1).setTint(0xa9a4b6).setAlpha(0.15).setDepth(6);
      if (r === 0) {
        // Ω: only two names ever. Side by side; one gold, one eclipse.
        const star = this.add.image(WALL.x + 120, y + rowH / 2, 'tile_star').setScale(0.55).setDepth(6).setAlpha(0.75);
        this.add.text(star.x + 44, y + rowH / 2 - 12, 'STAR', { fontFamily: 'Jost', fontSize: '13px', color: '#e2c27e', letterSpacing: 5 }).setDepth(6);
        this.add.text(star.x + 44, y + rowH / 2 + 6, 'DECEASED', { fontFamily: 'Jost', fontSize: '10px', color: '#8a7a5a', letterSpacing: 4 }).setDepth(6);
        const px = this.add.image(WALL.x + 330, y + rowH / 2, 'tile_parallax').setScale(0.55).setDepth(6).setAlpha(0.75);
        this.add.text(px.x + 44, y + rowH / 2 - 12, 'PARALLAX', { fontFamily: 'Jost', fontSize: '13px', color: '#b79cff', letterSpacing: 5 }).setDepth(6);
        this.add.text(px.x + 44, y + rowH / 2 + 6, 'UNKNOWN', { fontFamily: 'Jost', fontSize: '10px', color: '#6a5a8a', letterSpacing: 4 }).setDepth(6);
        return;
      }
      const count = [0, 6, 11, 14, 14, 14][r];
      for (let i = 0; i < count; i++) {
        const tile = this.add.image(WALL.x + 90 + i * 72, y + rowH / 2, 'tile').setScale(0.62).setDepth(6).setAlpha(0.35 + (r < 3 ? 0.2 : 0));
        tile.tier = tier;
        this.tiles.push(tile);
      }
    });
    // History along the bottom: a timeline with years nobody will explain yet.
    const ty = WALL.y + WALL.h - 34;
    this.add.image(WALL.x + 40, ty, 'pixel').setOrigin(0, 0.5).setDisplaySize(WALL.w - 80, 1).setTint(0xa9a4b6).setAlpha(0.35).setDepth(6);
    ['THE FIRST SEERS', 'THE AUREATE ACCORD', 'STAR', 'THE LONG NIGHT', 'VESPER BURNS', 'STAR LOST', '—'].forEach((ev, i) => {
      const x = WALL.x + 70 + i * 160;
      this.add.image(x, ty, 'pixel').setDisplaySize(1, 8).setTint(0xa9a4b6).setAlpha(0.5).setDepth(6);
      this.add.text(x, ty + 10, ev, { fontFamily: 'Jost', fontSize: '9px', color: '#6a6878', letterSpacing: 3 }).setOrigin(0.5, 0).setDepth(6);
    });
    // The five D-tier tiles that will wake.
    this.fiveTiles = [2, 5, 7, 9, 12].map((i) => this.tiles.filter((t) => t.tier === 'D')[i]);
    this.wallGlow = this.add.image(WALL.x + WALL.w / 2, WALL.y + WALL.h / 2, 'light_soft').setScale(6, 3.5).setTint(0x9a8ad0).setBlendMode(ADD).setAlpha(0.05).setDepth(5);
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    this.player.update(dt);
    this.rig.update(dt);
    this.cameraDir.update(dt);
    this.stageUpdate?.(dt);
  }

  async run() {
    ui.letterbox(false);
    ui.showHud(true, true);
    sound.chamber.start();
    audio.setHelmet(true, 0.05);
    this.cameraDir.shot(700, 450, 1.0, 0);
    await this.fx.fadeTo(0, 1400);
    sfx.doorSlide({ gain: 0.06, open: false });
    this.player.enabled = true;
    ui.touch.setMovement(true);
    this.cameraDir.follow(this.rig, { lag: 0.05, lead: 180, zoom: 1.0, blend: 1000 });

    // Walking in. When Parallax reaches the wall, the room takes over.
    await new Promise((resolve) => {
      this.stageUpdate = () => {
        if (this.rig.x > 1340) { this.stageUpdate = null; resolve(); }
      };
      // If the player stands still, Parallax goes on alone after a while.
      this.time.delayedCall(9000, () => {
        if (this.stageUpdate) { this.stageUpdate = null; resolve(); }
      });
    });
    this.player.enabled = false;
    ui.touch.setMovement(false);
    ui.letterbox(true);
    sound.run.stop(3);
    await this.player.walkTo(1240, { speed: 150 });
    this.rig.face(1);
    this.rig.vx = 0;
    await this.rig.pose('still', 700);
    await this.cameraDir.shot(1600, 380, 1.0, 1800);
    this.reveal();
  }

  async reveal() {
    // Five tiles, all in the lowest tier, light up.
    this.fiveTiles.forEach((t, i) => {
      this.time.delayedCall(i * 260, () => {
        sfx.screenWake({ pan: 0.2 });
        this.tweens.add({ targets: t, alpha: 1, duration: 300 });
        t.setTint(0xe6e0ff);
        const g = this.add.image(t.x, t.y, 'light_soft').setScale(0.6).setTint(0xcfc6ff).setBlendMode(ADD).setAlpha(0).setDepth(7);
        this.tweens.add({ targets: g, alpha: 0.45, duration: 300, yoyo: true, hold: 700 });
      });
    });
    await wait(this, 1900);

    // They come forward: a projection of five profiles across the room.
    this.dimRoom = this.add.rectangle(VIEW_W / 2, VIEW_H / 2, VIEW_W * 2, VIEW_H * 2, 0x000000, 0).setScrollFactor(0).setDepth(60);
    this.tweens.add({ targets: this.dimRoom, fillAlpha: 0.72, duration: 1200 });
    const cw = 250;
    const gap = 22;
    const total = HEROES.length * cw + (HEROES.length - 1) * gap;
    const x0 = (VIEW_W - total) / 2 + cw / 2 + 110;
    HEROES.forEach((h, i) => {
      this.time.delayedCall(300 + i * 280, () => this.cards.push(this.makeCard(h, x0 + i * (cw + gap), 400, i)));
    });
    // Parallax, in silhouette against the projections.
    this.rig.setDepth(95);
    await wait(this, 300 + 5 * 280 + 1600);

    await ui.dialogue.play([CHAMBER.you]);
    await wait(this, 600);

    // The footage: Paperweight at a child's birthday party.
    await this.playFootage(this.cards[1]);
    await wait(this, 800);

    // There must be some mistake — and then the vision answers.
    const v = addPainted(this, VIEW_W / 2, VIEW_H / 2, 'v_five').setScrollFactor(0).setDepth(200);
    sound.vision.start({ gain: 0.9, fadeIn: 0.05 });
    sound.vision.surge(1.2, 0.05);
    sfx.lowImpact({ gain: 0.4, freq: 34 });
    this.fx.set({ aberration: 2.4 });
    if (settings.get('reduceMotion')) { v.setAlpha(0); this.tweens.add({ targets: v, alpha: 1, duration: 200 }); }
    await wait(this, 1500);
    v.destroy();
    this.fx.set({ aberration: 0.5 });
    sound.vision.stop(1.2);
    // Same arrangement: the vision's silhouettes laid over the five profiles.
    this.cards.forEach((c) => {
      c.ghost.setAlpha(0.0);
      this.tweens.add({ targets: c.ghost, alpha: 0.85, duration: 300, yoyo: true, hold: 900 });
    });
    await wait(this, 2200);

    await ui.dialogue.play([CHAMBER.ofCourse]);
    // The visor brightens. Parallax reaches toward them.
    this.tweens.add({ targets: this.rig, visorLevel: 2.2, duration: 900, ease: 'Sine.easeIn' });
    this.tweens.add({ targets: this.rig.visorGlow, scale: 0.7, duration: 900 });
    this.rig.pose('reach', 1600, 'Sine.easeInOut');
    this.cameraDir.shot(1600, 400, 1.06, 3000, 'Sine.easeIn');
    await wait(this, 2200);

    // Cut to black. No sound.
    this.fx.set({ fade: 1 });
    sound.chamber.stop(0.02);
    audio.cutWorld(0.02);
    ui.letterbox(false);
    ui.showHud(false);
    narrative.setStage('title');
    await wait(this, 300);
    this.scene.start('Title');
  }

  makeCard(h, x, y, i) {
    const depth = 80;
    const c = this.add.container(x, y + 20).setScrollFactor(0).setDepth(depth).setAlpha(0);
    const frame = this.add.rectangle(0, 0, 250, 480, 0x07060a, 0.92).setStrokeStyle(1, 0xa9a4b6, 0.35);
    const portrait = this.add.image(0, -100, `hero_${h.id}`).setScale(0.95);
    const ghost = this.add.image(0, -100, `hero_${h.id}`).setScale(0.95).setTintFill(0xb79cff).setBlendMode(ADD).setAlpha(0);
    const name = this.add.text(0, 40, h.name.toUpperCase(), { fontFamily: 'Jost', fontSize: '17px', color: '#ece6f2', letterSpacing: 7 }).setOrigin(0.5, 0);
    const reg = this.add.text(0, 66, h.reg, { fontFamily: 'Jost', fontSize: '9px', color: '#6a6878', letterSpacing: 3 }).setOrigin(0.5, 0);
    const power = this.add.text(0, 90, h.power, { fontFamily: 'Cormorant Garamond', fontStyle: 'italic', fontSize: '19px', color: '#d8d2e2', align: 'center', wordWrap: { width: 210 }, lineSpacing: -2 }).setOrigin(0.5, 0);
    const ratingRule = this.add.image(0, 176, 'pixel').setDisplaySize(180, 1).setTint(0xa9a4b6).setAlpha(0.25);
    const rating = this.add.text(-90, 186, `CLASS ${h.rating}`, { fontFamily: 'Jost', fontSize: '12px', color: '#b79cff', letterSpacing: 4 }).setOrigin(0, 0);
    const idx = this.add.text(90, 186, `INDEX ${h.index}`, { fontFamily: 'Jost', fontSize: '10px', color: '#6a6878', letterSpacing: 2 }).setOrigin(1, 0);
    const note = this.add.text(0, 212, h.note, { fontFamily: 'Cormorant Garamond', fontSize: '15px', color: '#8a8698', align: 'center', wordWrap: { width: 210 } }).setOrigin(0.5, 0);
    c.add([frame, portrait, ghost, name, reg, power, ratingRule, rating, idx, note]);
    this.tweens.add({ targets: c, alpha: 1, y, duration: 900, ease: 'Cubic.easeOut' });
    sfx.screenWake({ pan: (i - 2) * 0.3 });
    return { c, portrait, ghost, h };
  }

  // Embarrassingly mundane footage, looped in Paperweight's portrait.
  async playFootage(card) {
    const px = card.c.x;
    const py = card.c.y - 100;
    const mask = this.make.graphics({ add: false });
    mask.fillStyle(0xffffff).fillRect(px - 114, py - 124, 228, 248);
    const m = mask.createGeometryMask();
    const layer = this.add.container(px, py).setScrollFactor(0).setDepth(90).setAlpha(0);
    layer.setMask(m);
    const bg = this.add.image(0, 0, 'party_bg').setScale(0.95);
    const kids = [-80, -40, 60, 92].map((x, i) => this.add.image(x, 70 + (i % 2) * 6, 'party_kid').setScale(0.9 + (i % 2) * 0.15));
    const hero = this.add.image(10, 52, 'party_kid').setScale(1.5, 1.7).setTint(0x0a0810);
    const slice = this.add.image(18, -30, 'party_slice').setScale(1.2);
    const balloons = [-60, 40, 80].map((x, i) => this.add.image(x, -50 - i * 8, 'party_balloon').setScale(0.9));
    const rec = this.add.text(-104, -114, '● REC  BIRTHDAY_FINAL_2.mov', { fontFamily: 'Jost', fontSize: '9px', color: '#e8a0a0', letterSpacing: 1 });
    layer.add([bg, ...kids, hero, slice, ...balloons, rec]);
    this.tweens.add({ targets: layer, alpha: 1, duration: 400 });
    this.tweens.add({ targets: card.portrait, alpha: 0.0, duration: 400 });
    // The cake slice and balloons hang perfectly still while children bounce.
    kids.forEach((k, i) => this.tweens.add({ targets: k, y: k.y - 8, duration: 220 + i * 30, yoyo: true, repeat: -1, ease: 'Sine.easeOut' }));
    this.tweens.add({ targets: hero, scaleY: 1.6, y: 56, duration: 600, yoyo: true, repeat: 1, delay: 2600, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: rec, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });
    this.cameraDir.shot(this.cameraDir.cx + (px - VIEW_W / 2) * 0.15, 400, 1.04, 2600);
    await wait(this, 4600);
  }
}
