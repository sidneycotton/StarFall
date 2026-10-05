import Phaser from 'phaser';
import { ui } from '../ui/UI.js';
import { narrative } from '../core/NarrativeState.js';
import { sound } from '../audio/soundscape.js';
import { audio } from '../audio/AudioEngine.js';
import * as sfx from '../audio/sfx.js';
import { wait } from '../systems/Cutscene.js';
import { input } from '../systems/Input.js';
import { TRAM_GEOM } from './TramScene.js';
import { SpanScene, SAFE, CLOUD, CLOUD_Y } from './SpanScene.js';
import { SKYFALL } from '../data/span.js';

// The west tower, a few minutes after. Ines, Mara and the boy, and everyone
// else who got off the span, looking up at a cloud with two people in it.
// What comes out of the cloud is seen from a long way below, and only once.

const { EYE, ROAD, TOWERS } = TRAM_GEOM;
const ADD = Phaser.BlendModes.ADD;
const PARAMS = new URLSearchParams(window.location.search);
const AUTOPLAY = PARAMS.has('autoplay');

// Where she stops, under the cloud, over the gap.
const HERE = { x: CLOUD.x, y: 104, z: CLOUD.z };
const X0 = 3.0;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

export class SkyScene extends SpanScene {
  constructor() {
    super('Sky');
  }

  create() {
    narrative.setStage('sky');
    this.setup();
    this.setupSpan();
    this.setupSky();
    this.run();
  }

  // The bridge as the span left it: nothing between the towers.
  setupSky() {
    const cam = this.v.cam;
    cam.x = X0; cam.z = SAFE;
    this.mergeTram();
    this.outside = true;
    this.stance = EYE;
    this.ground = 0;
    this.collapsing = true;
    this.collapseFree = true;
    this.deckSegs.forEach((g) => {
      if (!g.centre) return;
      g.falling = true;
      g.drop = 200;
      this.applySeg(g);
    });
    this.hangers.forEach((h) => {
      if (h.z <= TOWERS[0] + 1 || h.z >= TOWERS[1] - 1) return;
      h.bot0 = [...h.l.points[1]];
      h.snapped = 1;
    });
    Object.values(this.people).forEach((b) => { b.visible = false; });
    const { mara, teo } = this.people;
    [mara, teo].forEach((b) => { this.toOutside(b); b.visible = true; b.y = ROAD; b.h = 1.78; });
    this.v.setBoardTexture(mara, 'sp_mara_a');
    this.v.setBoardTexture(teo, 'sp_teo_a');
    mara.x = 4.5; mara.z = SAFE - 0.8;
    teo.x = 3.9; teo.z = SAFE + 0.9;
    mara.img.setFlipX(true);
    teo.img.setFlipX(true);

    // The two of them, still inside it.
    this.cloudK = 1;
    [this.star, this.px].forEach((g) => { g.mode = 'hold'; g.vis = 0; g.boost = 1; });
    this.star.p = { x: HERE.x, y: CLOUD_Y + 25, z: HERE.z };
    this.px.p = { x: HERE.x, y: CLOUD_Y + 25, z: HERE.z };
    this.starLight = { fn: () => this.star.p, color: 0xffd890, i: 0, r: 60 };
    this.cloudLights.push(this.starLight);

    // What's left of her.
    this.embers = [];
    for (let i = 0; i < 70; i++) {
      const b = this.v.board('light_core', { layer: 'outside', world: false, anchor: 0.5, h: 2, blend: ADD, tint: 0xffc070, alpha: 0 });
      b.fog = false;
      b.visible = false;
      this.embers.push({ b, v: { x: 0, y: 0, z: 0 }, life: 0 });
    }
    this.cape = {
      glow: Object.assign(this.v.board('light_soft', { layer: 'outside', world: false, anchor: 0.5, h: 22, blend: ADD, tint: 0xff8a40, alpha: 0 }), { fog: false }),
      b: Object.assign(this.v.board('st_cape', { layer: 'outside', world: false, anchor: 0.5, h: 9, tint: 0xd8a080, alpha: 0 }), { fog: false }),
      on: false,
    };
    // Shadows, for the side of this that faces away from the light.
    this.shadows = [];
    this.flood = 0;

    this.base.yaw = this.v.aim(HERE.x, CLOUD_Y, HERE.z).yaw;
    this.base.pitch = 0.42;
    this.fx.set({ fade: 1, desat: 0.25, tintB: 1.05, tintR: 0.97, aberration: 0.6 });
  }

