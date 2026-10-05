import Phaser from 'phaser';
import { VIEW_W, VIEW_H } from '../config.js';
import { ui } from '../ui/UI.js';
import { narrative } from '../core/NarrativeState.js';
import { sound } from '../audio/soundscape.js';
import * as sfx from '../audio/sfx.js';
import { wait } from '../systems/Cutscene.js';
import { input } from '../systems/Input.js';
import { TramScene, TRAM_GEOM } from './TramScene.js';
import { SPAN } from '../data/span.js';

// Tram 6, after it stopped. The two of them fight over the centre span and
// Ines does what a driver does: gets everyone off. Nobody hands her a power.
// She watches. Sometimes she runs.
//
// Everything here is in the tram's own frame: the tram sits at STOP, so a
// local z of 0 is world z 320. The deck still answers in world z.

const { EYE, W, ROAD, STOP, TOWERS, DOORWAY } = TRAM_GEOM;
const ADD = Phaser.BlendModes.ADD;
const CX = VIEW_W / 2;
const AUTOPLAY = new URLSearchParams(window.location.search).has('autoplay');

const SAFE = TOWERS[0] - 2 - STOP;   // just past the west tower, local z
const CLOUD_Y = 150;                 // the underside of the cloud
const CLOUD = { x: 0, z: 30 };       // over the gap where the span was
const RUN_X = 3.0;                   // her line down the deck, clear of the tram
const RUN_V = 7;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
function angleLerp(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export { SAFE, CLOUD, CLOUD_Y };

export class SpanScene extends TramScene {
  constructor(key = 'Span') {
    super(key);
  }

  create() {
    narrative.setStage('span');
    this.setup();
    this.setupSpan();
    this.run();
  }

  // --- the bridge after ---------------------------------------------------------
  setupSpan() {
    const v = this.v;
    v.offset = STOP;
    this.phase = 'down';
    this.doorOpen = 1;
    this.frost = 0.35;
    this.handsMode = 'none';
    this.handsOff = 1;
    this.punchOff = 1;
    this.free = false;
    this.outside = false;
    this.stance = EYE;
    this.ground = 0;
    this.runV = 0;
    this.stride = 0;
    this.dipK = 0;
    this.movers = [];
    this.riders = [];
    this.track = null;
    this.lastSnap = 0;
    this.walkers.forEach((w) => { w.b.visible = false; });
    this.fx.set({ fade: 1, desat: 0.2, tintB: 1.05, tintR: 0.97, aberration: 1.4 });

    // What rides the deck down: the stop, the ladder, the lantern posts.
    [this.kiosk, this.ladder].forEach((b) => this.riders.push({ b, y0: b.y }));
    this.lanterns.forEach((l) => {
      l.pool.orig = l.pool.points.map((p) => [...p]);
      l.lit = -1;
    });

    this.buildGods();
    this.buildSpanHands();
    this.buildCloud();

    // Threads of light from her to the hangers, for as long as she holds it.
    this.threads = [];
    for (let i = 0; i < 14; i++) {
      const s = i % 2 ? 1 : -1;
      const z = -6 + Math.floor(i / 2) * 12;
      const l = v.line([[0, 0, 0], [s * 7.8, 0.9, z]], { color: 0xffd890, alpha: 0, width: 1.5, world: false });
      this.threads.push({ l, s, z });
    }
    this.threadA = 0;
    // A cable end, for the moment it comes through the air at her.
    this.whip = v.line([[0, 0, 0], [0, 0, 0]], { color: 0x15101a, width: 7, world: false });
    this.whip.visible = false;
  }

  buildGods() {
    const v = this.v;
    const O = { layer: 'outside', world: false, anchor: 0.5 };
    const nofog = (b) => { b.fog = false; return b; };
    // Glows are made before bodies, so on a tie they sit behind.
    this.star = {
      name: 'star', p: { x: 0.4, y: ROAD + 1.15, z: 15 }, mode: 'hold',
      haze: nofog(v.board('light_soft', { ...O, h: 30, blend: ADD, tint: 0xffd890, alpha: 0.16 })),
      glow: nofog(v.board('light_soft', { ...O, h: 9, blend: ADD, tint: 0xffd890, alpha: 0.6 })),
      body: nofog(v.board('sp_star', { ...O, h: 2.1 })),
    };
    this.px = {
      name: 'px', p: { x: -1, y: 6, z: 48 }, mode: 'hold',
      hole: nofog(v.board('tr_hole', { ...O, h: 7, alpha: 0.95 })),
      glow: nofog(v.board('light_soft', { ...O, h: 6, blend: ADD, tint: 0x7b5cc0, alpha: 0.32 })),
      body: nofog(v.board('sp_px', { ...O, h: 2.3 })),
    };
    this.fight = { a: 0, c: { x: 0, y: 18, z: 60 }, R: 24, prev: 1 };
    this.clash = [
      nofog(v.board('light_soft', { ...O, h: 26, blend: ADD, tint: 0xfff0d8, alpha: 0 })),
      nofog(v.board('light_soft', { ...O, h: 16, blend: ADD, tint: 0x9a7ad8, alpha: 0 })),
    ];
    this.clashA = 0;
    // Her light, on the deck under her.
    this.pool = v.poly([[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], { fill: 0x7a5a2a, alpha: 0, ground: true, fog: false });
  }

  // The cloud they go up into: a ceiling of puffs over the river, dark until
  // something inside it lights it. Lights are { p | fn, color, i, r }.
  buildCloud() {
    const v = this.v;
    const r = Phaser.Math.RND;
    r.sow(['cloud']);
    this.cloudK = 0;
    this.cloudLights = [];
    this.puffs = [];
    for (let i = 0; i < 170; i++) {
      const a = r.frac() * Math.PI * 2;
      const d = Math.sqrt(r.frac()) * 520;
      const x = CLOUD.x + Math.cos(a) * d * 1.2;
      const z = CLOUD.z - 60 + Math.sin(a) * d;
      const b = v.board(`sp_cloud${i % 3}`, { layer: 'outside', world: false, anchor: 0.5, x, y: CLOUD_Y + r.frac() * 22 + d * 0.03, z, h: 70 + r.frac() * 80, alpha: 0 });
      b.fog = false;
      b.img.setFlipX(r.frac() < 0.5);
      this.puffs.push({ b, a: 0.75 + r.frac() * 0.25 });
    }
    // Above the puffs, a lid, in tiles so a hole can be torn in it.
    this.lid = [];
    const Y = CLOUD_Y + 30;
    for (let x = -700; x < 700; x += 100) {
      for (let z = -700; z < 800; z += 100) {
        const p = v.poly([[x, Y, z], [x + 100, Y, z], [x + 100, Y, z + 100], [x, Y, z + 100]], { fill: 0x0c0a14, alpha: 0, fog: false });
        p.c = { x: x + 50, y: Y, z: z + 50 };
        this.lid.push(p);
      }
    }
  }

  // Tear the middle out of it: what's left after the light, and a few
  // stars through the gap.
  tearCloud(R) {
    const gone = (q) => Math.hypot(q.x - CLOUD.x, q.z - CLOUD.z) < R * (0.8 + Math.random() * 0.4);
    this.puffs.forEach((p) => { if (gone(p.b)) p.gone = true; });
    const r = Phaser.Math.RND;
    this.gapStars = [];
    for (let i = 0; i < 36; i++) {
      const a = r.frac() * Math.PI * 2;
      const d = Math.sqrt(r.frac()) * R * 0.8;
      const b = this.v.board('light_core', { layer: 'outside', world: false, anchor: 0.5, x: CLOUD.x + Math.cos(a) * d, y: CLOUD_Y + 29, z: CLOUD.z + Math.sin(a) * d * 0.8, h: 0.5 + r.frac() * 0.9, blend: ADD, tint: 0xe8e2ff, alpha: 0 });
      b.fog = false;
      this.gapStars.push({ b, a: 0.4 + r.frac() * 0.6, tw: r.frac() * 10 });
    }
    this.tweens.add({ targets: this, gapK: 1, duration: 9000, delay: 2500 });
  }

  updateCloud(dt) {
    const K = this.cloudK;
    const lit = this.cloudLights.filter((l) => l.i > 0.01);
    this.cloudLights.forEach((l) => { if (l.decay) l.i *= Math.exp(-dt * l.decay); });
    this.cloudLights = this.cloudLights.filter((l) => !l.decay || l.i > 0.01);
    const shade = (q, base, gain) => {
      let rr = (base >> 16) & 255, gg = (base >> 8) & 255, bb = base & 255;
      for (const l of lit) {
        const p = l.fn ? l.fn() : l.p;
        const d = Math.hypot(q.x - p.x, (q.y - p.y) * 1.6, q.z - p.z);
        const k = l.i * gain * Math.exp(-(d / l.r) * (d / l.r));
        rr += ((l.color >> 16) & 255) * k; gg += ((l.color >> 8) & 255) * k; bb += (l.color & 255) * k;
      }
      return (Math.min(255, rr) << 16) | (Math.min(255, gg) << 8) | Math.min(255, bb);
    };
    this.puffs.forEach((p) => {
      if (p.gone) p.a = Math.max(0, p.a - dt * 0.6);
      p.b.alpha = K * p.a;
      p.b.visible = p.b.alpha > 0.01;
      if (p.b.visible) p.b.img.setTint(shade(p.b, 0x1e1b2a, 1));
    });
    (this.gapStars || []).forEach((g) => {
      g.b.alpha = (this.gapK || 0) * g.a * (0.75 + 0.25 * Math.sin(this.time.now / 700 + g.tw));
    });
    this.lid.forEach((p) => {
      p.alpha = K;
      if (K > 0.01 && p.visible) p.fill = shade(p.c, 0x0c0a14, 0.5);
    });
  }

  // A flash somewhere inside it, heard a moment later.
  cloudFlash(color = 0xffd890, i = 1.4) {
    const r = Phaser.Math.RND;
    const p = { x: CLOUD.x + r.realInRange(-140, 140), y: CLOUD_Y + 10 + r.frac() * 15, z: CLOUD.z + r.realInRange(-90, 120) };
    this.cloudLights.push({ p, color, i, r: 90 + r.frac() * 60, decay: 2.2 + r.frac() * 2 });
    const cam = this.v.cam;
    const d = Math.hypot(p.x - cam.x, p.y - cam.y, p.z - cam.z);
    const sp = this.v.project(p.x, p.y, p.z, false);
    const pan = sp ? clamp((sp.x - CX) / CX, -1, 1) * 0.6 : 0;
    this.time.delayedCall((d / 343) * 1000, () => {
      if (!this.sys.isActive()) return;
      sfx.distantBoom({ pan, gain: 0.12 + 0.18 * i / 1.4 });
    });
    return p;
  }

  buildSpanHands() {
    this.reachImg = this.add.image(CX + 60, VIEW_H + 600, 'sp_reach').setOrigin(0.5, 1).setDepth(40).setVisible(false);
    this.carryImg = this.add.image(-40, VIEW_H + 660, 'sp_carry').setOrigin(0, 1).setDepth(40).setVisible(false);
    this.reachOff = 1;
    this.carryOff = 1;
  }

  // --- the two of them ------------------------------------------------------------
  fightPos(g, a = this.fight.a) {
    const c = this.fight.c;
    const s = g === this.star ? 1 : -1;
    return { x: c.x + s * Math.cos(a) * this.fight.R, y: c.y + Math.sin(2 * a) * 5, z: c.z + Math.sin(a) * 12 };
  }

  // Move a god to `to` (a point, or a function of time for a moving target).
  moveGod(g, to, ms, then = 'hold') {
    return new Promise((resolve) => {
      g.mode = 'move';
      g.mv = { from: { ...g.p }, to, t: 0, ms, then, resolve };
    });
  }

  goFight(g, ms = 1600) {
    return this.moveGod(g, () => this.fightPos(g), ms, 'fight');
  }

  updateGods(dt, time) {
    const f = this.fight;
    f.a += dt * 0.9;
    [this.star, this.px].forEach((g) => {
      if (g.mode === 'fight') g.p = this.fightPos(g);
      else if (g.mode === 'move') {
        const m = g.mv;
        m.t = Math.min(1, m.t + (dt * 1000) / m.ms);
        const to = typeof m.to === 'function' ? m.to() : m.to;
        const k = ease(m.t);
        g.p = { x: lerp(m.from.x, to.x, k), y: lerp(m.from.y, to.y, k), z: lerp(m.from.z, to.z, k) };
        if (m.t >= 1) { g.mode = m.then; g.mv = null; m.resolve(); }
      } else if (g.mode === 'fn') g.p = g.fn(dt);
    });

    // They meet in the middle, every time.
    const c = Math.cos(f.a);
    if (this.star.mode === 'fight' && this.px.mode === 'fight' && Math.sign(c) !== Math.sign(f.prev)) this.onClash();
    f.prev = c;

    const cam = this.v.cam;
    const place = (g) => {
      const p = g.p;
      const dx = p.x - cam.x, dy = p.y - cam.y, dz = p.z - cam.z;
      const d = Math.hypot(dx, dy, dz) || 1;
      const back = (k) => ({ x: p.x + (dx / d) * k, y: p.y + (dy / d) * k, z: p.z + (dz / d) * k });
      const set = (b, q, h) => { b.x = q.x; b.y = q.y; b.z = q.z; if (h) b.h = h; };
      set(g.body, p);
      const k = g.boost ?? 1;
      if (g === this.star) {
        set(g.glow, back(0.35), (9 + d * 0.09) * k);
        set(g.haze, back(0.6), (30 + d * 0.15) * k);
        g.glow.alpha = 0.6 + Math.sin(time / 260) * 0.05;
        g.haze.alpha = g.hazeA ?? 0.16 * clamp((d - 3) / 12, 0.1, 1);
      } else {
        set(g.glow, back(0.35), (6 + d * 0.05) * k);
        set(g.hole, back(0.7), (7 + d * 0.07) * k);
      }
      return d;
    };
    place(this.star);
    place(this.px);
    this.afterGods?.(dt, time);

    // Clash light, where they met.
    this.clashA *= Math.exp(-dt * 4.5);
    this.clash.forEach((b, i) => { b.alpha = this.clashA * (i ? 0.7 : 1); });
    this.dipK *= Math.exp(-dt * 3);

    // Her light on the deck.
    const s = this.star.p;
    const h = s.y - ROAD;
    const r = 3 + h * 0.25;
    const gy = ROAD + this.ds(s.x, s.z) + 0.03;
    const pts = this.pool.points;
    [[-r, -r], [r, -r], [r, r], [-r, r]].forEach(([ox, oz], i) => { pts[i][0] = s.x + ox; pts[i][1] = gy; pts[i][2] = s.z + oz; });
    this.pool.alpha = 0.45 * clamp(1 - h / 22, 0, 1);

    // Threads.
    this.threads.forEach((t) => {
      t.l.visible = this.threadA > 0.01;
      t.l.alpha = this.threadA * (0.55 + Math.sin(time / 90 + t.z) * 0.2);
      t.l.points[0] = [s.x, s.y, s.z];
      t.l.points[1] = [t.s * 7.8, 0.9 + this.ds(t.s * 7.8, t.z), t.z];
    });
  }

  onClash() {
    const f = this.fight;
    const p = this.star.p;
    this.clash.forEach((b) => { b.x = p.x; b.y = p.y; b.z = p.z - 0.5; });
    this.clashA = 1;
    this.dipK = 1;
    const cam = this.v.cam;
    const d = Math.hypot(p.x - cam.x, p.y - cam.y, p.z - cam.z);
    const sp = this.v.project(p.x, p.y, p.z, false);
    const pan = sp ? clamp((sp.x - CX) / CX, -1, 1) * 0.7 : 0;
    const near = clamp(40 / d, 0.15, 1);
    this.time.delayedCall((d / 343) * 1000, () => {
      if (!this.sys.isActive()) return;
      sfx.lightStrike({ pan, gain: 0.45 * near, hit: true });
      sfx.umbralStrike({ pan: -pan * 0.5, gain: 0.35 * near });
      if (near > 0.3) this.cameras.main.shake(160, 0.0025 * near);
    });
    // A beat of warp in the film, as if the air bent.
    this.fx.set({ warp: 0.25 * near });
    this.fx.tween({ warp: 0 }, 500);
    f.clashes = (f.clashes || 0) + 1;
  }

  // --- story ----------------------------------------------------------------------
  async run() {
    sound.stopAll(0.05);
    const cam = this.v.cam;
    // On the floor of the carriage, by the door.
    cam.x = 0.6; cam.z = -1.4;
    this.eye = 0.45;
    this.roll = 0.35;
    this.base.yaw = Math.PI / 2 - 0.5;
    this.base.pitch = 0.12;
    await wait(this, 600);
    sfx.tinnitus({ duration: 8 });
    await wait(this, 1400);
    sound.bridge.start({ gain: 0.7, fadeIn: 6 });
    sound.bridge.setCrowd(0, 0.1);
    this.fx.fadeTo(0, 3400);
    this.fx.tween({ aberration: 0.5 }, 6000);
    await wait(this, 1600);
    await ui.dialogue.play(SPAN.wake);

    // Up.
    ui.hint(`${input.keyName('action')} — ${SPAN.getUp.toLowerCase()}`);
    ui.touch.setAction(true, SPAN.getUp);
    await this.awaitAction(1200);
    ui.hint('');
    ui.touch.setAction(false);
    sfx.footstep({ kind: 'boot', gain: 0.6 });
    const aim = this.aimFrom(0.6, -1.4, [this.star.p.x, this.star.p.y + 0.4, this.star.p.z]);
    this.tweens.add({ targets: this, eye: EYE, roll: 0, duration: 1600, ease: 'Sine.easeInOut' });
    await this.turnTo(aim.yaw, aim.pitch, 1700);
    this.tweens.add({ targets: this, frost: 0.12, duration: 4000 });

    // She is standing on the deck in front of the tram, and he is above her.
    await wait(this, 500);
    await ui.dialogue.play(SPAN.arrive);
    this.trackPoint(() => this.mid(), 0.8);
    await ui.dialogue.play(SPAN.meet);
    // Up, both of them, and it starts.
    sfx.whoosh({ gain: 0.1, duration: 1.8 });
    this.goFight(this.px, 2400);
    await wait(this, 250);
    await this.goFight(this.star, 2200);
    await wait(this, 1200);
    this.track = null;
    this.free = true;

    await this.evacuate();
    await this.leaveTram();
    await this.teo();
    await this.failing();
    await this.runWest();
    await this.lookBack();
    await this.rise();
  }

  mid() {
    const a = this.star.p, b = this.px.p;
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
  }

  // Keep the head on something that moves (null to stop).
  trackPoint(fn, rate = 2) {
    this.track = fn ? { fn, rate } : null;
    if (fn) this.free = false;
  }

  // --- getting them off -------------------------------------------------------
  async evacuate() {
    this.spots.push({ id: 'door', at: [W, 1.3, DOORWAY.z], stand: [DOORWAY.x - 0.2, DOORWAY.z], need: false, visits: 0 });
    // Stand clear of the aisle so they can get past her.
    const stand = { mara: [-0.4, -3.3], couple: [0.4, -5.9], aurelio: [-0.4, -8.1], sleeper: [0.4, -9.5] };
    this.spots.forEach((s) => { if (stand[s.id]) s.stand = stand[s.id]; });
    this.handsMode = 'none';
    await this.turnTo(Math.PI, -0.1, 1100);
    this.phase = 'evac';
    ui.hint(input.lastDevice === 'touch' ? SPAN.evacHintTouch : SPAN.evacHint(input.keyName('action')), 7000);
    sound.bridge.setWind(0.5, 3);
    await new Promise((resolve) => { this.onEvacDone = resolve; });
    this.phase = 'leaving';
    ui.hidePrompt();
    this.target = null;
  }

  onAction() {
    if (!this.waitingFor && this.phase === 'evac' && this.target && !this.busy) {
      this.evacVisit(this.target);
      return;
    }
    super.onAction();
  }

  async evacVisit(spot) {
    this.busy = true;
    ui.hidePrompt();
    ui.hint('');
    if (spot.id === 'door') {
      const done = this.onEvacDone;
      this.onEvacDone = null;
      done?.();
      return;
    }
    spot.visits++;
    await this.walkTo(spot.stand[0], spot.stand[1], spot.at);
    await ui.dialogue.play(SPAN.people[spot.id].lines);
    this.sendOff(spot.id);
    if (spot.id === 'sleeper') narrative.setRecord('sleeper', 'woke');
    const visited = this.spots.filter((s) => s.need && s.visits).length;
    if (visited === 2 && !this.duck1) {
      this.duck1 = true;
      await wait(this, 1400);
      const ok = await this.hangerSnap({ z: 7, s: 1 });
      narrative.setRecord('duckTram', ok ? 'ok' : 'fail');
    }
    if (this.spots.every((s) => !s.need || s.visits) && !this.evacReady) {
      this.evacReady = true;
      await wait(this, 500);
      ui.hint(SPAN.doorHint, 4000);
    }
    this.busy = false;
  }

  // Up out of their seats and down the aisle to the door, then out.
  sendOff(id) {
    const P = this.people;
    const out = [[0.3, -1.5], [1.1, -0.95], [2.0, -1.1]];
    const west = (x, z1) => [[x, -14], [x, z1]];
    if (id === 'mara') {
      this.stand(P.teo, 'sp_teo', 1.78, [[0.3, -3.6], ...out, [4.6, -6], [4.9, -9.3]], { speed: 1.5, delay: 300 });
      this.stand(P.mara, 'sp_mara', 1.78, [[0.25, -4.25], ...out, [4.0, -6.4], [4.2, -10]], { speed: 1.3, delay: 900 });
    } else if (id === 'couple') {
      this.stand(P.sami, 'sp_sami', 1.8, [[-0.3, -6.75], ...out, ...west(3.6, -270)], { speed: 1.5, delay: 300, vanish: true });
      this.stand(P.nell, 'sp_nell', 1.78, [[-0.3, -7.4], ...out, ...west(4.2, -270)], { speed: 1.45, delay: 1000, vanish: true });
    } else if (id === 'aurelio') {
      this.stand(P.aurelio, 'sp_aurelio', 1.72, [[0.3, -9.0], ...out, [5.0, -9], [5.6, -74]], {
        speed: 0.9, delay: 600, still: true,
        onDone: (m) => this.sitAurelio(m.b),
      });
    } else if (id === 'sleeper') {
      this.stand(P.sleeper, 'sp_sleeper', 1.76, [[-0.3, -10.4], ...out, ...west(5.2, -270)], { speed: 1.25, delay: 900, vanish: true });
    }
  }

  sitAurelio(b, at = [5.6, -74]) {
    if (b.sat) return;
    b.sat = true;
    this.v.setBoardTexture(b, 'sp_aurelio_sit');
    b.h = 1.6;
    if (at) { b.x = at[0]; b.z = at[1]; }
    b.img.setFlipX(false);
    this.riders.push({ b, y0: ROAD });
    this.movers = this.movers.filter((m) => m.b !== b);
  }

  // A seated passenger stands up and walks a path (local x, z points).
  stand(b, key, h, path, { speed = 1.3, delay = 0, vanish = false, still = false, onDone } = {}) {
    this.facing = this.facing.filter((f) => f.b !== b);
    const go = () => {
      const tex = key === 'sp_aurelio' ? 'sp_mara' : key;
      // Aurelio has no walking frames of his own; he leans on Ines's arm,
      // then on his cane, and is drawn sitting once he gets where he's going.
      this.v.setBoardTexture(b, `${tex}_a`);
      if (key === 'sp_aurelio') b.img.setTint(0x9a968e);
      b.h = h;
      b.y = 0;
      this.movers.push({ b, key: tex, path: path.map((p) => [...p]), i: 0, speed, dist: 0, frame: 0, vanish, still, onDone });
    };
    if (delay) this.time.delayedCall(delay, go); else go();
  }

  toOutside(b) {
    const L = this.v.layers;
    const i = L.inside.boards.indexOf(b);
    if (i < 0) return;
    L.inside.boards.splice(i, 1);
    L.inside.c.remove(b.img);
    L.outside.c.add(b.img);
    L.outside.boards.push(b);
  }

  updateMovers(dt) {
    const v = this.v;
    for (const m of [...this.movers]) {
      const b = m.b;
      if (m.i >= m.path.length) continue;
      const [tx, tz] = m.path[m.i];
      const dx = tx - b.x, dz = tz - b.z;
      const d = Math.hypot(dx, dz);
      const step = m.speed * dt;
      const ox = b.x, oz = b.z;
      if (d <= step) { b.x = tx; b.z = tz; m.i++; } else { b.x += (dx / d) * step; b.z += (dz / d) * step; }
      if (b.x > W + 0.15) this.toOutside(b);
      b.y = (b.x > W + 0.15 ? ROAD : 0) + (this.outside || b.x > W + 0.15 ? this.ds(b.x, b.z) : 0);
      // Two frames, a step each.
      m.dist += Math.hypot(b.x - ox, b.z - oz);
      if (m.dist > 0.55) {
        m.dist = 0;
        m.frame ^= 1;
        v.setBoardTexture(b, `${m.key}_${m.frame ? 'b' : 'a'}`);
      }
      // Painted facing left: flip when the walk goes right on screen.
      const a = v.project(b.x, b.y + 1, b.z, false);
      const c = v.project(b.x + (b.x - ox) * 50, b.y + 1, b.z + (b.z - oz) * 50, false);
      if (a && c && Math.abs(c.x - a.x) > 2) b.img.setFlipX(c.x > a.x);
      if (m.i >= m.path.length) {
        v.setBoardTexture(b, `${m.key}_a`);
        if (m.vanish) b.visible = false;
        this.movers.splice(this.movers.indexOf(m), 1);
        if (!m.vanish && !m.onDone) this.riders.push({ b, y0: ROAD });
        m.onDone?.(m);
      }
    }
  }

  // A hanger lets go somewhere near; the cable comes through the air.
  // Resolves true if she got down in time.
  async hangerSnap({ z, s }) {
    const h = this.hangers.reduce((best, x) => (x.s === s && Math.abs(x.z - (z + STOP)) < Math.abs(best.z - (z + STOP)) && x.s === s ? x : best), this.hangers.find((x) => x.s === s));
    this.snap(h, true);
    this.cameras.main.shake(300, 0.006);
    sfx.bridgeGroan({ pan: s * 0.5, gain: 0.8, duration: 2.4 });
    const ok = await this.qte(1700);
    // The cable end, over her head or through where her head was.
    this.whipFrom(s, ok);
    if (ok) {
      sfx.dodge({ pan: s * 0.4 });
      sfx.qteOk();
      await wait(this, 900);
      this.tweens.add({ targets: this, stance: EYE, eye: this.outside ? this.eye : EYE, duration: 700, ease: 'Sine.easeOut' });
      ui.dialogue.play(SPAN.duckOk);
    } else {
      sfx.qteFail();
      sfx.lowImpact({ gain: 0.5, freq: 50 });
      this.fx.flash({ r: 1, g: 0.85, b: 0.8, peak: 0.5, attack: 30, release: 900 });
      this.cameras.main.shake(400, 0.012);
      sfx.tinnitus({ duration: 3 });
      if (this.outside) {
        this.stance = 0.5;
      } else {
        this.eye = 0.5;
      }
      this.roll = 0.28;
      await wait(this, 1300);
      ui.dialogue.play(SPAN.duckFail);
      await wait(this, 600);
      this.tweens.add({ targets: this, stance: EYE, roll: 0, duration: 1300, ease: 'Sine.easeInOut' });
      if (!this.outside) this.tweens.add({ targets: this, eye: EYE, duration: 1300, ease: 'Sine.easeInOut' });
      await wait(this, 1300);
    }
    return ok;
  }

  qte(ms) {
    return new Promise((resolve) => {
      let done = false;
      const fin = (ok) => {
        if (done) return;
        done = true;
        this.events.off('update', chk);
        if (this.waitingFor === hit) this.waitingFor = null;
        ui.hint('');
        ui.touch.setAction(false);
        if (ok) {
          // Down.
          if (this.outside) this.tweens.add({ targets: this, stance: 0.8, duration: 160, ease: 'Quad.easeOut' });
          else this.tweens.add({ targets: this, eye: 0.85, duration: 160, ease: 'Quad.easeOut' });
        }
        resolve(ok);
      };
      const chk = () => { if (input.dodgeHeld) fin(true); };
      const hit = () => fin(true);
      this.events.on('update', chk);
      this.waitingFor = hit;
      ui.hint(SPAN.duck(input.keyName('dodge')));
      ui.touch.setAction(true, 'Duck');
      sfx.tell({ ms: 600 });
      this.time.delayedCall(ms, () => fin(false));
      if (AUTOPLAY) this.time.delayedCall(500, () => fin(true));
    });
  }

  whipFrom(s, high) {
    const cam = this.v.cam;
    const y = high ? cam.y + 0.5 : cam.y;
    const w = { t: 0 };
    this.whip.visible = true;
    sfx.whoosh({ pan: s * 0.6, gain: 0.12, duration: 0.5 });
    this.tweens.add({
      targets: w, t: 1, duration: 260, ease: 'Quad.easeIn',
      onUpdate: () => {
        const fx = Math.sin(this.v.cam.yaw), fz = Math.cos(this.v.cam.yaw);
        const rx = fz, rz = -fx;
        const across = lerp(4, -4, w.t) * s;
        const ax = cam.x + fx * 1.4 + rx * across, az = cam.z + fz * 1.4 + rz * across;
        this.whip.points[0] = [ax, y, az];
        this.whip.points[1] = [ax + rx * s * 3, y + 2.5, az + rz * s * 3 + 1];
      },
      onComplete: () => { this.whip.visible = false; },
    });
  }

  snap(h, loud = false) {
    if (!h || h.snapped) return;
    h.snapped = 0.001;
    h.bot0 = [...h.l.points[1]];
    this.tweens.add({ targets: h, snapped: 1, duration: 520, ease: 'Quad.easeOut' });
    const now = this.time.now;
    if (loud || now - this.lastSnap > 140) {
      this.lastSnap = now;
      const sp = this.v.project(h.top[0], h.top[1], h.top[2], true);
      const pan = sp ? clamp((sp.x - CX) / CX, -1, 1) * 0.8 : h.s * 0.5;
      const d = Math.hypot(h.top[0] - this.v.cam.x, h.top[2] - (this.v.cam.z + STOP));
      sfx.cableSnap({ pan, gain: loud ? 1 : clamp(30 / d, 0.15, 0.7) });
    }
  }

  // --- out of the tram -----------------------------------------------------------
  async leaveTram() {
    this.free = false;
    const sleeper = this.spots.find((s) => s.id === 'sleeper');
    if (!sleeper.visits) narrative.setRecord('sleeper', 'left');
    await this.walkTo(DOORWAY.x, DOORWAY.z, null);
    if (!sleeper.visits) {
      await this.turnTo(Math.PI + 0.15, -0.12, 900);
      await ui.dialogue.play(SPAN.leftHim);
    }
    await this.turnTo(Math.PI / 2 - 0.2, -0.05, 800);
    // Down onto the deck.
    this.mergeTram();
    this.outside = true;
    this.stance = this.eye - ROAD;
    sfx.footstep({ kind: 'boot', gain: 0.7 });
    await new Promise((resolve) => {
      this.tweens.add({ targets: this.v.cam, x: 2.0, z: -1.1, duration: 600, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: this, stance: EYE, duration: 600, ease: 'Quad.easeIn', onComplete: resolve });
    });
    sfx.landing({ gain: 0.25 });
    sound.bridge.setWind(0.8, 2);
    // Up at them.
    this.trackPoint(() => this.mid(), 1.2);
    await wait(this, 600);
    await ui.dialogue.play(SPAN.outside);
  }

  // From here on she's outside: the carriage is just another thing on the
  // bridge, sorted with everything else.
  mergeTram() {
    const v = this.v;
    const g = v.group([0, 1.2, -5], { world: false, layer: 'outside' });
    const take = (p) => {
      g.polys.push(p);
      p.orig = p.points.map((pt) => [...pt]);
      if (p.points.every((pt) => pt[1] === 0)) p.ground = true;
    };
    this.leaves.forEach((l) => [l.panel, l.frame, l.pane].forEach((p) => { p.visible = false; }));
    v.shell.polys.forEach(take);
    v.shell.polys = [];
    v.layers.inside.polys.forEach(take);
    v.layers.inside.polys = [];
    this.tramGroup = g;
    [...v.layers.inside.boards].forEach((b) => {
      if (this.movers.some((m) => m.b === b)) this.toOutside(b);
      else if (b === this.people.sleeper && !this.spots.find((s) => s.id === 'sleeper').visits) {
        this.toOutside(b);
        this.riders.push({ b, y0: 0 });
      } else b.visible = false;
    });
    this.lamps.forEach((l) => { l.fix.visible = false; l.glow.visible = false; });
  }

  // --- the boy ---------------------------------------------------------------------
  async teo() {
    const teo = this.people.teo;
    const mara = this.people.mara;
    // Wherever they got to, they're here now.
    this.movers = this.movers.filter((m) => m.b !== teo && m.b !== mara);
    this.riders = this.riders.filter((r) => r.b !== teo && r.b !== mara);
    [teo, mara].forEach((b) => { this.toOutside(b); b.visible = true; });
    teo.x = 4.9; teo.z = -9.3; teo.y = ROAD;
    mara.x = 4.2; mara.z = -10; mara.y = ROAD;
    this.v.setBoardTexture(mara, 'sp_mara_a'); mara.h = 1.78;
    await wait(this, 800);

    // He goes.
    this.trackPoint(() => ({ x: teo.x, y: ROAD + 1.0, z: teo.z }), 2.2);
    this.stand(teo, 'sp_teo', 1.78, [[5.4, 0], [6.4, 15]], { speed: 4.2 });
    ui.dialogue.play(SPAN.teoRuns);
    await wait(this, 2400);

    // The deck under him tips.
    const seg = this.segAt(STOP + 14);
    sfx.bridgeGroan({ pan: 0.6, gain: 1.1, duration: 2.6 });
    this.snap(this.hangers.find((h) => h.s === 1 && h.z === seg.z0), true);
    this.snap(this.hangers.find((h) => h.s === 1 && h.z === seg.z1), true);
    this.cameras.main.shake(500, 0.008);
    this.tweens.add({ targets: seg, bank: 0.11, drop: 0.25, duration: 900, ease: 'Quad.easeIn', onUpdate: () => this.applySeg(seg) });

    ui.hint(SPAN.chase(input.keyName('action')));
    ui.touch.setAction(true, 'Run');
    // He's already sliding.
    this.time.delayedCall(700, () => {
      this.movers = this.movers.filter((m) => m.b !== teo);
      this.stand(teo, 'sp_teo', 1.78, [[7.5, 14.2]], { speed: 2.2 });
    });
    await this.awaitAction(900);
    ui.hint('');
    ui.touch.setAction(false);
    await this.runTo(5.7, 10.4, 5.2);

    // Under the rail: he's hanging off the edge by one hand.
    this.movers = this.movers.filter((m) => m.b !== teo);
    this.v.setBoardTexture(teo, 'sp_teo_hang');
    teo.img.setOrigin(0.5, 0.03);
    teo.h = 1.05;
    teo.x = 8.0; teo.z = 14.2;
    const edge = () => WALK_Y + this.ds(8.0, 14.2);
    teo.y = edge();
    this.trackPoint(() => ({ x: teo.x, y: teo.y - 0.3, z: teo.z }), 3);
    ui.hint(SPAN.reach(input.keyName('action')));
    ui.touch.setAction(true, 'Reach');
    await this.awaitAction(700);
    ui.hint('');
    ui.touch.setAction(false);
    this.handsMode = 'reach';
    this.tweens.add({ targets: this, stance: 1.0, duration: 400, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: this.v.cam, x: 6.7, z: 12.6, duration: 450, ease: 'Quad.easeOut' });
    await wait(this, 450);

    // Short.
    this.tweens.add({ targets: seg, bank: 0.2, drop: 0.6, duration: 300, ease: 'Quad.easeIn', onUpdate: () => this.applySeg(seg) });
    this.cameras.main.shake(300, 0.01);
    ui.dialogue.play(SPAN.short);
    const fall = { v: 0 };
    this.trackPoint(() => ({ x: teo.x, y: teo.y - 0.6, z: teo.z }), 5);
    const drop = this.time.addEvent({ delay: 16, loop: true, callback: () => { fall.v += 9.8 * 0.016; teo.y -= fall.v * 0.016; } });

    // She comes down like a dropped star.
    this.star.mode = 'move';
    sfx.flyBy({ gain: 0.16 });
    await this.moveGod(this.star, () => ({ x: 8.3, y: teo.y + 0.3, z: 14.2 }), 520);
    drop.remove();
    this.fx.flash({ r: 1, g: 0.9, b: 0.7, peak: 0.55, attack: 30, release: 700 });
    sfx.lightStrike({ gain: 0.4, hit: false });
    this.v.setBoardTexture(this.star.body, 'sp_star_reach');
    // He hangs from her hand now: right of her, a little below her middle.
    this.v.setBoardTexture(teo, 'sp_teo_hang');
    teo.img.setOrigin(0.5, 0.03);
    this.hangOnStar = true;
    this.handsMode = 'none';
    this.trackPoint(() => ({ ...this.star.p, y: this.star.p.y + 0.5 }), 2.5);
    this.tweens.add({ targets: this, stance: EYE, duration: 900 });
    this.tweens.add({ targets: this.v.cam, x: 5.3, z: 10.0, duration: 1100, ease: 'Sine.easeOut' });
    await this.moveGod(this.star, { x: 7.8, y: ROAD + 2.6, z: 14.4 }, 1500);
    await ui.dialogue.play(SPAN.caught);
    // Over the rail, and down onto the deck in front of Ines.
    await this.moveGod(this.star, { x: 6.2, y: ROAD + 1.55, z: 12.9 }, 1300);
    this.hangOnStar = false;
    this.v.setBoardTexture(teo, 'sp_teo_a');
    teo.img.setOrigin(0.5, 1);
    teo.h = 1.78; teo.x = 5.8; teo.z = 12.2; teo.y = ROAD + this.ds(5.8, 12.2);
    teo.img.setFlipX(false);
    this.v.setBoardTexture(this.star.body, 'sp_star');
    sfx.landing({ gain: 0.12 });
    await this.moveGod(this.star, { x: 6.4, y: ROAD + 1.15, z: 13.5 }, 600);
    this.trackPoint(() => ({ ...this.star.p, y: this.star.p.y + 0.75 }), 3);
    await ui.dialogue.play(SPAN.handOver);
    await wait(this, 300);
    await ui.dialogue.play(SPAN.calledAway);
    // Gone, back up to him.
    sfx.whoosh({ gain: 0.12, duration: 1.2 });
    this.trackPoint(() => this.star.p, 2.4);
    await this.goFight(this.star, 1300);
    this.trackPoint(null);
    // Mara is pulled west with the others; Ines will find her at the tower.
    mara.x = 3.4; mara.z = SAFE - 6.5; mara.y = ROAD;
    mara.img.setFlipX(true);

    // Pick him up.
    await this.walkTo(5.6, 11.3, [teo.x, 0.4, teo.z]);
    teo.visible = false;
    this.handsMode = 'carry';
    sfx.footstep({ kind: 'boot', gain: 0.6 });
    await wait(this, 500);
    await ui.dialogue.play(SPAN.teoWarm);
  }

  // A sprint between two points (local x, z) at speed v.
  runTo(x, z, v) {
    const cam = this.v.cam;
    const dist = Math.hypot(x - cam.x, z - cam.z);
    const ms = (dist / v) * 1000;
    const steps = this.time.addEvent({ delay: 280, loop: true, callback: () => sfx.footstep({ kind: 'boot', gain: 0.65 }) });
    return new Promise((resolve) => {
      this.runV = v;
      this.tweens.add({
        targets: cam, x, z, duration: ms, ease: 'Sine.easeIn',
        onComplete: () => { steps.remove(); this.runV = 0; resolve(); },
      });
    });
  }

  // --- what she did, or didn't ---------------------------------------------------
  async failing() {
    sfx.bridgeGroan({ gain: 1.3, duration: 4 });
    this.cameras.main.shake(1200, 0.003);
    // She stops fighting him and holds the span instead.
    this.px.mode = 'hold';
    this.moveGod(this.px, { x: -22, y: 30, z: 92 }, 2600);
    this.trackPoint(() => ({ ...this.star.p, y: this.star.p.y - 3 }), 1.3);
    await this.moveGod(this.star, { x: 0, y: 19, z: 40 }, 1800);
    this.tweens.add({ targets: this, threadA: 1, duration: 1400 });
    // The centre lanterns come up gold, while she holds it.
    this.held = 0;
    this.tweens.add({ targets: this, held: 1, duration: 1800 });
    sound.bridge.setWind(0.3, 2);
    await ui.dialogue.play(SPAN.failing);
    // She comes down a little toward them.
    this.moveGod(this.star, { x: 1, y: 15, z: 30 }, 2200);
    await wait(this, 900);
    await ui.dialogue.play(SPAN.looked);
    await wait(this, 500);
    // He comes closer. She looks at him.
    sfx.whoosh({ gain: 0.07, duration: 2.5 });
    this.trackPoint(() => this.mid(), 1.4);
    await this.moveGod(this.px, { x: -12, y: 20, z: 54 }, 2000);
    await ui.dialogue.play(SPAN.lookedAway);
    // And lets go.
    this.tweens.add({ targets: this, threadA: 0, held: 0, duration: 900 });
    this.goFight(this.star, 1400);
    this.goFight(this.px, 1600);
    await wait(this, 500);
    const near = this.hangers.filter((h) => Math.abs(h.z - (STOP + 30)) < 120).sort((a, b) => Math.abs(a.z - STOP - 30) - Math.abs(b.z - STOP - 30));
    near.forEach((h, i) => this.time.delayedCall(i * 55, () => this.snap(h)));
    this.cameras.main.shake(900, 0.009);
    sfx.bridgeGroan({ gain: 1.6, duration: 3 });
    // The deck lurches.
    this.lurch = 0;
    this.tweens.add({ targets: this, lurch: 1, duration: 2200, ease: 'Quad.easeIn' });
    this.roll = 0;
    this.trackPoint(null);
    await wait(this, 900);
  }

  // --- west ---------------------------------------------------------------------------
  async runWest() {
    // Aurelio is on his bollard, whether or not he walked all the way.
    // Aurelio sits down wherever he has got to. He was never going to make it.
    const au = this.people.aurelio;
    if (au.visible) {
      if (au.x < W + 0.15) au.x = 5.0;
      this.toOutside(au);
      this.sitAurelio(au, au.sat ? null : [5.0, au.z]);
    }
    const auZ = au.visible ? au.z : -64;
    this.phase = 'run';
    this.free = true;
    await this.turnTo(Math.PI, 0, 900);
    const touch = input.lastDevice === 'touch';
    ui.hint(touch ? SPAN.runTouch : SPAN.run(input.keyName('action')));
    ui.touch.setAction(true, 'Run');
    ui.touch.setMovement(true);
    this.events.on('update', this.runStep, this);
    this.runCues = [
      { z: Math.min(-22, auZ - 14), fn: () => this.runDuck() },
      { z: auZ + 4, fn: () => ui.dialogue.play(SPAN.aurelio) },
      { z: -140, fn: () => this.startCollapse() },
    ];
    await new Promise((resolve) => { this.onSafe = resolve; });
    this.events.off('update', this.runStep, this);
    this.runV = 0;
    this.phase = 'safe';
    ui.hint('');
    ui.touch.setAction(false);
  }

  runStep(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    const cam = this.v.cam;
    const held = (input.actionHeld || AUTOPLAY) && !this.stumbling;
    if (held && !this.hinted) { this.hinted = true; this.time.delayedCall(2500, () => { if (this.phase === 'run') ui.hint(''); }); }
    this.runV = held ? Math.min(RUN_V, this.runV + 9 * dt) : Math.max(0, this.runV - 12 * dt);
    const step = this.runV * dt;
    cam.z -= step;
    cam.x = lerp(cam.x, RUN_X, 1 - Math.exp(-dt * 1.5));
    this.stride += step / 0.9;
    if (Math.floor(this.stride) !== this.lastStride) {
      this.lastStride = Math.floor(this.stride);
      if (this.runV > 1) sfx.footstep({ kind: 'boot', gain: 0.6 });
    }
    // Keep looking where she's going, mostly.
    if (this.runV > 2) this.base.yaw = angleLerp(this.base.yaw, Math.PI, 1 - Math.exp(-dt * 0.8));
    this.runCues.forEach((c) => { if (!c.done && cam.z < c.z) { c.done = true; c.fn(); } });
    if (cam.z <= SAFE) { cam.z = SAFE; this.onSafe?.(); this.onSafe = null; }
  }

  async runDuck() {
    this.stumbling = false;
    const ok = await this.hangerSnap({ z: this.v.cam.z - 6, s: 1 });
    narrative.setRecord('duckRun', ok ? 'ok' : 'fail');
    if (!ok) {
      // Down, with him. Back up.
      this.stumbling = true;
      await wait(this, 400);
      this.stumbling = false;
    }
  }

  // The span goes from the middle outward. It waits for nobody, but it is
  // slow enough, just, at the edges.
  startCollapse() {
    if (this.collapsing) return;
    this.collapsing = true;
    sfx.collapse();
    this.cameras.main.shake(1600, 0.008);
    const now = this.time.now;
    this.deckSegs.forEach((g) => {
      if (!g.centre) return;
      const zc = (g.z0 + g.z1) / 2;
      g.fallAt = now + 300 + (Math.abs(zc - STOP) / 45) * 1000;
      g.bankRate = (Math.random() - 0.5) * 0.25 + (zc > STOP ? 0.05 : -0.05);
      g.pitchRate = (zc - STOP) * 0.0004 + (Math.random() - 0.5) * 0.02;
    });
  }

  updateCollapse(dt, time) {
    if (!this.collapsing) return;
    const camWorld = this.v.cam.z + STOP;
    for (const g of this.deckSegs) {
      if (!g.centre || g.drop > 70) continue;
      const zc = (g.z0 + g.z1) / 2;
      if (!g.falling) {
        if (time < g.fallAt || (!this.collapseFree && zc < camWorld + 70)) continue;
        g.falling = true;
        g.vy = 0.5;
        this.hangers.filter((h) => h.z >= g.z0 - 1 && h.z <= g.z1 + 1).forEach((h) => this.snap(h));
      }
      g.vy += 9.8 * dt * 0.75;
      g.drop += g.vy * dt;
      g.bank += g.bankRate * dt;
      g.pitch += g.pitchRate * dt;
      this.applySeg(g);
    }
  }

  // --- the tower -----------------------------------------------------------------
  async lookBack() {
    const mara = this.people.mara;
    const teo = this.people.teo;
    this.trackPoint(() => ({ x: mara.x, y: ROAD + 1.4, z: mara.z }), 2);
    await ui.dialogue.play(SPAN.tower);
    this.handsMode = 'none';
    teo.visible = true;
    teo.x = mara.x + 0.4; teo.z = mara.z + 0.3; teo.y = ROAD;
    teo.img.setFlipX(true);
    this.v.setBoardTexture(teo, 'sp_teo_a');
    teo.h = 1.78;
    await wait(this, 900);
    this.trackPoint(null);
    this.free = true;
    ui.hint(input.lastDevice === 'touch' ? SPAN.turn : `${SPAN.turn} · ${input.keyName('action')}`);
    await new Promise((resolve) => {
      let done = false;
      const finish = () => { if (done) return; done = true; this.events.off('update', check); resolve(); };
      const check = () => { if (Math.cos(this.v.cam.yaw) > 0.6) finish(); };
      this.events.on('update', check);
      this.awaitAction(1500).then(finish);
    });
    ui.hint('');
    this.free = false;
    await this.turnTo(0.04, 0.03, 1500);
    this.free = true;
    // All of it, now.
    this.collapseFree = true;
    this.startCollapse();
    // From the far end toward her, stopping at the tower.
    const now = this.time.now;
    const left = this.deckSegs.filter((g) => g.centre && !g.falling);
    const far = Math.max(...left.map((g) => (g.z0 + g.z1) / 2));
    left.forEach((g) => {
      const zc = (g.z0 + g.z1) / 2;
      g.fallAt = now + 600 + (far - zc) * 45;
    });
    sfx.collapse();
    this.cameras.main.shake(2400, 0.006);
    await wait(this, 7000);
    sfx.distantBoom({ gain: 0.5 });
    await wait(this, 2500);
  }

  async rise() {
    // Up, the two of them, turning around one another like a reflection,
    // into the cloud that has come down over the river.
    const t0 = this.time.now;
    const c = { ...this.fight.c };
    const pathFor = (s) => () => {
      const u = (this.time.now - t0) / 1000;
      const R = Math.max(0.6, 22 - u * 2.2);
      const a = u * (1.1 + u * 0.12);
      return { x: c.x + s * Math.cos(a) * R, y: Math.min(CLOUD_Y + 24, c.y + u * u * 1.1 + u * 3), z: c.z + Math.sin(a) * R * 0.5 };
    };
    this.star.fn = pathFor(1);
    this.px.fn = pathFor(-1);
    this.moveGod(this.star, this.star.fn, 1400, 'fn');
    this.moveGod(this.px, this.px.fn, 1400, 'fn');
    this.trackPoint(() => this.mid(), 1.6);
    this.tweens.add({ targets: this, cloudK: 1, duration: 6000, ease: 'Sine.easeInOut' });
    this.cloudLights.push({ fn: () => this.star.p, color: 0xffd890, i: 0.9, r: 70 });
    this.cloudLights.push({ fn: () => this.px.p, color: 0x7b5cc0, i: 0.5, r: 50 });
    sound.bridge.setWind(1, 6);
    sfx.whoosh({ gain: 0.1, duration: 6 });
    await wait(this, 2200);
    await ui.dialogue.play(SPAN.rise);
    // Gone into it. The cloud lights up from inside, and keeps lighting.
    await new Promise((resolve) => {
      const chk = () => { if (this.mid().y > CLOUD_Y + 5) { this.events.off('update', chk); resolve(); } };
      this.events.on('update', chk);
    });
    [this.star, this.px].forEach((g) => Object.values(g).forEach((b) => { if (b && b.img) b.visible = false; }));
    this.trackPoint(() => ({ x: CLOUD.x, y: CLOUD_Y, z: CLOUD.z }), 0.8);
    for (let i = 0; i < 4; i++) {
      this.cloudFlash(i % 2 ? 0x8a6ad0 : 0xffd890, 1.2 + Math.random() * 0.5);
      await wait(this, 700 + Math.random() * 900);
    }
    this.fx.fadeTo(1, 2600);
    sound.bridge.setWind(0.4, 2.5);
    await wait(this, 3000);
    this.scene.start('Sky', {});
  }

  // --- frame ------------------------------------------------------------------------
  ds(x, z) {
    return this.deckShift(x, z + STOP);
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    const cam = this.v.cam;
    this.updateGods(dt, time);
    this.updateMovers(dt);
    this.updateCollapse(dt, time);
    this.updateCloud(dt);

    // Before the fall: the whole centre span sags, more every second.
    if (this.lurch && !this.collapseFree) {
      const camWorld = cam.z + STOP;
      this.deckSegs.forEach((g) => {
        if (!g.centre || g.falling) return;
        const zc = (g.z0 + g.z1) / 2;
        const k = this.lurch * clamp(1 - Math.abs(zc - STOP) / 200, 0, 1);
        const wob = Math.sin(time / 700 + zc) * 0.01;
        g.drop = Math.max(g.drop, k * 0.7);
        g.bank = (zc > camWorld - 4 ? 0.03 : 0.02) * k + wob * k;
        this.applySeg(g);
      });
    }

    // Things that ride the deck.
    this.riders.forEach(({ b, y0 }) => {
      const dy = this.deckShift(b.x, b.world ? b.z : b.z + STOP);
      b.y = y0 + dy;
      if (dy < -70) b.visible = false;
    });
    if (this.hangOnStar) {
      const p = this.star.p;
      const rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
      const t = this.people.teo;
      t.x = p.x + rx * 0.33; t.z = p.z + rz * 0.33; t.y = p.y - 0.38;
      t.img.setFlipX(false);
    }
    // The tram goes with its piece of deck.
    if (this.tramGroup && this.collapsing) {
      let lowest = 0;
      this.tramGroup.polys.forEach((p) => {
        if (!p.orig) return;
        p.points.forEach((pt, i) => {
          const o = p.orig[i];
          const dy = this.ds(o[0], o[2]);
          pt[1] = o[1] + dy;
          lowest = Math.min(lowest, dy);
        });
      });
      this.tramGroup.visible = lowest > -70;
    }
    // Hangers: hang from the deck, or swing free once they've gone.
    this.hangers.forEach((h) => {
      const bot = h.l.points[1];
      if (h.snapped) {
        const to = [h.top[0] + h.s * 1.4, h.top[1] - 6, h.top[2] + 0.5];
        const k = h.snapped;
        bot[0] = lerp(h.bot0[0], to[0], k); bot[1] = lerp(h.bot0[1], to[1], k); bot[2] = lerp(h.bot0[2], to[2], k);
      } else {
        bot[1] = 0.9 + this.deckShift(h.s * 7.8, h.z);
      }
    });

    // Where she stands, and how the deck under her leans.
    if (this.outside) {
      const g = this.segAt(cam.z + STOP);
      const ground = this.ds(cam.x, cam.z);
      this.ground = lerp(this.ground, ground, 1 - Math.exp(-dt * 10));
      const bob = this.runV > 1 ? Math.abs(Math.sin(this.stride * Math.PI)) * 0.06 : 0;
      this.eye = ROAD + this.ground + this.stance + bob;
      const lean = g ? g.bank * 0.7 * Math.cos(cam.yaw) - g.pitch * 0.5 * Math.sin(cam.yaw) : 0;
      this.roll = lerp(this.roll, lean, 1 - Math.exp(-dt * 4));
    }

    // Head on a moving thing.
    if (this.track) {
      const p = this.track.fn();
      const a = this.v.aim(p.x, p.y, p.z, false);
      const k = 1 - Math.exp(-dt * this.track.rate);
      this.base.yaw = angleLerp(this.base.yaw, a.yaw, k);
      this.base.pitch = lerp(this.base.pitch, clamp(a.pitch, -1.1, 1.3), k);
    }
    super.update(time, delta);
  }

  updateLights(time) {
    const dip = this.dipK;
    const held = this.held || 0;
    this.lanterns.forEach((l) => {
      const centre = l.z > TOWERS[0] && l.z < TOWERS[1];
      let lit = centre ? held * 0.6 : clamp(1 - dip * (0.4 + 0.6 * Math.random()), 0.1, 1);
      const dy = this.deckShift(l.s * 7.3, l.z);
      if (dy < -70) lit = 0;
      const on = lit > 0.3 ? 1 : 0;
      if (on !== l.lit) {
        l.lit = on;
        this.v.setBoardTexture(l.post, on ? 'br_lantern' : 'br_lantern_off');
      }
      l.post.y = WALK_Y + dy;
      l.glow.y = WALK_Y + 3.9 + dy;
      l.post.visible = dy > -70;
      l.glow.alpha = 0.75 * lit;
      if (centre) l.glow.img.setTint(0xffd070);
      l.pool.alpha = 0.5 * lit;
      l.pool.points.forEach((pt, i) => { pt[1] = l.pool.orig[i][1] + this.deckShift(pt[0], pt[2]); });
    });
    this.lamps.forEach((l) => { l.glow.alpha = 0.02; l.fix.alpha = 0.35; });
    this.v.setFog('inside', 0x120d0c, 5);
    this.v.shell.fog = { color: 0x120d0c, dist: 5 };
  }

  updateHands(dt, t) {
    super.updateHands(dt, t);
    const k = 1 - Math.exp(-dt * 6);
    this.reachOff = lerp(this.reachOff, this.handsMode === 'reach' ? 0 : 1, k);
    this.carryOff = lerp(this.carryOff, this.handsMode === 'carry' ? 0 : 1, k);
    const bob = this.runV > 1 ? Math.sin(this.stride * Math.PI * 2) * 9 : 0;
    this.reachImg.setPosition(CX + 60, VIEW_H + 40 + this.reachOff * 620).setVisible(this.reachOff < 0.98);
    this.carryImg.setPosition(-40 + bob * 0.5, VIEW_H + 60 + bob + this.carryOff * 680).setVisible(this.carryOff < 0.98);
  }

  // Who's being looked at, while there are still people to get off.
  updateTarget() {
    if (this.phase !== 'evac' || this.busy || ui.dialogue.active) {
      if (this.target) { this.target = null; ui.hidePrompt(); }
      return;
    }
    const open = this.spots.filter((s) => !s.visits && (s.id !== 'door' || this.evacReady));
    if (AUTOPLAY && !this.autoBusy) {
      const next = open.find((s) => s.need) || open.find((s) => s.id === 'door');
      if (next) {
        this.autoBusy = true;
        this.time.delayedCall(900, () => { this.autoBusy = false; if (this.phase === 'evac' && !this.busy) this.evacVisit(next); });
      }
    }
    const fresh = this.time.now - this.pointer.at < 2500 && input.lastDevice !== 'touch';
    const ax = fresh ? this.pointer.x : CX;
    const ay = fresh ? this.pointer.y : VIEW_H / 2;
    let best = null;
    let bestD = 1e9;
    for (const s of open) {
      const p = this.v.project(s.at[0], s.at[1], s.at[2], false);
      if (!p) continue;
      const d = Math.hypot(p.x - ax, p.y - ay);
      if (d > 220) continue;
      const score = d + p.z * 22;
      if (score < bestD) { bestD = score; best = { s, p }; }
    }
    if (!best) {
      if (this.target) { this.target = null; ui.hidePrompt(); }
      return;
    }
    if (this.target !== best.s) {
      this.target = best.s;
      ui.showPrompt(SPAN.people[best.s.id].label, best.p.x, best.p.y - 70, input.keyName('action'));
    } else {
      ui.movePrompt(best.p.x, best.p.y - 70);
    }
  }

  teardown() {
    this.events.off('update', this.runStep, this);
    super.teardown();
  }
}

const WALK_Y = TRAM_GEOM.WALK;
