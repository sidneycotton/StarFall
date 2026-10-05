import Phaser from 'phaser';
import { ui } from '../ui/UI.js';
import { narrative } from '../core/NarrativeState.js';
import { audio } from '../audio/AudioEngine.js';
import { sound } from '../audio/soundscape.js';
import * as sfx from '../audio/sfx.js';
import { ScreenFX } from '../fx/ScreenFX.js';
import { CameraDirector } from '../systems/CameraDirector.js';
import { Interactions } from '../systems/Interactions.js';
import { wait, tween } from '../systems/Cutscene.js';
import { Parallax } from '../entities/Parallax.js';
import { PlayerController } from '../entities/PlayerController.js';
import { PenthouseWorld, D } from './penthouse/PenthouseWorld.js';
import { Lighting } from './penthouse/Lighting.js';
import { WORLD_W, L, SF, px } from './penthouse/layout.js';
import { CAPTIONS, INTERACTABLES, NEWS, SPINE_ALERTS, STAR_PROTOCOL, RUN } from '../data/script.js';

// The penthouse: waking, exploring, the helmet, and — after the call — the run.
// Each phase is a straight-line async method; per-frame work lives in update().

const ADD = Phaser.BlendModes.ADD;

export class PenthouseScene extends Phaser.Scene {
  constructor() {
    super('Penthouse');
  }

  init(data) {
    this.startAt = data?.start || 'wake';
  }

  create() {
    this.world = new PenthouseWorld(this);
    this.fx = new ScreenFX(this);
    this.cameraDir = new CameraDirector(this, { minX: 0, maxX: WORLD_W, y: 450 });
    this.lighting = new Lighting(this, this.world, this.fx);
    this.rig = new Parallax(this, 3560, L.lane, { outfit: 'robe' }).setDepth(D.player);
    this.player = new PlayerController(this, this.rig, { minX: L.exploreMin, maxX: L.equipTrigger + 40 });
    this.interactions = new Interactions(this, this.rig, this.cameraDir);
    this.interactions.setEnabled(false);
    this.registerInteractables();
    this.state = { wind: 0, trafficScale: 1 };
    this.stageUpdate = null;
    this.helmetHeld = false;
    this.zoneZoom = true;

    this.events.on('interaction:start', () => { this.player.enabled = false; ui.touch.setMovement(false); });
    this.events.on('interaction:end', () => {
      if (narrative.stage === 'explore') { this.player.enabled = true; ui.touch.setMovement(true); }
    });

    const phase = { wake: () => this.wake(), explore: () => this.skipToExplore(), aftermath: () => this.aftermath() }[this.startAt];
    phase();
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    this.player.update(dt);
    this.rig.update(dt);
    if (this.helmetHeld) {
      const h = this.rig.handWorld();
      this.world.helmet.setPosition(h.x + 4 * this.rig.facing, h.y + 34);
    }
    if (this.zoneZoom && this.cameraDir.mode === 'follow') {
      this.cameraDir.zoom += (this.areaZoom() - this.cameraDir.zoom) * Math.min(1, dt * 0.6);
    }
    this.cameraDir.update(dt);
    this.world.update(time, dt, this.state);
    this.lighting.update(time, this.cameras.main);
    this.interactions.update();
    this.stageUpdate?.(dt, time);
  }

  areaZoom() {
    const x = this.rig.x;
    if (narrative.stage === 'run') return x < 3000 ? 1.06 : 1.0;
    if (x < 4700) return 1.12;
    if (x < 6300) return 1.0;
    if (x < 7400) return 1.08;
    return 1.14;
  }

  say(lines) {
    return ui.dialogue.play(lines);
  }