  // --- story ----------------------------------------------------------------------
  async run() {
    sound.stopAll(0.05);
    sound.bridge.start({ gain: 0.6, fadeIn: 4 });
    sound.bridge.setCrowd(0.18, 0.1);
    sound.bridge.setWind(0.5, 0.1);
    await wait(this, 800);
    ui.caption(SKYFALL.time, 3200);
    this.fx.fadeTo(0, 3800);
    this.free = true;
    await wait(this, 1600);
    // The cloud goes on lighting up from inside.
    this.flashing = true;
    this.flashLoop();
    await ui.dialogue.play(SKYFALL.open);
    await wait(this, 1200);
    await ui.dialogue.play(SKYFALL.flashes);
    await wait(this, 2400);
    this.flashing = false;

    // Then not.
    sound.bridge.setCrowd(0.06, 3);
    await wait(this, 1800);
    await ui.dialogue.play(SKYFALL.still);
    await wait(this, 1400);

    // Down out of the cloud, the two of them as one thing.
    this.free = false;
    this.trackPoint(() => this.star.p, 1.2);
    this.starLight.i = 0.6;
    this.star.vis = 1;
    this.px.vis = 1;
    this.px.mode = 'fn';
    this.px.fn = () => this.towardEye(this.star.p, 1.4, -0.3);
    sfx.whoosh({ gain: 0.05, duration: 5 });
    this.moveGod(this.star, { ...HERE }, 9000);
    await wait(this, 900);
    await ui.dialogue.play(SKYFALL.down);
    await wait(this, 1200);

    // Brighter.
    sound.bridge.setWind(0.2, 6);
    sound.bridge.setCrowd(0, 4);
    sfx.hush({ duration: 10, gain: 0.015 });
    this.tweens.add({ targets: this.star, boost: 3.2, duration: 7000, ease: 'Sine.easeIn' });
    this.tweens.add({ targets: this.px, boost: 0.55, duration: 7000 });
    this.tweens.add({ targets: this.starLight, i: 2.2, r: 120, duration: 7000 });
    this.fx.tween({ exposure: 1.25, aberration: 1.0 }, 7000);
    this.star.hazeA = 0.16;
    this.tweens.add({ targets: this.star, hazeA: 0.5, duration: 7000 });
    await ui.dialogue.play(SKYFALL.swell);

    const choice = await this.choose();
    narrative.setRecord('skyLook', choice);
    if (choice === 'covered') await this.cover();
    else await this.look();
    await this.after();
  }

  // A point a little way from `p`, toward wherever she is standing.
  towardEye(p, k, dy = 0) {
    const cam = this.v.cam;
    const dx = cam.x - p.x, dyy = cam.y - p.y, dz = cam.z - p.z;
    const d = Math.hypot(dx, dyy, dz) || 1;
    return { x: p.x + (dx / d) * k, y: p.y + (dyy / d) * k + dy, z: p.z + (dz / d) * k };
  }

  async flashLoop() {
    let n = 0;
    while (this.flashing && this.sys.isActive()) {
      const q = this.cloudFlash(n % 3 === 1 ? 0x8a6ad0 : 0xffd890, 0.9 + Math.random() * 0.8);
      if (n % 4 === 3) this.cloudFlash(0x8a6ad0, 0.6).x = q.x + 8;
      n++;
      await wait(this, 600 + Math.random() * 1500);
    }
  }

  // Keep looking, or put his face in her coat.
  choose() {
    return new Promise((resolve) => {
      const touch = input.lastDevice === 'touch';
      ui.hint(touch ? SKYFALL.chooseTouch : SKYFALL.choose(input.keyName('action'), input.keyName('dodge')));
      ui.touch.setAction(true, 'Look');
      ui.touch.setDodge(true, 'Cover');
      let done = false;
      const fin = (c) => {
        if (done) return;
        done = true;
        this.events.off('update', chk);
        if (this.waitingFor === look) this.waitingFor = null;
        ui.hint('');
        ui.touch.setAction(false);
        ui.touch.setDodge(false);
        resolve(c);
      };
      const look = () => fin('looked');
      const chk = () => { if (input.dodgeHeld) fin('covered'); };
      this.waitingFor = look;
      this.events.on('update', chk);
      // Doing nothing is looking.
      this.time.delayedCall(7000, look);
      if (AUTOPLAY) this.time.delayedCall(1600, () => fin(PARAMS.has('cover') ? 'covered' : 'looked'));
    });
  }

