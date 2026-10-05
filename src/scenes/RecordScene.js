import Phaser from 'phaser';
import { VIEW_W, VIEW_H } from '../config.js';
import { ui } from '../ui/UI.js';
import { narrative } from '../core/NarrativeState.js';
import { input } from '../systems/Input.js';
import { audio } from '../audio/AudioEngine.js';
import { sound } from '../audio/soundscape.js';
import { speakModulated } from '../audio/VoiceModulator.js';
import * as sfx from '../audio/sfx.js';
import { ScreenFX } from '../fx/ScreenFX.js';
import { CameraDirector } from '../systems/CameraDirector.js';
import { wait } from '../systems/Cutscene.js';
import { qte } from '../systems/QTE.js';
import { Duel } from '../systems/Duel.js';
import { Parallax } from '../entities/Parallax.js';
import { PlayerController } from '../entities/PlayerController.js';
import { addPainted, rng } from '../art/paint.js';
import { RECORD } from '../data/record.js';

// The Starfall Record: the Lantern Bridge, reconstructed from public footage.
// You play Star — three rescues as the span fails, then Parallax. Twice the
// sources disagree and the player decides which account the Record follows.
// It doesn't change what happened. It changes what the Record says happened.

const ADD = Phaser.BlendModes.ADD;
const W = 4100;
const DECK = 760;               // feet line on the walkway
const RAIL = 98;                // railing height above the walkway (deck tile is painted at 2×)
const TOWERS = [600, 3500];
const SPAN = { x0: 1500, x1: 2600 };
const ARENA = { min: 2660, max: 3440 };
const SPOT = { tram: 1150, boy: 1780, hanger: 2250, meet: 2840, px: 3260 };
const COLD = { desat: 0.32, aberration: 0.75, grain: 0.11, vignette: 0.6, tintR: 0.94, tintG: 0.98, tintB: 1.06 };

// Main cable: towers at y 140, sagging to 630 mid-span; side spans run down to the banks.
function cableY(x) {
  const [a, b] = TOWERS;
  if (x >= a && x <= b) {
    const m = (a + b) / 2;
    const k = (x - m) / ((b - a) / 2);
    return 140 + 490 * (1 - k * k);
  }
  const d = x < a ? a - x : x - b;
  return Math.min(DECK - RAIL - 12, 140 + d * d * 0.0009 + d * 0.12);
}

export class RecordScene extends Phaser.Scene {
  constructor() {
    super('Record');
  }

  create(data = {}) {
    this.startAt = data.start || 'open';
    narrative.setStage(this.startAt === 'duel' ? 'duel' : 'record');
    this.slow = 1;
    this.tweens.timeScale = 1;
    this.time.timeScale = 1;
    this.fx = new ScreenFX(this);
    this.fx.set({ fade: 1, ...COLD });
    this.cameraDir = new CameraDirector(this, { minX: 0, maxX: W, y: 450 });
    this.buildWorld();
    this.star = new Parallax(this, 900, DECK, { outfit: 'star', scale: 0.92 }).setDepth(50);
    this.star.posture = 1;
    this.star.setVisible(false);
    this.px = new Parallax(this, SPOT.px, DECK, { outfit: 'suit', helmet: true, scale: 0.92 }).setDepth(49);
    this.px.posture = 1;
    this.px.projection = true;
    this.px.setHelmet(true, true);
    this.px.face(-1, false);
    this.px.setVisible(false);
    this.player = new PlayerController(this, this.star, { minX: 120, maxX: W - 200 });
    this.player.setProfile('precise');
    this.recording = false;
    this.run();
  }