  // ======================================================================
  // WAKE — sound first, then a red pulse, then violet.
  // ======================================================================
  async wake() {
    narrative.setStage('wake');
    const w = this.world;
    this.rig.setVisible(false);
    this.lighting.violet = 0;
    this.lighting.alarm = 0.32;
    this.fx.set({ warp: 0.6, aberration: 1.1 });
    ui.letterbox(true);
    w.darkness.setAlpha(1);
    w.relayLed.setDepth(D.dark + 1);
    w.relayHalo.setDepth(D.dark + 1);
    this.cameraDir.shot(L.nightstand - 30, 690, 2.1, 0);

    sound.sirens.start({ count: 1, muffle: 1, gain: 0.32, fadeIn: 5 });
    sound.room.start({ gain: 0.7, fadeIn: 9 });
    await wait(this, 1200);
    ui.caption(CAPTIONS.siren, 4200);
    await wait(this, 3800);
    sound.alarm.start({ fadeIn: 2.5 });
    await wait(this, 1400);
    ui.caption(CAPTIONS.vibration, 4400);
    await wait(this, 6200);

    // Violet seeps in.
    sound.party.start({ gain: 0.55, life: 85 });
    tween(this, { targets: w.darkness, alpha: 0, duration: 8000, ease: 'Sine.easeInOut' });
    tween(this, { targets: this.lighting, violet: 1, duration: 9000, ease: 'Sine.easeIn' });
    this.cameraDir.shot(L.nightstand + 10, 660, 1.85, 8000);
    await wait(this, 8200);
    w.relayLed.setDepth(D.prop + 2);
    w.relayHalo.setDepth(D.light);

    // Establishing: the bed beneath the oculus and its eclipse.
    await this.cameraDir.shot(L.bed - 60, 470, 1.16, 7500);
    await wait(this, 1800);

    // The hand.
    await this.cameraDir.shot(L.nightstand + 110, 640, 1.75, 2800);
    await wait(this, 600);
    sfx.cloth({ duration: 1.4, gain: 0.03, bright: 0.7 });
    await tween(this, { targets: w.arm, rotation: 0.6, duration: 2600, ease: 'Sine.easeInOut' });
    await wait(this, 700);
    tween(this, { targets: w.arm, rotation: 0.97, duration: 520, ease: 'Sine.easeIn' });
    await wait(this, 330);
    this.knockGlass();
    await wait(this, 2900);
    tween(this, { targets: w.arm, rotation: 0.78, duration: 1400, ease: 'Sine.easeOut' });
    await wait(this, 1700);

    // Cut. Sitting on the edge of the bed.
    this.fx.set({ fade: 1 });
    sfx.cloth({ duration: 0.9, gain: 0.06 });
    await wait(this, 520);
    w.pxLying.setVisible(false);
    w.arm.setVisible(false);
    this.rig.setVisible(true);
    this.rig.x = 3560;
    this.rig.face(-1, false);
    this.rig.presetTo = 'sitBed';
    this.rig.presetT = 1;
    this.rig.breath = 0.18;
    this.cameraDir.shot(3500, 600, 1.42, 0);
    await this.fx.fadeTo(0, 700);
    await wait(this, 1200);
    sfx.exhale({ gain: 0.04, duration: 1.8 });
    await wait(this, 2200);
    sfx.cloth({ duration: 1.2, gain: 0.05 });
    await this.rig.pose(null, 1800, 'Sine.easeInOut');
    this.rig.breath = 0.25;
    await wait(this, 400);
    this.explore();
  }