  async look() {
    this.trackPoint(() => this.star.p, 3);
    await ui.dialogue.play(SKYFALL.look);
    // All of it, at once, and nothing left over.
    sfx.whoosh({ gain: 0.08, duration: 4 });
    this.tweens.add({ targets: this.star, boost: 40, duration: 4200, ease: 'Quad.easeIn' });
    this.tweens.add({ targets: this.star, hazeA: 1, duration: 3000 });
    this.tweens.add({ targets: this.px, boost: 0.05, duration: 3600, ease: 'Quad.easeIn' });
    this.tweens.add({ targets: this.starLight, i: 6, r: 400, duration: 4200, ease: 'Quad.easeIn' });
    this.fx.tween({ exposure: 2.4, desat: 0.5, aberration: 2.6 }, 4200, 'Quad.easeIn');
    await wait(this, 4000);
    await this.burst(1);
  }

  async cover() {
    this.trackPoint(null);
    // Turn her back on it and take him in.
    const teo = this.people.teo;
    this.handsMode = 'carry';
    sfx.footstep({ kind: 'boot', gain: 0.5 });
    await this.turnTo(Math.PI - 0.25, -0.32, 900);
    teo.visible = false;
    ui.dialogue.play(SKYFALL.cover);
    // The light comes round from behind: on the deck, on Mara's face, and
    // every shadow at once, as long as the bridge.
    const mara = this.people.mara;
    mara.img.setFlipX(false);
    const cam = this.v.cam;
    this.shadows = [
      { at: () => ({ x: cam.x, z: cam.z }), w: 0.55 },
      { at: () => ({ x: mara.x, z: mara.z }), w: 0.5 },
      { at: () => ({ x: 7.4, z: SAFE + 1.5 }), w: 1.6 },
      { at: () => ({ x: -7.4, z: SAFE + 1.5 }), w: 1.6 },
    ].map((s) => ({ ...s, p: this.v.poly([[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], { fill: 0x020104, alpha: 0, fog: false }) }));
    this.tweens.add({ targets: this, flood: 1, duration: 4400, ease: 'Quad.easeIn' });
    this.tweens.add({ targets: this.star, boost: 40, duration: 4200, ease: 'Quad.easeIn' });
    this.tweens.add({ targets: this.starLight, i: 6, r: 400, duration: 4200, ease: 'Quad.easeIn' });
    this.fx.tween({ exposure: 1.6, liftR: 0.05, liftG: 0.03, desat: 0.2 }, 4400, 'Quad.easeIn');
    await wait(this, 4400);
    await this.burst(0.75);
    this.shadows.forEach((s) => { s.p.visible = false; });
    this.shadows = [];
    this.flood = 0;
    mara.tint = undefined;
    this.handsMode = 'none';
    await wait(this, 1800);
    teo.visible = true;
    // Back round to look at it.
    await this.turnTo(this.v.aim(HERE.x, HERE.y + 20, HERE.z).yaw, 0.38, 2600);
  }

  // The light first; the sound later, from the right distance.
  async burst(k) {
    const cam = this.v.cam;
    const d = Math.hypot(HERE.x - cam.x, HERE.y - cam.y, HERE.z - cam.z);
    this.fx.flash({ peak: k, attack: 260, release: 4200 });
    audio.cutWorld(0.05);
    [this.star, this.px].forEach((g) => { g.vis = 0; });
    this.starLight.i = 0;
    this.tearCloud(150);
    this.cloudLights.push({ p: { ...HERE, y: CLOUD_Y }, color: 0xffe0b0, i: 3, r: 260, decay: 0.35 });
    this.spawnEmbers();
    this.fx.tween({ exposure: 1.1, aberration: 1.2, liftR: 0, liftG: 0, liftB: 0 }, 5000, 'Sine.easeOut');
    await wait(this, (d / 343) * 1000);
    audio.restoreWorld(0.01);
    sfx.distantBoom({ gain: 1 });
    sfx.lowImpact({ gain: 0.9, freq: 38 });
    sfx.lightStrike({ gain: 0.5 * k, hit: true });
    this.cameras.main.shake(1400, 0.01 * k);
    audio.dip(500, 6);
    sfx.tinnitus({ duration: 9 });
    sound.bridge.setWind(0.6, 3);
    await wait(this, 2600);
  }

  spawnEmbers() {
    const r = Phaser.Math.RND;
    this.embers.forEach((e) => {
      const a = r.frac() * Math.PI * 2;
      const up = r.realInRange(-0.6, 0.9);
      const s = r.realInRange(6, 26);
      e.p = { x: HERE.x, y: HERE.y, z: HERE.z };
      e.v = { x: Math.cos(a) * s, y: up * s, z: Math.sin(a) * s };
      e.life = 1;
      e.fade = r.realInRange(0.05, 0.12);
      e.b.h = r.realInRange(1.2, 3.2);
      e.b.visible = true;
    });
  }

  async after() {
    this.trackPoint(() => ({ x: HERE.x, y: HERE.y + 18, z: HERE.z }), 1.2);
    sound.bridge.setCrowd(0.12, 6);
    await wait(this, 1200);
    await ui.dialogue.play(SKYFALL.after);
    // One thing, coming down slowly.
    const c = this.cape;
    c.on = true;
    c.p = { x: HERE.x + 4, y: HERE.y - 4, z: HERE.z + 6 };
    c.t = 0;
    this.trackPoint(() => c.p, 0.9);
    await wait(this, 1500);
    await ui.dialogue.play(SKYFALL.fall);
    await wait(this, 2000);
    this.trackPoint(null);
    this.free = true;
    await ui.dialogue.play(SKYFALL.close);
    await wait(this, 1500);
    this.free = false;
    this.fx.fadeTo(1, 3200);
    sound.bridge.stop(3);
    await wait(this, 3600);
    await ui.record.card(SKYFALL.card, { hold: 3000, step: 1600 });
    await wait(this, 600);
    this.scene.start('Vigil', { end: true });
  }

  teardown() {
    ui.touch.setDodge(false);
    super.teardown();
  }

  // --- frame ------------------------------------------------------------------------
  afterGods() {
    // Inside the cloud she is only light on its underside.
    [this.star, this.px].forEach((g) => {
      const inCloud = clamp((CLOUD_Y + 6 - g.p.y) / 14, 0, 1);
      const k = (g.vis ?? 1) * inCloud;
      Object.values(g).forEach((b) => { if (b && b.img) { b.alpha *= k; b.visible = k > 0.01; } });
      // Her light closes over him from the edges in.
      if (g === this.px) {
        const eaten = clamp(1.3 - (this.star.boost - 1) / 5, 0, 1);
        g.hole.alpha = 0.95 * k * eaten;
        g.body.alpha *= eaten;
      }
    });
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    // Embers: out, then down, then out.
    this.embers.forEach((e) => {
      if (e.life <= 0) return;
      e.v.y -= 2.2 * dt;
      e.v.x *= Math.exp(-dt * 0.6); e.v.z *= Math.exp(-dt * 0.6);
      e.p.x += e.v.x * dt; e.p.y += e.v.y * dt; e.p.z += e.v.z * dt;
      e.life -= e.fade * dt;
      const b = e.b;
      b.x = e.p.x; b.y = e.p.y; b.z = e.p.z;
      b.alpha = clamp(e.life, 0, 1) * (0.6 + Math.random() * 0.4);
      if (e.life <= 0) b.visible = false;
    });
    // The coat, if it is a coat.
    const c = this.cape;
    if (c.on) {
      c.t += dt;
      c.p.y -= dt * 2.6;
      c.p.x -= dt * 1.4;
      c.p.z += Math.sin(c.t * 0.7) * dt * 1.2;
      [c.b, c.glow].forEach((b) => { b.x = c.p.x; b.y = c.p.y; b.z = c.p.z; });
      c.b.alpha = clamp(c.t / 1.5, 0, 1);
      c.glow.alpha = 0.5 * c.b.alpha * (0.7 + Math.sin(c.t * 5) * 0.15 + Math.random() * 0.15);
      c.b.img.setFlipX(Math.sin(c.t * 0.9) > 0);
    }
    // Shadows away from the light, longer as it grows.
    if (this.shadows.length) {
      const len = 2 + this.flood * 60;
      this.shadows.forEach((s) => {
        const a = s.at();
        const y = ROAD + 0.03;
        const pts = s.p.points;
        const spread = s.w * (1 + this.flood * 2.5);
        pts[0][0] = a.x - s.w / 2; pts[0][1] = y; pts[0][2] = a.z;
        pts[1][0] = a.x + s.w / 2; pts[1][1] = y; pts[1][2] = a.z;
        pts[2][0] = a.x + spread / 2; pts[2][1] = y; pts[2][2] = a.z - len;
        pts[3][0] = a.x - spread / 2; pts[3][1] = y; pts[3][2] = a.z - len;
        s.p.alpha = 0.75 * clamp(this.flood * 2, 0, 1);
      });
      const m = this.people.mara;
      const lit = lerp(0.7, 1, this.flood);
      m.tint = (Math.round(255 * lit) << 16) | (Math.round(235 * lit) << 8) | Math.round(200 * lit);
    }
    super.update(time, delta);
  }
}