  // --- world ------------------------------------------------------------------
  buildWorld() {
    const sky = addPainted(this, VIEW_W / 2, VIEW_H / 2, 'br_sky').setScrollFactor(0).setDepth(0);
    sky.setDisplaySize(VIEW_W * 2.1, VIEW_H * 2.1);
    addPainted(this, -500, -40, 'br_far', 0, 0).setScrollFactor(0.22).setDepth(1);
    addPainted(this, 2100, -40, 'br_far', 0, 0).setScrollFactor(0.22).setDepth(1).setFlipX(true);
    this.water = this.add.tileSprite(-600, DECK + 100, W + 1600, 900, 'br_water').setOrigin(0, 0).setTileScale(2, 2).setDepth(2);

    // Towers and the main cable.
    TOWERS.forEach((x) => this.add.image(x, DECK + 140, 'br_tower').setOrigin(0.5, 1).setScale(0.72).setDepth(5));
    this.cableG = this.add.graphics().setDepth(6);
    this.cableG.lineStyle(7, 0x2a2232, 1);
    this.cableG.beginPath();
    for (let x = -400; x <= W + 400; x += 20) {
      const y = cableY(x);
      if (x === -400) this.cableG.moveTo(x, y); else this.cableG.lineTo(x, y);
    }
    this.cableG.strokePath();
    this.cableG.lineStyle(1.5, 0xf2c070, 0.25);
    this.cableG.beginPath();
    for (let x = -400; x <= W + 400; x += 20) {
      const y = cableY(x) - 3;
      if (x === -400) this.cableG.moveTo(x, y); else this.cableG.lineTo(x, y);
    }
    this.cableG.strokePath();
    const hang = this.add.graphics().setDepth(6);
    this.hangers = [];
    for (let x = -360; x < W + 360; x += 56) {
      const y = cableY(x);
      if (y > DECK - RAIL - 40 || (x > SPAN.x0 && x < SPAN.x1)) continue;
      hang.lineStyle(2, 0x2a2232, 1).lineBetween(x, y, x, DECK - RAIL);
    }

    // The centre span is its own body: it sags, and then it goes.
    this.span = this.add.container(SPAN.x0, DECK).setDepth(22);
    this.spanHang = this.add.graphics();
    this.spanLines = [];
    for (let x = SPAN.x0 + 20; x < SPAN.x1; x += 56) {
      const line = { x: x - SPAN.x0, top: cableY(x) - DECK, snapped: false };
      this.spanLines.push(line);
    }
    this.drawSpanHangers();
    this.span.add(this.spanHang);
    this.add.tileSprite(-400, DECK - 100, SPAN.x0 + 400, 300, 'br_deck').setOrigin(0, 0).setDepth(22);
    this.add.tileSprite(SPAN.x1, DECK - 100, W - SPAN.x1 + 400, 300, 'br_deck').setOrigin(0, 0).setDepth(22);
    this.span.add(this.add.tileSprite(0, -100, SPAN.x1 - SPAN.x0, 300, 'br_deck').setOrigin(0, 0));

    // Lanterns, every 200 px, taller than anyone on the bridge. They go out from the east, one at a time.
    this.lanterns = [];
    for (let x = 80; x < W; x += 200) {
      const inSpan = x > SPAN.x0 && x < SPAN.x1;
      const lx = inSpan ? x - SPAN.x0 : x;
      const base = inSpan ? -6 : DECK - 6;
      const post = this.add.image(lx, base, 'br_lantern').setOrigin(0.5, 1).setScale(1.15);
      const glowY = base - 380 * 1.15 + 64;
      const glow = this.add.image(lx, glowY, 'light_soft').setScale(0.9).setBlendMode(ADD).setTint(0xffc070).setAlpha(0.55);
      const pool = this.add.image(lx, inSpan ? 6 : DECK + 6, 'light_soft').setScale(2, 0.24).setBlendMode(ADD).setTint(0xffb060).setAlpha(0.25);
      if (inSpan) this.span.add([post, glow, pool]);
      else { post.setDepth(21); glow.setDepth(21); pool.setDepth(23); }
      this.lanterns.push({ x, post, glow, pool, on: true });
    }

    // Trams: one abandoned at the west end; Tram 6 pinned under the gantry.
    this.add.image(260, DECK + 6, 'br_tram').setOrigin(0.5, 1).setScale(1.05).setDepth(25).setTint(0xb8b0b8);
    this.tram6 = this.add.image(SPOT.tram - 60, DECK + 6, 'br_tram_crushed').setOrigin(0.5, 1).setScale(1.05).setDepth(25);
    this.gantry = this.add.image(SPOT.tram + 400, DECK - 300, 'br_gantry').setOrigin(1, 0.5).setScale(0.85).setDepth(26).setRotation(0.4);
    this.tramGlow = this.add.image(SPOT.tram - 60, DECK - 140, 'light_soft').setScale(3.8, 1.3).setBlendMode(ADD).setTint(0xffd090).setAlpha(0.2).setDepth(24);

    // Civilians crossing west, and the ones still stuck on the span.
    this.walkers = [];
    const r = rng(61);
    for (let i = 0; i < 16; i++) {
      const x = 950 + r() * 1500;
      if (Math.abs(x - SPOT.tram) < 140) continue;
      this.addWalker(x, r);
    }
    this.spanCrowd = [];
    for (let i = 0; i < 13; i++) {
      const x = 120 + r() * (SPAN.x1 - SPAN.x0 - 240);
      const p = this.add.image(x, 4 + r() * 6, `br_civ${Math.floor(r() * 6)}`).setOrigin(0.5, 1).setScale(1.16 + r() * 0.1).setTint(0x9a94a0).setFlipX(r() < 0.6).setAlpha(0);
      p.seed = r() * 6;
      this.span.add(p);
      this.spanCrowd.push(p);
    }

    // Ash and embers on the wind from the east.
    this.add.particles(0, 0, 'ember', {
      x: { min: 0, max: W }, y: { min: -100, max: 700 }, speedX: { min: -90, max: -30 }, speedY: { min: 10, max: 40 },
      lifespan: 9000, scale: { start: 0.8, end: 0.2 }, alpha: { start: 0.7, end: 0 }, frequency: 90, blendMode: 'ADD',
    }).setDepth(60);
    this.boy = this.add.image(SPOT.boy + 120, DECK + 2, 'br_boy').setOrigin(0.5, 1).setScale(1.1).setDepth(31).setFlipX(true);
    this.boy.setVisible(false);
  }