  knockGlass() {
    const g = this.world.glass;
    sfx.glassKnockOver({ pan: -0.3 });
    ui.caption(CAPTIONS.glass, 2400);
    this.tweens.add({ targets: g, angle: -78, x: g.x - 22, duration: 380, ease: 'Quad.easeIn' });
    this.tweens.add({
      targets: g, y: 806, duration: 420, delay: 80, ease: 'Quad.easeIn',
      onComplete: () => {
        this.tweens.add({ targets: g, y: 798, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
        this.tweens.add({ targets: g, x: g.x - 70, angle: -90 - 160, duration: 2200, ease: 'Cubic.easeOut' });
      },
    });
  }

  skipToExplore() {
    const w = this.world;
    w.darkness.setAlpha(0);
    w.pxLying.setVisible(false);
    w.arm.setVisible(false);
    w.glass.setPosition(w.glass.x - 92, 806).setAngle(-250);
    this.lighting.violet = 1;
    this.lighting.alarm = 0.32;
    this.fx.set({ warp: 0.6, aberration: 1.1 });
    sound.sirens.start({ count: 1, muffle: 1, gain: 0.32, fadeIn: 3 });
    sound.room.start({ gain: 0.7, fadeIn: 3 });
    sound.alarm.start({ fadeIn: 2 });
    sound.party.start({ gain: 0.5, life: 60 });
    this.cameraDir.shot(this.rig.x, 450, 1.12, 0);
    this.explore();
  }

  // ======================================================================
  // EXPLORE — no tutorial; the room teaches.
  // ======================================================================
  explore() {
    narrative.setStage('explore');
    ui.letterbox(false);
    this.player.setProfile('tired');
    this.player.setBounds(L.exploreMin, L.equipTrigger + 40);
    this.player.enabled = true;
    ui.touch.setMovement(true);
    this.interactions.setEnabled(true);
    this.cameraDir.follow(this.rig, { lag: 0.035, lead: 150, zoom: 1.12, blend: 2000 });
    this.time.delayedCall(9000, () => ui.panels.showCorner(true));

    let warnedNear = false;
    this.stageUpdate = () => {
      const d = Math.abs(L.altar - this.rig.x);
      const prox = Phaser.Math.Clamp(1 - d / 4800, 0, 1);
      sound.alarm.setProximity(prox);
      this.lighting.alarm = 0.3 + prox * 0.55;
      if (prox > 0.8 && !warnedNear) {
        warnedNear = true;
        ui.caption(CAPTIONS.alarmNear, 3600);
      }
      if (this.rig.x > L.equipTrigger && !this.equipping) this.equip();
    };
  }

  inspect(id, x, y, { range = 95, once = false, run } = {}) {
    const def = INTERACTABLES[id];
    this.interactions.add({
      id, label: def.label, x, y, range, once,
      run: async () => {
        this.rig.vx = 0;
        if (run) await run(def);
        else await this.say(def.lines);
      },
    });
  }

  registerInteractables() {
    const w = this.world;
    this.inspect('door', L.eclipseDoor + 100, 560, { range: 120, run: async (def) => {
      this.rig.face(-1);
      await this.say(def.lines);
    } });
    this.inspect('sleeper', 4010, 570, { once: true, range: 110, run: async (def) => {
      await this.rig.pose('lean', 800);
      sfx.sheetPull();
      tween(this, { targets: w.sheetCover, alpha: 0.9, scaleY: 0.45, duration: 1100, ease: 'Sine.easeOut' });
      narrative.setFlag('sleeperCovered');
      await wait(this, 900);
      await this.rig.pose(null, 900);
      await this.say(def.lines);
    } });
    this.inspect('mask', L.mask, 760);
    this.inspect('cape', L.capeReplica + 20, 600);
    this.inspect('bottle', L.bottle, 762);
    this.inspect('letters', L.console - 30, 610, { run: async (def) => {
      sfx.paperShuffle();
      this.rig.lookOffset = 0.15;
      await wait(this, 500);
      await this.say(def.lines);
      this.rig.lookOffset = 0;
    } });
    this.inspect('trophy', L.trophy, 520, { run: async (def) => {
      await wait(this, 400);
      await this.say(def.lines);
    } });
    this.inspect('figurine', L.figurine, 760, { run: async (def) => {
      // Parallax pauses. Then two words. Nothing else.
      this.cameraDir.shot(L.figurine - 40, 640, 1.32, 1800);
      this.rig.lookOffset = 0.3;
      await wait(this, 2300);
      await this.say(def.lines);
      narrative.setFlag('starFigurineExamined');
      this.rig.lookOffset = 0;
      this.cameraDir.follow(this.rig, { lag: 0.035, lead: 150, zoom: this.areaZoom(), blend: 1600 });
    } });
  }

  // ======================================================================
  // EQUIP — the helmet. The persona returns.
  // ======================================================================
  async equip() {
    this.equipping = true;
    narrative.setStage('equip');
    const w = this.world;
    this.player.enabled = false;
    this.interactions.setEnabled(false);
    ui.touch.setMovement(false);
    ui.letterbox(true);
    this.stageUpdate = null;
    sound.alarm.setProximity(0.85);
    tween(this, { targets: this.lighting, alarm: 0.85, duration: 1500 });
    this.cameraDir.shot(L.vestry + 70, 560, 1.32, 2000);
    await this.player.walkTo(L.vestry, { speed: 120 });
    this.rig.face(1);
    await wait(this, 500);

    // Darkness for the change: robe off, suit on, heard more than seen.
    await tween(this, { targets: w.darkness, alpha: 0.94, duration: 700, ease: 'Sine.easeIn' });
    sfx.cloth({ duration: 1.0, gain: 0.08 });
    await wait(this, 500);
    sfx.suitAssemble();
    const traces = [];
    for (let i = 0; i < 7; i++) {
      const tr = this.add.image(this.rig.x + (Math.random() - 0.5) * 50, 800 - 40 - i * 36, 'light_streak')
        .setDisplaySize(70, 3).setBlendMode(ADD).setTint(0xb79cff).setAlpha(0).setDepth(D.dark + 2);
      traces.push(tr);
      this.tweens.add({ targets: tr, alpha: 0.9, duration: 90, delay: 120 + i * 140, yoyo: true, hold: 60 });
    }
    await wait(this, 700);
    this.rig.setOutfit('suit');
    this.rig.breath = 0.22;
    w.suitForm.setTexture('form_empty');
    w.robeHeap.setAlpha(1);
    await wait(this, 1300);
    traces.forEach((t) => t.destroy());
    await tween(this, { targets: w.darkness, alpha: 0, duration: 1100, ease: 'Sine.easeOut' });
    await wait(this, 500);

    await this.player.walkTo(L.pedestal - 64, { speed: 110 });
    this.rig.face(1);
    await wait(this, 500);
    // Hands to the back of the head: gathering hair out of the way.
    sfx.cloth({ duration: 0.7, gain: 0.025, bright: 1.6 });
    await this.rig.pose('gatherHair', 900);
    await wait(this, 800);
    await this.rig.pose('holdHelmet', 900);
    this.helmetHeld = true;
    w.helmet.setDepth(D.player + 1).setOrigin(0.5, 1);
    sfx.metalSet({ pan: 0.1 });
    this.cameraDir.shot(L.pedestal - 40, 560, 1.55, 2000);
    await wait(this, 1700);
    await this.rig.pose('raiseHelmet', 1000);
    await wait(this, 300);
    await this.rig.pose('lowerHelmet', 600, 'Quad.easeIn');

    // KSSSH — thump — voice modulator online.
    this.helmetHeld = false;
    w.helmet.setVisible(false);
    this.rig.setHelmet(true);
    this.rig.visorLevel = 0;
    sfx.helmetSeal();
    ui.caption(CAPTIONS.helmet, 2200);
    this.cameraDir.kick(5);
    this.fx.flash({ r: 0.55, g: 0.42, b: 1, peak: 0.18, attack: 20, release: 600 });
    audio.setHelmet(true);
    this.tweens.add({ targets: this.rig.halo, alpha: 0.85, duration: 1600, delay: 600 });
    this.tweens.add({ targets: this.rig, visorLevel: 1, duration: 120, delay: 640, yoyo: true, repeat: 1, onComplete: () => {
      this.tweens.add({ targets: this.rig, visorLevel: 1, duration: 500 });
    } });
    this.fx.tween({ warp: 0, aberration: 0.55 }, 1400);
    sound.breath.start({ gain: 0.7, rate: 0.2 });
    await wait(this, 1100);
    this.rig.posture = 1;
    await this.rig.pose('standTall', 800, 'Back.easeOut');
    ui.showHud(true);
    ui.showNameCard(4600);
    await wait(this, 2600);
    this.rig.pose(null, 700);

    // To the eclipse chair.
    this.cameraDir.shot(L.seat + 120, 520, 1.25, 2400);
    this.player.setProfile('precise');
    await this.player.walkTo(L.seat, { speed: 150 });
    this.rig.face(1);
    this.world.chair.setDepth(D.player - 2);
    await this.rig.pose('sitChair', 900);
    this.lighting.setSeerPoints([1, 1, 1]);
    sound.callTone.start();
    await wait(this, 1400);
    this.cameraDir.shot(L.glass, 320, 2.3, 3600, 'Sine.easeIn');
    await wait(this, 2500);
    await this.fx.fadeTo(1, 1100);
    narrative.setStage('call');
    ui.showHud(false);
    this.scene.start('SeerCall');
  }

  // ======================================================================
  // AFTERMATH — the first time Parallax is afraid.
  // ======================================================================
  async aftermath() {
    narrative.setStage('aftermath');
    const w = this.world;
    w.darkness.setAlpha(0);
    w.pxLying.setVisible(false);
    w.arm.setVisible(false);
    w.glass.setPosition(w.glass.x - 92, 806).setAngle(-250);
    w.suitForm.setTexture('form_empty');
    w.robeHeap.setAlpha(1);
    w.helmet.setVisible(false);
    w.chair.setDepth(D.player - 2);
    this.rig.setOutfit('suit');
    this.rig.setHelmet(true, true);
    this.rig.posture = 1;
    this.rig.x = L.seat;
    this.rig.face(1, false);
    this.rig.presetTo = 'sitChair';
    this.rig.presetT = 1;
    this.lighting.violet = 0.5;
    this.lighting.alarm = 0;
    this.lighting.setSeerPoints([0, 0, 0.6]);
    this.fx.set({ fade: 1, desat: 0.25, aberration: 0.5 });
    ui.letterbox(true);
    ui.showHud(true, true);

    sound.room.start({ gain: 0.5, fadeIn: 6 });
    sound.breath.start({ gain: 0.8, rate: 0.24 });
    audio.setHelmet(true, 0.05);
    audio.restoreWorld(5);

    this.cameraDir.shot(L.seat + 70, 640, 1.95, 0);
    await this.fx.fadeTo(0, 2200);
    await wait(this, 1600);

    // The hand slowly leaves the workstation.
    this.cameraDir.shot(L.seat + 30, 600, 1.75, 4000);
    await this.rig.pose('sitChairHandAway', 2800, 'Sine.easeInOut');
    await wait(this, 900);
    // Fingers tremble — once.
    this.rig.fear = 1;
    this.tweens.add({ targets: this.rig, fear: 0.12, duration: 700, ease: 'Quad.easeOut' });
    sound.breath.setRate(0.5, 1.1);
    await wait(this, 1700);

    // Stands too quickly. The chair goes over.
    this.rig.pose(null, 240, 'Quad.easeOut');
    this.tweens.add({ targets: w.chair, rotation: -1.42, x: w.chair.x - 30, duration: 460, ease: 'Quad.easeIn', onComplete: () => {
      this.tweens.add({ targets: w.chair, rotation: -1.32, duration: 110, yoyo: true, ease: 'Quad.easeOut' });
    } });
    this.time.delayedCall(380, () => { sfx.chairFall(); this.cameraDir.kick(7); });
    this.cameraDir.shot(L.seat - 40, 520, 1.35, 900, 'Quad.easeOut');
    await wait(this, 1300);
    this.rig.face(-1);
    await wait(this, 900);
    this.run();
  }

  // ======================================================================
  // RUN — something global has begun.
  // ======================================================================
  run() {
    narrative.setStage('run');
    const w = this.world;
    sound.run.start();
    sound.sirens.start({ count: 2, muffle: 0.75, gain: 0.4, fadeIn: 3 });
    ui.letterbox(false);
    this.player.setProfile('run');
    this.player.setBounds(L.eclipseDoor + 80, L.seat);
    this.player.enabled = true;
    ui.touch.setMovement(true);
    this.cameraDir.follow(this.rig, { lag: 0.075, lead: 260, zoom: 1.0, blend: 1200 });
    this.cameraDir.lead = -200;
    this.lighting.setSeerPoints([0, 0, 0.25]);
    tween(this, { targets: this.lighting, violet: 0.6, duration: 2000 });
    this.fx.tween({ desat: 0.15 }, 2000);

    const ev = (x, fn) => ({ x, fn, done: false });
    this.runEvents = [
      ev(7300, () => {
        sfx.distantBoom({ pan: -0.5, gain: 0.25 });
        this.world.searchlights.forEach((s, i) => this.tweens.add({ targets: s, alpha: 0.13, duration: 2000, delay: i * 400 }));
        sound.sirens.grow(2);
        this.lighting.windowLevel = 1.4;
      }),
      ev(6600, () => this.openShutters()),
      ev(6150, () => this.wakeNews()),
      ev(5400, () => {
        this.state.wind = 1;
        this.tweens.add({ targets: this.state, trafficScale: 0.15, duration: 3000 });
        sound.run.escalate(2);
        sfx.distantBoom({ pan: 0.4, gain: 0.3 });
      }),
      ev(4650, () => this.herWakes()),
      ev(3800, () => this.openDoor(this.world.eclipseDoor, () => this.player.setBounds(140, L.seat))),
      ev(2950, () => { sound.run.escalate(3); this.wakeSpine(); }),
      ev(1550, () => this.starProtocol()),
      ev(560, () => this.openDoor(this.world.chamberDoor)),
      ev(330, () => this.enterChamber()),
    ];
    this.spineOpened = new Set();
    this.streakTimer = 0;

    this.stageUpdate = (dt) => {
      const x = this.rig.x;
      this.runEvents.forEach((e) => {
        if (!e.done && x < e.x) { e.done = true; e.fn(); }
      });
      // Spine shutters open just ahead of Parallax.
      w.slitShutters.forEach((sh, i) => {
        if (!this.spineOpened.has(i) && x < sh.worldX + 520 && x < 3000) {
          this.spineOpened.add(i);
          this.tweens.add({ targets: sh, scaleY: sh.homeScale * 0.04, duration: 900, ease: 'Cubic.easeInOut' });
          this.tweens.add({ targets: sh.shaft, alpha: 0.13, duration: 1100, delay: 300 });
          this.tweens.add({ targets: sh.pool, alpha: 0.16, duration: 1100, delay: 400 });
          sfx.shutterRise({ pan: -0.3, gain: 0.05 });
        }
      });
      // Gold streaks: the Aureate launching from the statue district.
      if (this.lighting.cityAlert > 0) {
        this.streakTimer -= dt;
        if (this.streakTimer <= 0) {
          this.streakTimer = 0.5 + Math.random() * 0.9;
          this.spawnStreak();
        }
      }
    };
  }

  openShutters() {
    const w = this.world;
    w.shutters.slice().reverse().forEach((sh, i) => {
      this.time.delayedCall(i * 320, () => {
        this.tweens.add({ targets: sh, scaleY: sh.homeScale * 0.05, duration: 1300, ease: 'Cubic.easeInOut' });
        sfx.shutterRise({ pan: 0.2 - i * 0.2 });
      });
    });
    tween(this, { targets: this.lighting, cityAlert: 1, duration: 2500 });
    ui.caption(CAPTIONS.sirensNear, 3000);
    sound.room.setCity(1, 3);
    sound.sirens.setMuffle(0.15, 3);
    sound.run.escalate(1);
    // Red beacons blink on across the skyline.
    for (let i = 0; i < 9; i++) {
      const b = this.add.image(-80 + 200 + i * 230 + Math.random() * 80, 40 + 380 + Math.random() * 160, 'light_core')
        .setScrollFactor(SF.cityMid, 0).setBlendMode(ADD).setTint(0xff3040).setScale(0.18).setAlpha(0).setDepth(D.cityFx);
      this.tweens.add({ targets: b, alpha: 0.9, duration: 260, yoyo: true, hold: 200, repeat: -1, repeatDelay: 600 + Math.random() * 900, delay: Math.random() * 1000 });
    }
    this.world.searchlights.forEach((s, i) => {
      this.tweens.add({ targets: s, angle: { from: -25 + i * 10, to: 25 - i * 8 }, duration: 5200 + i * 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: s, alpha: 0.22, duration: 1500 });
    });
  }

  spawnStreak() {
    // Rise from the statue district, arcing out of frame.
    const x = -80 + 1250 + (Math.random() - 0.5) * 300;
    const s = this.add.image(x, 640, 'streak').setScrollFactor(SF.cityMid, 0).setBlendMode(ADD)
      .setTint(Math.random() < 0.75 ? 0xf0cf8a : 0xffffff).setAlpha(0).setDepth(D.cityFx).setScale(0.6, 1);
    const ang = -Phaser.Math.FloatBetween(55, 85) * (Math.random() < 0.5 ? 1 : -1);
    s.setAngle(ang < 0 ? ang : -180 - ang);
    const rad = Phaser.Math.DegToRad(s.angle);
    const dist = 700 + Math.random() * 300;
    this.tweens.add({ targets: s, alpha: { from: 0, to: 0.9 }, duration: 200, yoyo: true, hold: 600 });
    this.tweens.add({ targets: s, x: x + Math.cos(rad) * dist, y: 640 + Math.sin(rad) * dist, duration: 1100, ease: 'Quad.easeIn', onComplete: () => s.destroy() });
  }

  wakeNews() {
    const frame = this.world.news;
    const sx = frame.x - 146;
    const sy = frame.y - 520 + 14;
    sfx.screenWake({ pan: 0.1 });
    const glow = this.add.image(frame.x, sy + 206, 'light_soft').setScale(1.4, 1.8).setBlendMode(ADD).setTint(0xcfd8ff).setAlpha(0).setDepth(D.back + 1);
    this.tweens.add({ targets: glow, alpha: 0.12, duration: 400 });
    const kicker = this.add.text(sx + 22, sy + 40, '', { fontFamily: 'Jost', fontSize: '13px', color: '#a9cbd2', letterSpacing: 4 }).setDepth(D.back + 2).setAlpha(0);
    const head = this.add.text(sx + 22, sy + 74, '', { fontFamily: 'Cormorant Garamond', fontSize: '30px', color: '#ece6f2', wordWrap: { width: 240 }, lineSpacing: 2 }).setDepth(D.back + 2).setAlpha(0);
    const rule = this.add.image(sx + 22, sy + 66, 'pixel').setOrigin(0, 0.5).setDisplaySize(36, 1).setTint(0xa9cbd2).setAlpha(0).setDepth(D.back + 2);
    let i = 0;
    const show = () => {
      const n = NEWS[i % NEWS.length];
      i++;
      kicker.setText(n.kicker);
      head.setText(n.text);
      [kicker, head, rule].forEach((o) => { o.setAlpha(0); this.tweens.add({ targets: o, alpha: 1, duration: 260 }); });
      this.cameraDir.kick(0);
    };
    show();
    this.time.addEvent({ delay: 1900, loop: true, callback: show });
  }

  herWakes() {
    const w = this.world;
    this.tweens.add({ targets: w.sleeper, alpha: 0, duration: 500 });
    this.tweens.add({ targets: w.sleeperSit, alpha: 1, duration: 500 });
    this.tweens.add({ targets: w.sheetCover, alpha: 0, duration: 300 });
    sfx.cloth({ duration: 0.8, gain: 0.05 });
    this.time.delayedCall(500, () => ui.bark(RUN.her, { ms: 2600 }));
  }

  openDoor(door, onOpen) {
    if (door.open) return;
    door.open = true;
    sfx.doorSlide({});
    this.tweens.add({ targets: door.left, x: door.x - 150, duration: 1100, ease: 'Cubic.easeInOut' });
    this.tweens.add({ targets: door.right, x: door.x + 150, duration: 1100, ease: 'Cubic.easeInOut' });
    this.tweens.add({ targets: door.beyond, alpha: 0.5, duration: 1300 });
    this.tweens.add({ targets: door.glyph, alpha: 0.6, duration: 600 });
    onOpen?.();
  }

  wakeSpine() {
    this.spineTexts = [];
    this.world.screens.filter((s) => s.kind === 'spine').forEach((s, i) => {
      const sx = px(s.x, SF.wall);
      const t = this.add.text(sx, 330, SPINE_ALERTS[i % SPINE_ALERTS.length], {
        fontFamily: 'Jost', fontSize: '15px', color: '#cfd6e6', letterSpacing: 6,
      }).setOrigin(0.5).setAngle(-90).setScrollFactor(SF.wall, 1).setDepth(D.wallLight).setAlpha(0);
      const glow = this.add.image(sx, 330, 'light_soft').setScale(0.8, 1.6).setScrollFactor(SF.wall, 1).setBlendMode(ADD).setTint(0x9fb0d8).setAlpha(0).setDepth(D.wallFx);
      this.tweens.add({ targets: [t], alpha: 0.85, duration: 300, delay: 200 + i * 160 });
      this.tweens.add({ targets: glow, alpha: 0.12, duration: 300, delay: 200 + i * 160 });
      this.spineTexts.push({ t, glow });
    });
    sfx.screenWake({ pan: -0.4 });
  }

  async starProtocol() {
    narrative.setFlag('sawStarProtocol');
    sfx.screenWake({ pan: 0 });
    sfx.lowImpact({ gain: 0.3, freq: 44 });
    (this.spineTexts || []).forEach(({ t, glow }) => {
      t.setText(`${STAR_PROTOCOL.text}`).setColor('#f0d498').setAlpha(0);
      glow.setTint(0xf0cf8a);
      this.tweens.add({ targets: t, alpha: 1, duration: 120, yoyo: true, repeat: 2, hold: 90, onComplete: () => t.setAlpha(1) });
      this.tweens.add({ targets: glow, alpha: 0.28, duration: 200 });
    });
    // Parallax reacts — barely — and keeps moving.
    this.tweens.add({ targets: this.player, speedScale: 0.18, duration: 260, ease: 'Quad.easeOut' });
    this.rig.lookOffset = -0.22;
    await wait(this, 1250);
    this.rig.lookOffset = 0;
    this.tweens.add({ targets: this.player, speedScale: 1, duration: 500, ease: 'Quad.easeIn' });
  }

  async enterChamber() {
    this.stageUpdate = null;
    this.player.enabled = false;
    ui.touch.setMovement(false);
    this.player.walkTo(120, { speed: 300 });
    sound.run.thin(2.5);
    await this.fx.fadeTo(1, 900);
    sfx.doorSlide({ gain: 0.08, open: false });
    narrative.setStage('chamber');
    this.scene.start('Chamber');
  }
}