  addWalker(x, r = Math.random) {
    const p = this.add.image(x, DECK + 2 + r() * 8, `br_civ${Math.floor(r() * 6)}`).setOrigin(0.5, 1).setScale(1.16 + r() * 0.12).setDepth(30 + Math.floor(r() * 3)).setTint(0x8c8692).setFlipX(true);
    p.speed = 50 + r() * 50;
    p.seed = r() * 6;
    this.walkers.push(p);
    return p;
  }

  drawSpanHangers() {
    const g = this.spanHang;
    g.clear();
    this.spanLines.forEach((l) => {
      g.lineStyle(2, 0x2a2232, 1);
      if (l.snapped) {
        // A snapped hanger: a stub above, a whip-curled end below.
        g.lineBetween(l.x, l.top, l.x, l.top + 60);
        g.lineBetween(l.x, -RAIL, l.x + 8, -RAIL - 62);
      } else {
        g.lineBetween(l.x, l.top, l.x, -RAIL);
      }
    });
  }

  setLantern(l, on, { quick = false } = {}) {
    l.on = on;
    l.post.setTexture(on ? 'br_lantern' : 'br_lantern_off');
    const a = on ? [0.55, 0.25] : [0, 0];
    if (quick) { l.glow.setAlpha(a[0]); l.pool.setAlpha(a[1]); return; }
    this.tweens.add({ targets: l.glow, alpha: a[0], duration: 160 });
    this.tweens.add({ targets: l.pool, alpha: a[1], duration: 160 });
  }

  // --- frame loop -----------------------------------------------------------------
  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    this.player.update(dt);
    this.duel?.update(dt);
    this.star.update(dt);
    this.px.update(dt);
    this.cameraDir.update(dt);
    if (this.recording) ui.record.advance(dt * (this.slow || 1));
    const t = time / 1000;
    this.walkers = this.walkers.filter((p) => {
      p.x -= p.speed * dt * (this.slow || 1);
      p.y += Math.sin(t * 9 + p.seed) * 0.15;
      if (p.x < -80) { p.destroy(); return false; }
      return true;
    });
    this.spanCrowd.forEach((p) => { p.scaleY = p.scaleX * (1 + Math.sin(t * 2 + p.seed) * 0.01); });
    // Interference: the closer the two of them, the worse the signal.
    if (this.px.root.visible && this.star.root.visible && this.recording) {
      const d = Math.abs(this.px.x - this.star.x);
      if (d < 320 && Math.random() < dt * (320 - d) / 90) {
        ui.record.glitchPulse(90 + Math.random() * 140);
        if (Math.random() < 0.3) sfx.glitch({ gain: 0.08 });
      }
    }
    this.stageUpdate?.(dt);
  }

  cut(source, count = '') {
    ui.record.source(source, count);
    sfx.glitch({ gain: 0.05 });
  }

  // Walk Star (player-controlled) until she passes x; idle players get a nudge.
  async reach(x, label = RECORD.move) {
    this.player.enabled = true;
    ui.touch.setMovement(true);
    const dir = Math.sign(x - this.star.x) || 1;
    let idle = 0;
    let hinted = false;
    const unattended = new URLSearchParams(window.location.search).has('autoplay');
    await new Promise((resolve) => {
      this.stageUpdate = (dt) => {
        idle = input.axis() ? 0 : idle + dt;
        if (idle > 4 && !hinted) { hinted = true; ui.hint(`${label} ${dir > 0 ? '▶' : '◀'}`, 3600); }
        if (idle > (unattended ? 1.5 : 14)) { this.player.walkTo(x + dir * 6, { speed: 220 }); idle = -999; }
        if ((this.star.x - x) * dir >= 0) { this.stageUpdate = null; resolve(); }
      };
    });
    this.player.enabled = false;
    this.player.autoTarget = null;
    ui.touch.setMovement(false);
    ui.hint('');
    this.star.vx = 0;
  }

  setSlow(k) {
    this.slow = k;
    this.tweens.timeScale = k;
    this.time.timeScale = k;
  }

  // --- story ----------------------------------------------------------------------
  async run() {
    ui.letterbox(true);
    ui.showHud(false);
    ui.record.reset();
    ui.record.show(true);
    sound.hiss.start({ fadeIn: 1 });
    sound.bridge.start({ fadeIn: 2 });
    audio.setArchive(true, 0.1);
    if (this.startAt === 'duel') { await this.skipToDuel(); return this.meet(); }
    await this.opening();
    await this.rescueTram();
    await this.rescueBoy();
    await this.rescueHanger();
    await this.lightsOut();
    await this.meet();
  }

  async opening() {
    ui.record.gap('THE STARFALL RECORD', 'Vesper Civic Network · 1,412 public sources');
    await wait(this, 2800);
    ui.record.hideGap();
    await ui.record.card(RECORD.open, { hold: 1800, step: 1500 });
    ui.record.setTime(23, 31, 40);
    this.recording = true;
    this.cut(RECORD.sources.heli, 'SOURCE 0001 / 1412');
    this.cameraDir.shot(1700, 470, 0.66, 0);
    this.fx.tween({ fade: 0 }, 1400);
    this.cameraDir.shot(1300, 480, 0.72, 7000);
    sound.bridge.setCrowd(1);
    await wait(this, 4200);

    // She comes down like a dropped sun.
    const streak = this.add.image(900, -200, 'light_drip').setOrigin(0.5, 1).setBlendMode(ADD).setTint(0xffe8b0).setScale(0.6, 0.1).setAlpha(0).setDepth(55).setFlipY(true);
    sfx.flyBy({ pan: -0.1, gain: 0.1 });
    await new Promise((resolve) => this.tweens.add({
      targets: streak, y: DECK - 20, scaleY: 3.2, alpha: 1, duration: 650, ease: 'Cubic.easeIn', onComplete: resolve,
    }));
    streak.destroy();
    this.star.x = 900;
    this.star.setVisible(true);
    this.star.face(1, false);
    this.star.pose('land', 0);
    this.star.radiance = 1;
    sfx.landing({ gain: 1 });
    this.fx.flash({ r: 1, g: 0.92, b: 0.7, peak: 0.7, release: 900 });
    this.cameraDir.kick(16);
    const ring = this.add.image(900, DECK, 'light_soft').setScale(0.4, 0.1).setBlendMode(ADD).setTint(0xffe2a0).setAlpha(0.9).setDepth(48);
    this.tweens.add({ targets: ring, scaleX: 6, scaleY: 0.5, alpha: 0, duration: 900, onComplete: () => ring.destroy() });
    this.walkers.forEach((p) => { if (Math.abs(p.x - 900) < 400) p.speed *= 1.6; });
    this.cut(RECORD.sources.west, 'SOURCE 0214 / 1412');
    this.cameraDir.shot(1000, 470, 1.0, 1200);
    ui.record.note(RECORD.landing, 7000);
    await wait(this, 1600);
    this.tweens.add({ targets: this.star, radiance: 0, duration: 1600 });
    await this.star.pose('stance', 900);
    this.star.pose(null, 500);
    await ui.dialogue.play(RECORD.starArrive);
    this.cameraDir.follow(this.star, { lag: 0.06, lead: 200, zoom: 1.0, blend: 1000 });
  }

  async rescueTram() {
    await this.reach(SPOT.tram - 40);
    narrative.setStage('record');
    this.cut(RECORD.sources.tram, 'SOURCE 0377 / 1412');
    this.cameraDir.shot(SPOT.tram + 80, 470, 1.18, 900);
    await this.player.walkTo(SPOT.tram, { speed: 200 });
    this.star.face(1);
    // Under the low end of the gantry, she takes the weight.
    await this.star.pose('kneel', 400);
    sfx.bridgeGroan({ pan: 0.1, gain: 0.5, duration: 1.8 });
    ui.dialogue.play(RECORD.r1.lines);
    this.star.pose('hold', 1400);
    const base = this.gantry.rotation;
    const res = await qte(this, {
      type: 'hold', label: RECORD.r1.prompt, hold: 2200, x: VIEW_W * 0.5, y: VIEW_H * 0.36,
      onProgress: (p) => {
        this.gantry.rotation = base - p * 0.55;
        this.star.radiance = p * 0.8;
      },
    });
    narrative.setRecord('r1', res);
    if (res === 'fail') await new Promise((r) => this.tweens.add({ targets: this.gantry, rotation: base - 0.55, duration: 2600, onComplete: r }));
    // Heave it over the rail and into the river.
    this.star.pose('strike', 260);
    sfx.whoosh({ gain: 0.08, duration: 0.6 });
    this.tweens.add({ targets: this.gantry, x: this.gantry.x + 300, y: DECK + 700, rotation: -1.2, duration: 1300, ease: 'Quad.easeIn' });
    this.tweens.add({ targets: this.star, radiance: 0, duration: 900 });
    this.time.delayedCall(1250, () => sfx.distantBoom({ gain: 0.15 }));
    // Passengers climb out and go west.
    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(400 + i * 380, () => {
        const p = this.addWalker(SPOT.tram + 60 + i * 30);
        p.setAlpha(0);
        this.tweens.add({ targets: p, alpha: 1, duration: 300 });
      });
    }
    await ui.record.note(res === 'success' ? RECORD.r1.ok : RECORD.r1.fail, 6000);
    await ui.dialogue.play(RECORD.r1.after);
    this.star.pose(null, 400);
    this.cameraDir.follow(this.star, { lag: 0.06, lead: 200, zoom: 1.0, blend: 800 });
  }

  async rescueBoy() {
    this.boy.setVisible(true);
    this.boy.x = SPOT.boy + 140;
    await this.reach(SPOT.boy - 30);
    this.cut(RECORD.sources.phone212, 'SOURCE 0602 / 1412');
    // The deck lurches. A boy in a yellow coat goes through the railing.
    sfx.bridgeGroan({ pan: 0.2, gain: 0.9, duration: 2.4 });
    this.cameraDir.kick(18);
    this.cameraDir.shot(SPOT.boy + 80, 520, 1.25, 500);
    this.tweens.add({ targets: this.span, rotation: 0.012, y: DECK + 8, duration: 300, yoyo: true, ease: 'Sine.easeOut' });
    await wait(this, 350);
    const fallX = SPOT.boy + 150;
    this.tweens.add({ targets: this.boy, x: fallX, y: DECK - RAIL + 10, angle: 50, duration: 260, ease: 'Sine.easeOut' });
    await wait(this, 260);
    this.boy.setDepth(19);
    this.setSlow(0.25);
    audio.dip(800, 1.6);
    sfx.timeSlip();
    this.tweens.add({ targets: this.boy, y: DECK + 420, angle: 120, duration: 1100, ease: 'Quad.easeIn' });
    this.star.face(1);
    const res = await qte(this, { type: 'press', label: RECORD.r2.prompt, lead: 820, window: 230, x: VIEW_W * 0.6, y: VIEW_H * 0.6 });
    this.tweens.killTweensOf(this.boy);
    this.setSlow(1);
    narrative.setRecord('r2', res);
    // She's over the rail before anyone sees her move.
    this.star.x = fallX - 50;
    this.star.pose('catch', 120);
    this.cameraDir.kick(8);
    const hand = this.star.handWorld();
    if (res === 'success') {
      this.boy.setPosition(hand.x + 10, hand.y + 92).setAngle(180).setFlipY(false);
    } else {
      sfx.metalSet({ pan: 0.2 });
      this.cameraDir.kick(14);
      this.boy.setPosition(hand.x + 10, hand.y + 4).setAngle(0).setFlipY(true);
    }
    await wait(this, 600);
    ui.dialogue.play(res === 'success' ? RECORD.r2.lineOk : RECORD.r2.lineFail);
    await ui.record.note(res === 'success' ? RECORD.r2.ok : RECORD.r2.fail, 7000);
    // Back over the rail; he runs to a woman already running back for him.
    this.star.pose('stance', 400);
    this.boy.setFlipY(false).setAngle(0).setDepth(31).setPosition(this.star.x - 50, DECK + 2);
    this.tweens.add({ targets: this.boy, x: -80, duration: 16000 });
    this.star.pose(null, 400);
    this.cameraDir.follow(this.star, { lag: 0.06, lead: 200, zoom: 1.0, blend: 800 });
  }

  async rescueHanger() {
    await this.reach(SPOT.hanger - 50);
    this.cut(RECORD.sources.deck, 'SOURCE 0815 / 1412');
    this.spanCrowd.forEach((p) => this.tweens.add({ targets: p, alpha: 1, duration: 600 }));
    // A hanger lets go with a crack like a rifle.
    const line = this.spanLines.reduce((a, b) => (Math.abs(b.x + SPAN.x0 - SPOT.hanger) < Math.abs(a.x + SPAN.x0 - SPOT.hanger) ? b : a));
    line.snapped = true;
    this.drawSpanHangers();
    sfx.cableSnap({ pan: 0.1 });
    this.cameraDir.kick(20);
    this.tweens.add({ targets: this.span, rotation: 0.02, y: DECK + 24, duration: 900, ease: 'Sine.easeIn' });
    this.cameraDir.shot(SPOT.hanger, 420, 1.1, 700);
    await this.player.walkTo(SPOT.hanger - 20, { speed: 320 });
    this.star.face(1);
    ui.dialogue.play(RECORD.r3.lines);
    this.star.pose('strain', 260);
    // Light runs up the cable from her hands.
    const beam = this.add.image(SPOT.hanger + 12, DECK - 260, 'light_beam').setOrigin(0.5, 1).setBlendMode(ADD).setTint(0xffe2a0).setScale(0.3, 0.4).setAlpha(0).setDepth(51);
    const res = await qte(this, {
      type: 'mash', label: RECORD.r3.prompt, presses: 14, limit: 6000, x: VIEW_W * 0.5, y: VIEW_H * 0.3,
      onProgress: (p) => {
        beam.setAlpha(p * 0.7);
        this.star.radiance = p;
        this.span.rotation = 0.02 * (1 - p);
        this.span.y = DECK + 24 * (1 - p);
      },
    });
    narrative.setRecord('r3', res);
    if (res === 'success') {
      this.tweens.add({ targets: this.span, rotation: 0, y: DECK, duration: 500 });
    } else {
      sfx.bridgeGroan({ gain: 1, duration: 2 });
      this.cameraDir.kick(22);
      await new Promise((r) => this.tweens.add({ targets: this.span, rotation: 0.006, y: DECK + 16, duration: 380, ease: 'Bounce.easeOut', onComplete: r }));
      this.tweens.add({ targets: this.span, rotation: 0, y: DECK + 6, duration: 1800 });
    }
    this.tweens.add({ targets: beam, alpha: 0, duration: 900, onComplete: () => beam.destroy() });
    this.tweens.add({ targets: this.star, radiance: 0, duration: 900 });
    await ui.record.note(res === 'success' ? RECORD.r3.ok : RECORD.r3.fail, 6200);
    this.star.pose(null, 400);
  }

  async lightsOut() {
    this.cut(RECORD.sources.east, 'SOURCE 0919 / 1412');
    ui.record.setTime(23, 37, 12);
    this.cameraDir.shot(3100, 450, 0.82, 2600);
    sound.bridge.setCrowd(0.5);
    sound.bridge.setWind(1);
    await wait(this, 1200);
    ui.record.note(RECORD.lightsOut, 7400);
    // From the far end, one at a time, like someone walking toward us.
    const east = this.lanterns.filter((l) => l.x > SPAN.x1 + 40).sort((a, b) => b.x - a.x);
    for (const l of east) {
      this.setLantern(l, false);
      sfx.lanternOut({ pan: Phaser.Math.Clamp((l.x - 3000) / 1200, -1, 1) });
      if (l.x < SPOT.px + 260 && !this.px.root.visible) {
        // He is simply there, in the dark the lanterns left.
        this.px.setVisible(true);
        this.px.visorLevel = 0;
        this.tweens.add({ targets: this.px, visorLevel: 1, duration: 1200 });
        ui.record.glitchPulse(260);
      }
      await wait(this, 520);
    }
    await wait(this, 1200);
    this.cameraDir.follow(this.star, { lag: 0.06, lead: 240, zoom: 1.0, blend: 1000 });
    this.player.setBounds(SPAN.x0 + 200, SPOT.px - 260);
    await this.reach(SPOT.meet);
  }

  async skipToDuel() {
    ui.record.setTime(23, 37, 40);
    this.recording = true;
    this.cut(RECORD.sources.east, 'SOURCE 0919 / 1412');
    this.lanterns.filter((l) => l.x > SPAN.x1 + 40).forEach((l) => this.setLantern(l, false, { quick: true }));
    this.spanCrowd.forEach((p) => p.setAlpha(1));
    this.gantry.setVisible(false);
    this.star.setVisible(true);
    this.star.x = SPOT.meet;
    this.star.face(1, false);
    this.px.setVisible(true);
    this.cameraDir.shot(3050, 450, 1.0, 0);
    await this.fx.fadeTo(0, 1200);
  }

  // --- Parallax --------------------------------------------------------------------
  async meet() {
    narrative.setStage('duel');
    ui.record.setTime(23, 38, 2);
    this.cut(RECORD.sources.phone88, 'SOURCE 1108 / 1412');
    ui.record.interference(true);
    sfx.glitch({ gain: 0.2 });
    this.cameraDir.pair(this.star, this.px, { zoom: 1.2, y: 470 });
    this.star.pose('stance', 600);
    this.px.pose('still', 600);
    await wait(this, 900);
    ui.record.interference(false);
    await ui.dialogue.play(RECORD.meet);

    // Who moved first?
    const c1 = await ui.record.choose(RECORD.choice1);
    narrative.setRecord('firstStrike', c1.key);
    ui.record.note({ wit: 'THE RECORD', text: RECORD.choice1.kept }, 4200);
    sound.duel.start({ bpm: 118, intensity: 1 });
    this.duel = new Duel(this, {
      star: this.star, foe: this.px, player: this.player, minX: ARENA.min, maxX: ARENA.max, groundY: DECK,
      onStarHit: (n) => this.onStarHit(n),
    });

    if (c1.key === 'her') {
      // Her account: Star strikes first. He was ready for it.
      const r = await qte(this, { type: 'press', label: 'Strike', lead: 700, window: 240, x: VIEW_W * 0.5, y: VIEW_H * 0.34 });
      void r;
      this.star.pose('strike', 90);
      this.tweens.add({ targets: this.star.root, x: this.px.x - 150, duration: 140, ease: 'Cubic.easeOut' });
      await wait(this, 140);
      sfx.parry({});
      this.cameraDir.kick(10);
      this.px.pose('guard', 80);
      this.tweens.add({ targets: this.star.root, x: this.px.x - 300, duration: 260, ease: 'Cubic.easeOut' });
      await wait(this, 400);
    }

    const d = RECORD.duel;
    const p1 = this.duel.run(1, { hits: 3, barks: d.pxBarks, starBarks: d.stBarks });
    if (c1.key === 'him') this.duel.f.next = 500;
    const stats1 = await p1;
    await this.clash();
    sound.duel.setIntensity(2);
    this.cut(RECORD.sources.recon, 'SOURCE — / 1412');
    if (stats1.hitsTaken > 0) ui.record.note(d.hitWit, 6000);
    const stats2 = await this.duel.run(2, { hits: 3, barks: d.pxBarks2, starBarks: [] });
    narrative.setRecord('hitsTaken', stats1.hitsTaken + stats2.hitsTaken);
    narrative.setRecord('perfect', stats1.perfect + stats2.perfect);
    await this.spanFails();
  }

  onStarHit() {
    // Every time he hits her the lights on the whole bridge dip.
    this.lanterns.filter((l) => l.on).forEach((l) => {
      this.tweens.add({ targets: [l.glow, l.pool], alpha: 0.05, duration: 60, yoyo: true, hold: 120 });
    });
  }

  async clash() {
    // They meet in the middle, light against dark, and push.
    const mid = (this.star.x + this.px.x) / 2;
    this.star.face(1);
    this.px.face(-1);
    this.star.pose('lunge', 160);
    this.px.pose('lunge', 160);
    this.tweens.add({ targets: this.star.root, x: mid - 70, duration: 180, ease: 'Cubic.easeIn' });
    this.tweens.add({ targets: this.px.root, x: mid + 70, duration: 180, ease: 'Cubic.easeIn' });
    await wait(this, 180);
    sfx.lightStrike({});
    sfx.umbralStrike({ gain: 0.7 });
    this.cameraDir.kick(20);
    this.cameraDir.shot(mid, 470, 1.35, 600);
    this.fx.flash({ r: 1, g: 0.9, b: 1, peak: 0.6, release: 700 });
    const core = this.add.image(mid, DECK - 230, 'light_soft').setBlendMode(ADD).setTint(0xffe2a0).setScale(0.6).setDepth(55);
    const dark = this.add.image(mid + 30, DECK - 230, 'light_soft').setBlendMode(ADD).setTint(0x7b4bc4).setScale(0.6).setDepth(55);
    sound.duel.setIntensity(0);
    const res = await qte(this, {
      type: 'mash', label: RECORD.duel.clash, presses: 14, limit: 7500, x: VIEW_W * 0.5, y: VIEW_H * 0.28,
      onProgress: (p) => {
        const k = p - 0.5;
        core.setScale(0.6 + p * 0.8).setX(mid - 10 + k * 60);
        dark.setScale(1.2 - p * 0.7).setX(mid + 30 + k * 60);
        this.star.radiance = p;
        this.fx.set({ exposure: 1 + p * 0.25 });
      },
    });
    narrative.setRecord('clash', res);
    this.fx.tween({ exposure: 1 }, 600);
    core.destroy();
    dark.destroy();
    this.star.radiance = 0;
    // Either way they break apart; only the distance differs.
    const push = res === 'success' ? 260 : 120;
    this.tweens.add({ targets: this.px.root, x: Math.min(ARENA.max + 100, this.px.x + push), duration: 420, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: this.star.root, x: Math.max(ARENA.min, this.star.x - (res === 'success' ? 40 : 160)), duration: 420, ease: 'Cubic.easeOut' });
    this.px.pose('hit', 200);
    this.star.pose('stance', 300);
    sfx.lowImpact({ gain: 0.4 });
    await wait(this, 700);
    this.px.pose('still', 600);
    await ui.dialogue.play([RECORD.duel.afterClash]);
    this.cameraDir.pair(this.star, this.px, { zoom: 1.2, y: 470 });
  }

  // The span is going. The Record keeps two accounts of what she did.
  async spanFails() {
    narrative.setStage('span');
    ui.record.setTime(23, 40, 58);
    this.cut(RECORD.sources.east, 'SOURCE 0919 / 1412');
    sound.duel.hush(0.2);
    sfx.bridgeGroan({ gain: 1.2, duration: 4 });
    this.cameraDir.kick(16);
    this.star.pose('stance', 300);
    this.px.pose('still', 600);
    this.px.face(-1);
    this.star.face(-1);
    // Hangers going, one after another, from the middle out.
    const order = [...this.spanLines].sort((a, b) => Math.abs(a.x - 550) - Math.abs(b.x - 550));
    order.slice(0, 6).forEach((l, i) => this.time.delayedCall(i * 380, () => {
      l.snapped = true;
      this.drawSpanHangers();
      sfx.cableSnap({ pan: (l.x - 550) / 800, gain: 0.7 });
    }));
    this.tweens.add({ targets: this.span, rotation: 0.025, y: DECK + 40, duration: 3000, ease: 'Sine.easeIn' });
    this.cameraDir.shot(2450, 450, 0.8, 1800);
    await wait(this, 2600);
    const c2 = await ui.record.choose(RECORD.choice2);
    narrative.setRecord('span', c2.key);

    let spanLine;
    if (c2.key === 'chose') {
      // A prompt that never answers. She looks at the bridge. Then at him.
      this.star.face(-1);
      this.star.pose('stance', 400);
      this.cameraDir.shot(2900, 470, 1.15, 2600);
      const held = qte(this, { type: 'rigged', looks: 'hold', label: RECORD.choice2.hold, cap: 0.08, stallMs: 2600, hold: 3000, x: VIEW_W * 0.42, y: VIEW_H * 0.3 });
      await wait(this, 1700);
      this.star.face(1);
      this.star.pose('still', 900);
      spanLine = ui.dialogue.play(RECORD.spanLines.chose);
      await held;
    } else {
      // She tries. The prompt fills, and stalls, and drains.
      this.star.face(-1);
      this.tweens.add({ targets: this.star.root, x: SPAN.x1 + 90, duration: 380, ease: 'Cubic.easeOut' });
      this.star.pose('strain', 300);
      this.cameraDir.shot(SPAN.x1, 450, 1.0, 900);
      const beam = this.add.image(SPAN.x1 + 40, DECK - 240, 'light_beam').setOrigin(0.5, 1).setBlendMode(ADD).setTint(0xffe2a0).setScale(0.4, 0.6).setAlpha(0).setDepth(51);
      await qte(this, {
        type: 'rigged', looks: 'mash', label: RECORD.choice2.hold, cap: 0.82, presses: 12, stallMs: 1500, limit: 7000, x: VIEW_W * 0.5, y: VIEW_H * 0.3,
        onProgress: (p) => { beam.setAlpha(p * 0.8); this.star.radiance = p; },
      });
      this.tweens.add({ targets: beam, alpha: 0, duration: 300, onComplete: () => beam.destroy() });
      this.star.radiance = 0;
      this.star.pose('kneel', 700);
      spanLine = ui.dialogue.play(RECORD.spanLines.couldnt);
    }
    await this.collapse(spanLine);
  }

  async collapse(spanLine) {
    sound.duel.stop(0.4);
    sfx.collapse();
    this.cameraDir.kick(30);
    this.lanterns.filter((l) => l.x > SPAN.x0 && l.x < SPAN.x1).forEach((l) => this.setLantern(l, false));
    this.tweens.add({ targets: this.span, y: DECK + 900, rotation: 0.12, duration: 2600, ease: 'Quad.easeIn' });
    await wait(this, 650);
    // 23:41:02. Every camera on the centre span loses signal at once.
    ui.record.interference(true);
    sfx.glitch({ gain: 0.6 });
    await wait(this, 260);
    ui.record.interference(false);
    this.recording = false;
    this.fx.set({ fade: 1 });
    sound.bridge.stop(0.05);
    audio.cutWorld(0.05);
    ui.dialogue.complete?.();
    ui.dialogue.hide();
    void spanLine;
    ui.record.gap(RECORD.noFootage, RECORD.noFootageSub);
    await wait(this, 4200);
    ui.record.hideGap();
    await wait(this, 800);
    audio.restoreWorld(1);
    sfx.bell?.({ freq: 110, gain: 0.05, decay: 6 });
    await ui.record.card(RECORD.failed, { hold: 3200, step: 2000 });
    await ui.record.note(RECORD.w07, 7600);
    await wait(this, 600);
    ui.record.gap(RECORD.continues, '');
    await wait(this, 2600);
    ui.record.hideGap();
    sound.hiss.stop(0.5);
    this.scene.start('Sky', {});
  }

  shutdown() {
    this.duel?.stop();
  }
}
