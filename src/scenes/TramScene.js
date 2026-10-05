import Phaser from 'phaser';
import { VIEW_W, VIEW_H } from '../config.js';
import { ui } from '../ui/UI.js';
import { narrative } from '../core/NarrativeState.js';
import { sound } from '../audio/soundscape.js';
import * as sfx from '../audio/sfx.js';
import { ScreenFX } from '../fx/ScreenFX.js';
import { wait } from '../systems/Cutscene.js';
import { input } from '../systems/Input.js';
import { View3D } from '../fp/View3D.js';
import { PANO_W } from '../art/tram.js';
import { TRAM } from '../data/tram.js';

// Tram 6, the last run across the Lantern Bridge, seen through the eyes of
// its driver. Nobody on board is anybody. That's the point.
//
// Units are metres. The bridge runs along +z; the tram's position on it is
// view.offset. Inside the tram, z runs from the rear wall (-11.6) to the
// windscreen (1.6); the right-hand side (+x) has the door.

const ADD = Phaser.BlendModes.ADD;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const AUTOPLAY = new URLSearchParams(window.location.search).has('autoplay');

const EYE = 1.62;
const W = 1.25;            // half-width of the carriage
const REAR = -11.6;
const FRONT = 1.6;
const ROOF = 2.3;
const SILL = 0.95;
const WIN_TOP = 1.95;
const DOOR = [-1.55, -0.35];
const DOOR_TOP = 2.05;
const ROAD = -0.4;          // the deck, below the tram floor
const WALK = -0.2;

const START = -110;
const STOP = 320;           // Lantern Midspan
const TOWERS = [120, 520];
const CRUISE = 10;

const CAB = { x: 0.05, z: 0.55 };
const DOORWAY = { x: 1.12, z: -0.95 };

// Where the gold light and the hole in the stars hang (world space).
const SKY_C = { x: 230, y: 135, z: STOP + 110 };

const hex = (s) => parseInt(s.slice(1), 16);
function mixInt(a, b, t) {
  const ch = (s) => Math.round(((a >> s) & 255) + ((((b >> s) & 255) - ((a >> s) & 255)) * t));
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function angleLerp(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export class TramScene extends Phaser.Scene {
  constructor() {
    super('Tram');
  }

  create() {
    narrative.setStage('tram');
    this.tweens.timeScale = 1;
    this.time.timeScale = 1;
    this.cameras.main.setBackgroundColor('#03020a');
    this.fx = new ScreenFX(this);
    this.fx.set({ fade: 1, grain: 0.09, vignette: 0.85, aberration: 0.45, desat: 0.04, tintR: 1.03, tintG: 1, tintB: 0.95, exposure: 1 });

    this.v = new View3D(this, { focal: 820 });
    this.v.offset = START;
    this.v.cam.x = CAB.x;
    this.v.cam.z = CAB.z;
    this.v.cam.y = EYE;
    this.v.setFog('outside', 0x0a0812, 240);
    this.v.setFog('inside', 0x120d0c, 14);
    this.v.shell.fog = { color: 0x120d0c, dist: 14 };

    this.speed = 0;
    this.targetSpeed = 0;
    this.travelled = 0;
    this.doorOpen = 0;
    this.frost = 0;
    this.interiorLight = 1;
    this.handsMode = 'cab';
    this.base = { yaw: 0, pitch: -0.05 };
    this.soft = { yaw: 0, pitch: 0, tx: 0, ty: 0 };
    this.free = false;
    this.pointer = { x: CX, y: CY, at: -1e9 };
    this.driveCues = TRAM.drive.map((c) => ({ ...c, done: false }));

    this.buildBackdrop();
    this.buildBridge();
    this.buildTram();
    this.buildPeople();
    this.buildSky();
    this.buildHands();
    this.bindInput();

    window.__tram = this;
    this.events.once('shutdown', () => this.teardown());
    this.run();
  }

  // --- world ------------------------------------------------------------------
  buildBackdrop() {
    this.skyGrad = this.add.image(0, 0, 'tr_skygrad').setOrigin(0, 1).setDepth(0);
    this.stars = this.add.graphics().setDepth(1);
    this.far = [0, 1].map(() => this.add.image(0, 0, 'tr_far').setOrigin(0, 1).setScale(4).setDepth(3));
    this.water = [0, 1].map(() => this.add.image(0, 0, 'tr_water').setOrigin(0, 0).setScale(4, 6).setDepth(2));

    // Stars as directions, so they sit still in the sky while the head turns.
    // Thicker toward where the two lights will be.
    const r = Phaser.Math.RND;
    r.sow(['tram6']);
    const toward = this.dirTo(SKY_C, { x: DOORWAY.x, y: EYE, z: STOP + DOORWAY.z });
    this.starDirs = [];
    for (let i = 0; i < 900; i++) {
      let d;
      if (i < 480) {
        const az = toward.az + r.realInRange(-0.6, 0.6) * r.frac();
        const el = clamp(toward.el + r.realInRange(-0.45, 0.45) * r.frac(), 0.05, 1.5);
        d = { az, el };
      } else {
        d = { az: r.realInRange(-Math.PI, Math.PI), el: Math.asin(r.realInRange(0.04, 1)) };
      }
      this.starDirs.push({ ...d, b: r.realInRange(0.25, 1), s: r.frac() < 0.08 ? 2 : 1, tw: r.realInRange(0, 6) });
    }
  }

  dirTo(p, from) {
    const dx = p.x - from.x;
    const dy = p.y - from.y;
    const dz = p.z - from.z;
    return { az: Math.atan2(dx, dz), el: Math.atan2(dy, Math.hypot(dx, dz)) };
  }

  buildBridge() {
    const v = this.v;
    const W0 = { world: true, layer: 'outside' };
    // Road, walkways, rails.
    v.poly([[-5, ROAD, -500], [5, ROAD, -500], [5, ROAD, 1100], [-5, ROAD, 1100]], { ...W0, fill: 0x16121a, ground: true });
    [-1, 1].forEach((s) => {
      v.poly([[s * 5, WALK, -500], [s * 7.8, WALK, -500], [s * 7.8, WALK, 1100], [s * 5, WALK, 1100]], { ...W0, fill: 0x221a24, ground: true });
      v.poly([[s * 5, ROAD, -500], [s * 5, WALK, -500], [s * 5, WALK, 1100], [s * 5, ROAD, 1100]], { ...W0, fill: 0x2a2030, ground: true });
      v.line([[s * 0.72, ROAD + 0.01, -500], [s * 0.72, ROAD + 0.01, 1100]], { color: 0x8a7468, alpha: 0.55, width: 2 });
      v.line([[s * 7.8, 0.9, -500], [s * 7.8, 0.9, 1100]], { color: 0x3a3040, alpha: 1, width: 3 });
      v.line([[s * 7.8, 0.45, -500], [s * 7.8, 0.45, 1100]], { color: 0x2a2230, alpha: 1, width: 2 });
    });
    // Expansion joints and balusters, recycled around the tram so the deck
    // reads as moving.
    this.joints = [];
    for (let i = 0; i < 30; i++) {
      const pts = [[-5, ROAD, 0], [5, ROAD, 0], [5, ROAD, 0], [-5, ROAD, 0]];
      this.joints.push(v.poly(pts, { ...W0, fill: 0x0b080d, ground: true }));
    }
    this.balusters = [];
    for (let i = 0; i < 70; i++) {
      [-1, 1].forEach((s) => this.balusters.push({ s, l: v.line([[s * 7.8, WALK, 0], [s * 7.8, 0.9, 0]], { color: 0x2e2636, width: 1.5 }) }));
    }

    // Lanterns, both sides, every 16 m, with a pool of light on the walkway.
    this.lanterns = [];
    for (let z = -296; z <= 920; z += 16) {
      [-1, 1].forEach((s) => {
        const post = v.board('br_lantern', { ...W0, x: s * 7.3, y: WALK, z, h: 4.6, flip: s < 0 });
        const glow = v.board('light_soft', { ...W0, x: s * 7.3, y: WALK + 3.9, z, h: 3.2, anchor: 0.5, blend: ADD, tint: 0xf2c070, alpha: 0.75 });
        glow.fog = false;
        const pool = v.poly([[s * 5.6, WALK + 0.01, z - 1.6], [s * 7.8, WALK + 0.01, z - 2.2], [s * 7.8, WALK + 0.01, z + 2.2], [s * 5.6, WALK + 0.01, z + 1.6]], { ...W0, fill: 0x5a3e26, alpha: 0.5, ground: true });
        this.lanterns.push({ z, s, post, glow, pool, lit: 1, flick: null });
      });
    }

    // Towers: twin legs outside the deck, two crossbeams and a low arch the
    // tram passes under. Small lamps run up the inner faces.
    TOWERS.forEach((T) => {
      const g = v.group([0, 20, T]);
      [-1, 1].forEach((s) => {
        this.box(g, s > 0 ? 7.9 : -9.3, s > 0 ? 9.3 : -7.9, -42, 60, T - 0.9, T + 0.9, { front: 0x1e1824, side: s > 0 ? 0x2a2232 : 0x2a2232, back: 0x141018, top: 0x2a2232 });
        for (let y = 6; y < 58; y += 7) {
          const lamp = v.board('light_soft', { ...W0, x: s * 7.85, y, z: T - 0.95, h: 1.3, anchor: 0.5, blend: ADD, tint: 0xf2c070, alpha: 0.55 });
          lamp.fog = false;
        }
        const crown = v.board('light_soft', { ...W0, x: s * 8.6, y: 61, z: T, h: 9, anchor: 0.5, blend: ADD, tint: 0xffd890, alpha: 0.7 });
        crown.fog = false;
      });
      this.box(g, -7.9, 7.9, 21, 23.4, T - 0.7, T + 0.7, { front: 0x1a1420, side: 0x1a1420, back: 0x141018, top: 0x241c2a, bottom: 0x100c14 });
      this.box(g, -7.9, 7.9, 49, 51.6, T - 0.7, T + 0.7, { front: 0x1a1420, side: 0x1a1420, back: 0x141018, top: 0x241c2a, bottom: 0x100c14 });
      this.box(g, -7.9, 7.9, 8.4, 9.1, T - 0.4, T + 0.4, { front: 0x241c2a, side: 0x241c2a, back: 0x141018, bottom: 0x18121c });
    });

    // Main cables: anchored at the banks, over the tower tops, sagging to
    // midspan. Hangers drop to the rail.
    const cableY = (z) => {
      if (z <= TOWERS[0]) return lerp(WALK, 60, Math.pow((z + 360) / (TOWERS[0] + 360), 1.6));
      if (z >= TOWERS[1]) return lerp(WALK, 60, Math.pow((1000 - z) / (1000 - TOWERS[1]), 1.6));
      const m = (TOWERS[0] + TOWERS[1]) / 2;
      const k = (z - m) / ((TOWERS[1] - TOWERS[0]) / 2);
      return 10 + 50 * k * k;
    };
    [-1, 1].forEach((s) => {
      [8.45, 8.75].forEach((x, i) => {
        const pts = [];
        for (let z = -360; z <= 1000; z += 10) pts.push([s * x, cableY(z), z]);
        v.line(pts, { color: i ? 0x2c2434 : 0x3a3044, width: i ? 2 : 3 });
      });
      for (let z = TOWERS[0] + 8; z < TOWERS[1]; z += 8) v.line([[s * 8.5, cableY(z), z], [s * 7.8, 0.9, z]], { color: 0x2a2232, width: 1 });
    });

    // Lantern Midspan: the shelter, and a ladder left against a post.
    this.kiosk = v.board('tr_kiosk', { ...W0, x: 6.4, y: WALK, z: STOP - 1.2, h: 3.7 });
    this.ladder = v.board('tr_ladder', { ...W0, x: 7.0, y: WALK, z: 327.2, h: 4.2 });

    // A few people still walking the bridge.
    this.walkers = [
      { key: 'br_civ0', x: 6.4, z: -40, vz: -1.3 },
      { key: 'br_civ3', x: -6.2, z: 40, vz: 1.2 },
      { key: 'br_civ5', x: 6.6, z: 150, vz: -1.1 },
      { key: 'br_civ1', x: -6.5, z: 230, vz: -1.4 },
    ].map((w) => ({ ...w, b: v.board(w.key, { ...W0, x: w.x, y: WALK, z: w.z, h: 1.75, tint: 0xa8a0b0, flip: w.vz > 0 }) }));
  }

  // An axis-aligned box as up to six faces in a group.
  box(group, x0, x1, y0, y1, z0, z1, c) {
    const v = this.v;
    const o = { group, world: group.world };
    if (c.front !== undefined) v.poly([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], { ...o, fill: c.front });
    if (c.back !== undefined) v.poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], { ...o, fill: c.back });
    if (c.side !== undefined) {
      v.poly([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], { ...o, fill: c.side });
      v.poly([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], { ...o, fill: c.side });
    }
    if (c.top !== undefined) v.poly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], { ...o, fill: c.top });
    if (c.bottom !== undefined) v.poly([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], { ...o, fill: c.bottom });
  }

  buildTram() {
    const v = this.v;
    const S = { layer: 'shell' };
    const quad = (pts, fill, opts = {}) => v.poly(pts, { ...S, fill, ...opts });
    const C = {
      floor: 0x3a2a20, slat: 0x2a1e18, lower: 0x5a2228, sill: 0x9a7a44, upper: 0xd2c29c,
      pillar: 0xc4b48e, roof: 0xe4d8b8, roofRail: 0xb8a882, front: 0x4a1c22,
    };
    // Floor and its slats.
    quad([[-W, 0, REAR], [W, 0, REAR], [W, 0, FRONT], [-W, 0, FRONT]], C.floor);
    for (let z = REAR + 0.3; z < FRONT; z += 0.45) quad([[-W, 0, z], [W, 0, z], [W, 0, z + 0.05], [-W, 0, z + 0.05]], C.slat);
    quad([[-0.32, 0, REAR], [0.32, 0, REAR], [0.32, 0, FRONT - 0.6], [-0.32, 0, FRONT - 0.6]], 0x2e2220);
    // Ceiling, with a lamp rail down the middle.
    quad([[-W, ROOF, REAR], [W, ROOF, REAR], [W, ROOF, FRONT], [-W, ROOF, FRONT]], C.roof);
    quad([[-0.12, ROOF, REAR], [0.12, ROOF, REAR], [0.12, ROOF, FRONT], [-0.12, ROOF, FRONT]], C.roofRail);
    [-1, 1].forEach((s) => quad([[s * 0.9, ROOF, REAR], [s * 0.94, ROOF, REAR], [s * 0.94, ROOF, FRONT], [s * 0.9, ROOF, FRONT]], C.roofRail));

    // Side walls: lower panel, sill, the strip above the windows, pillars.
    // The door gap on the right is left open.
    this.glass = [];
    [-1, 1].forEach((s) => {
      const x = s * W;
      const spans = s > 0 ? [[REAR, DOOR[0]], [DOOR[1], FRONT]] : [[REAR, FRONT]];
      spans.forEach(([z0, z1]) => {
        quad([[x, 0, z0], [x, 0, z1], [x, SILL, z1], [x, SILL, z0]], C.lower);
        quad([[x, SILL, z0], [x, SILL, z1], [x, SILL + 0.05, z1], [x, SILL + 0.05, z0]], C.sill);
        quad([[x, WIN_TOP, z0], [x, WIN_TOP, z1], [x, ROOF, z1], [x, ROOF, z0]], C.upper);
        // Pillars and panes between them.
        const n = Math.max(1, Math.round((z1 - z0) / 1.35));
        const step = (z1 - z0) / n;
        for (let i = 0; i <= n; i++) {
          const z = z0 + i * step;
          const pz0 = Math.max(z0, z - 0.07);
          const pz1 = Math.min(z1, z + 0.07);
          quad([[x, SILL, pz0], [x, SILL, pz1], [x, WIN_TOP, pz1], [x, WIN_TOP, pz0]], C.pillar);
          if (i < n) this.glass.push(quad([[x, SILL + 0.05, z + 0.07], [x, SILL + 0.05, z + step - 0.07], [x, WIN_TOP, z + step - 0.07], [x, WIN_TOP, z + 0.07]], 0x8aa0b0, { alpha: 0.07, fog: false }));
        }
      });
    });
    // Above the door.
    quad([[W, DOOR_TOP, DOOR[0]], [W, DOOR_TOP, DOOR[1]], [W, ROOF, DOOR[1]], [W, ROOF, DOOR[0]]], C.upper);
    // Windscreen: three panes in a maroon front.
    quad([[-W, 0, FRONT], [W, 0, FRONT], [W, 1.02, FRONT], [-W, 1.02, FRONT]], C.front);
    quad([[-W, 2.06, FRONT], [W, 2.06, FRONT], [W, ROOF, FRONT], [-W, ROOF, FRONT]], C.upper);
    [[-W, -1.12], [1.12, W], [-0.42, -0.36], [0.36, 0.42]].forEach(([a, b]) => quad([[a, 1.02, FRONT], [b, 1.02, FRONT], [b, 2.06, FRONT], [a, 2.06, FRONT]], C.pillar));
    [[-1.12, -0.42], [-0.36, 0.36], [0.42, 1.12]].forEach(([a, b]) => this.glass.push(quad([[a, 1.02, FRONT], [b, 1.02, FRONT], [b, 2.06, FRONT], [a, 2.06, FRONT]], 0x8aa0b0, { alpha: 0.05, fog: false })));
    // Rear wall and its window.
    quad([[-W, 0, REAR], [W, 0, REAR], [W, 1.0, REAR], [-W, 1.0, REAR]], C.lower);
    quad([[-W, 1.9, REAR], [W, 1.9, REAR], [W, ROOF, REAR], [-W, ROOF, REAR]], C.upper);
    [[-W, -0.9], [0.9, W]].forEach(([a, b]) => quad([[a, 1.0, REAR], [b, 1.0, REAR], [b, 1.9, REAR], [a, 1.9, REAR]], C.upper));
    this.glass.push(quad([[-0.9, 1.0, REAR], [0.9, 1.0, REAR], [0.9, 1.9, REAR], [-0.9, 1.9, REAR]], 0x8aa0b0, { alpha: 0.07, fog: false }));

    // Door leaves: maroon below, glazed above. They slide back into the wall.
    this.leaves = [0, 1].map(() => {
      const panel = quad([[W - 0.004, 0, 0], [W - 0.004, 0, 0], [W - 0.004, 1.0, 0], [W - 0.004, 1.0, 0]], C.lower);
      const frame = quad([[W - 0.004, 1.0, 0], [W - 0.004, 1.0, 0], [W - 0.004, DOOR_TOP, 0], [W - 0.004, DOOR_TOP, 0]], C.pillar);
      const pane = quad([[W - 0.005, 1.06, 0], [W - 0.005, 1.06, 0], [W - 0.005, DOOR_TOP - 0.06, 0], [W - 0.005, DOOR_TOP - 0.06, 0]], 0x0e0a10, { alpha: 0.85, fog: false });
      return { panel, frame, pane };
    });

    // Benches along both walls, in segments so they sort well.
    const I = { layer: 'inside' };
    [-1, 1].forEach((s) => {
      const z1 = s > 0 ? DOOR[0] - 0.25 : -0.4;
      for (let z = REAR + 0.4; z < z1 - 0.01; z += 1.35) {
        const e = Math.min(z + 1.35, z1);
        v.poly([[s * 1.2, 0.5, z], [s * 1.2, 0.5, e], [s * 1.2, 0.94, e], [s * 1.2, 0.94, z]], { ...I, fill: 0x6a2a24 });
        v.poly([[s * 0.8, 0.46, z], [s * 1.22, 0.46, z], [s * 1.22, 0.46, e], [s * 0.8, 0.46, e]], { ...I, fill: 0x7a3428 });
        v.poly([[s * 0.8, 0.06, z], [s * 0.8, 0.06, e], [s * 0.8, 0.46, e], [s * 0.8, 0.46, z]], { ...I, fill: 0x3a1a16 });
      }
    });
    // The dash: a box under the windscreen, and its painted face.
    v.poly([[-1.2, 1.0, 1.0], [1.2, 1.0, 1.0], [1.2, 1.0, FRONT], [-1.2, 1.0, FRONT]], { ...I, fill: 0x2a1a12 });
    v.poly([[-1.2, 0.2, 1.0], [1.2, 0.2, 1.0], [1.2, 1.0, 1.0], [-1.2, 1.0, 1.0]], { ...I, fill: 0x1e140e });
    v.board('tr_dash', { x: 0, y: 0.56, z: 0.99, h: 0.44 });
    // Grab poles and ceiling lamps.
    [-1.9, -4.7, -7.5, -10.2].forEach((z, i) => {
      v.board('tr_pole', { x: (i % 2 ? -1 : 1) * 0.74, y: 0, z, h: ROOF });
      v.board('tr_pole', { x: (i % 2 ? 1 : -1) * 0.74, y: 0, z: z - 1.35, h: ROOF });
    });
    this.lamps = [];
    for (let z = REAR + 1.2; z < FRONT - 0.6; z += 2.7) {
      const fix = v.board('tr_lamp', { x: 0, y: ROOF - 0.002, z, h: 0.14, anchor: 0 });
      const glow = v.board('light_soft', { x: 0, y: ROOF - 0.12, z, h: 1.3, anchor: 0.5, blend: ADD, tint: 0xffdca0, alpha: 0.4 });
      glow.fog = false;
      this.lamps.push({ fix, glow });
    }
  }

  buildPeople() {
    const v = this.v;
    const P = (key, x, z, flip = false) => v.board(key, { x, y: 0, z, h: 1.3, flip });
    this.people = {
      teo: P('tr_teo', 1.0, -3.6),
      mara: P('tr_mara', 1.0, -4.25),
      sami: P('tr_sami', -1.0, -6.75, true),
      nell: P('tr_nell', -1.0, -7.4, true),
      aurelio: P('tr_aurelio', 1.0, -9.0),
      sleeper: P('tr_sleeper', -1.0, -10.4, true),
    };
    // Each figure is painted in profile facing left. They face the aisle, so
    // which way they should face on screen depends on where she's standing.
    this.facing = Object.values(this.people).map((b) => ({ b, fx: b.x > 0 ? -1 : 1 }));
    // What can be looked at and spoken to: a head to aim at, a place to stand.
    this.spots = [
      { id: 'mara', at: [1.0, 1.0, -3.95], stand: [0.12, -2.85], need: true },
      { id: 'couple', at: [-1.0, 1.0, -7.05], stand: [-0.1, -5.9], need: true },
      { id: 'aurelio', at: [1.0, 1.05, -9.0], stand: [0.12, -7.85], need: true },
      { id: 'sleeper', at: [-1.0, 0.95, -10.4], stand: [-0.08, -9.3], need: false },
    ].map((s) => ({ ...s, visits: 0 }));
  }

  buildSky() {
    // The two lights are drawn in screen space from projected positions, under
    // the bridge layers: they are very far away.
    this.gold = {
      halo: this.add.image(0, 0, 'light_soft').setBlendMode(ADD).setTint(0xffd890).setDepth(4).setVisible(false),
      core: this.add.image(0, 0, 'light_core').setBlendMode(ADD).setTint(0xfff2d0).setDepth(4).setVisible(false),
      flare: this.add.image(0, 0, 'light_streak').setBlendMode(ADD).setTint(0xffe2a0).setDepth(4).setVisible(false).setOrigin(0.5),
      p: { x: 0, y: 0, z: 0 }, size: 1, alpha: 0,
    };
    this.hole = { img: this.add.image(0, 0, 'tr_hole').setDepth(4).setVisible(false), p: { x: 0, y: 0, z: 0 }, size: 1, alpha: 0 };
    this.dance = null;
  }

  buildHands() {
    this.hands = this.add.image(CX + 40, VIEW_H + 30, 'tr_hands').setOrigin(0.5, 1).setDepth(40).setScale(0.92);
    this.punchHand = this.add.image(VIEW_W - 170, VIEW_H + 40, 'tr_punch').setOrigin(0.5, 1).setDepth(40).setScale(0.8).setVisible(false);
    this.handsY = 0;
  }

  // --- input ----------------------------------------------------------------------
  bindInput() {
    this.drag = null;
    this.input.on('pointermove', (p) => {
      if (p.wasTouch) {
        if (this.drag && this.free) {
          const dx = p.x - this.drag.x;
          const dy = p.y - this.drag.y;
          if (Math.abs(dx) + Math.abs(dy) > 6) this.drag.moved = true;
          this.base.yaw -= dx * 0.0032;
          this.base.pitch = clamp(this.base.pitch + dy * 0.0032, -0.7, 1.25);
          this.drag.x = p.x; this.drag.y = p.y;
        }
        return;
      }
      this.pointer = { x: p.x, y: p.y, at: this.time.now };
    });
    this.input.on('pointerdown', (p) => {
      if (ui.dialogue.active) return;
      if (p.wasTouch) { this.drag = { x: p.x, y: p.y, moved: false }; return; }
      this.pointer = { x: p.x, y: p.y, at: this.time.now };
      this.onAction();
    });
    this.input.on('pointerup', (p) => {
      if (p.wasTouch && this.drag && !this.drag.moved && !ui.dialogue.active) {
        this.pointer = { x: p.x, y: p.y, at: this.time.now };
        this.onAction();
      }
      this.drag = null;
    });
    this.releaseAction = input.pushActionHandler(() => this.onAction());
    ui.onPromptTap = () => this.onAction();
  }

  onAction() {
    if (this.waitingFor) {
      const fn = this.waitingFor;
      this.waitingFor = null;
      fn();
      return;
    }
    if (this.phase === 'drive' && this.speed > 0.5) {
      // The foot gong, for nobody in particular.
      if (!this.gongAt || this.time.now - this.gongAt > 900) { this.gongAt = this.time.now; sfx.tramGong({ gain: 0.06 }); }
      return;
    }
    if (this.phase === 'tickets' && this.target && !this.busy) this.visit(this.target);
  }

  // Resolves on the next action press (or by itself under ?autoplay).
  awaitAction(autoMs = 1500) {
    return new Promise((resolve) => {
      this.waitingFor = resolve;
      if (AUTOPLAY) this.time.delayedCall(autoMs, () => { if (this.waitingFor === resolve) { this.waitingFor = null; resolve(); } });
    });
  }

  teardown() {
    this.releaseAction?.();
    ui.onPromptTap = null;
    ui.hidePrompt();
    ui.hint('');
    ui.touch.setMovement(false);
    ui.touch.setAction(false);
    if (window.__tram === this) delete window.__tram;
  }

  // --- story ----------------------------------------------------------------------
  async run() {
    sound.stopAll(0.3);
    await wait(this, 900);
    sound.tram.start({ fadeIn: 4 });
    await ui.dialogue.play([{ id: 'tr_last', speaker: 'inesThought', text: 'Last run.', auto: 2200 }]);
    this.fx.fadeTo(0, 3200);
    await wait(this, 2000);
    sfx.radio();
    await wait(this, 350);
    await ui.dialogue.play(TRAM.open);
    sfx.radio({ open: false });

    // Off the brake.
    ui.hint(`${input.keyName('action')} — release the brake`);
    ui.touch.setAction(true, 'Brake');
    await this.awaitAction(1200);
    ui.touch.setAction(false);
    ui.hint('');
    sfx.brakeHiss({ gain: 0.06 });
    sfx.tramGong();
    this.phase = 'drive';
    this.targetSpeed = CRUISE;
    this.free = true;
    ui.touch.setMovement(true);
    await wait(this, 1800);
    ui.hint(input.lastDevice === 'touch' ? 'Drag to look around' : 'Move the mouse to look around · A / D to turn', 6000);

    // The drive runs in update(); the stop resolves this.
    await new Promise((resolve) => { this.onStopped = resolve; });
    this.phase = 'stopped';
    sfx.brakeHiss({ gain: 0.07, duration: 1.6 });
    await wait(this, 900);
    sfx.doorSlide({ gain: 0.1, open: true });
    this.tweens.add({ targets: this, doorOpen: 1, duration: 1300, ease: 'Sine.easeInOut' });
    sound.tram.setOpen(true);
    // Look out at the empty stop.
    await this.turnTo(Math.PI / 2 - 0.15, -0.05, 1400);
    await wait(this, 900);
    await ui.dialogue.play(TRAM.midspan);

    // Tickets.
    this.handsMode = 'punch';
    await this.turnTo(Math.PI, -0.12, 1200);
    this.phase = 'tickets';
    ui.hint(input.lastDevice === 'touch' ? 'Look at a passenger and tap' : `Look at a passenger · ${input.keyName('action')} or click`, 7000);
    await new Promise((resolve) => { this.onTicketsDone = resolve; });
    this.phase = 'after';
    ui.hidePrompt();
    this.target = null;
    await wait(this, 700);
    await ui.dialogue.play(TRAM.wrong);
    await this.wrongness();
  }

  async visit(spot) {
    this.busy = true;
    ui.hidePrompt();
    const first = spot.visits === 0;
    spot.visits++;
    // Walk over and face them.
    await this.walkTo(spot.stand[0], spot.stand[1], spot.at);
    if (first && spot.id !== 'sleeper') sfx.punch();
    const lines = TRAM.people[spot.id][first ? 'first' : 'again'];
    await ui.dialogue.play(lines);
    if (first && spot.id !== 'sleeper') { sfx.punch(); await wait(this, 120); sfx.punch(); }
    this.busy = false;
    if (this.spots.every((s) => !s.need || s.visits > 0) && this.onTicketsDone) {
      const done = this.onTicketsDone;
      this.onTicketsDone = null;
      done();
    }
  }

  walkTo(x, z, lookAt) {
    const cam = this.v.cam;
    const dist = Math.hypot(x - cam.x, z - cam.z);
    const ms = Math.max(500, dist * 520);
    const steps = this.time.addEvent({ delay: 430, loop: true, callback: () => sfx.footstep({ kind: 'boot', gain: 0.5 }) });
    const from = { x: cam.x, z: cam.z, yaw: this.base.yaw, pitch: this.base.pitch };
    const end = lookAt ? this.aimFrom(x, z, lookAt) : { yaw: this.base.yaw, pitch: this.base.pitch };
    return new Promise((resolve) => {
      const s = { t: 0 };
      this.tweens.add({
        targets: s, t: 1, duration: ms, ease: 'Sine.easeInOut',
        onUpdate: () => {
          cam.x = lerp(from.x, x, s.t);
          cam.z = lerp(from.z, z, s.t);
          this.base.yaw = angleLerp(from.yaw, end.yaw, Math.min(1, s.t * 1.4));
          this.base.pitch = lerp(from.pitch, end.pitch, s.t);
        },
        onComplete: () => { steps.remove(); resolve(); },
      });
    });
  }

  aimFrom(x, z, [ax, ay, az]) {
    return { yaw: Math.atan2(ax - x, az - z), pitch: Math.atan2(ay - EYE, Math.hypot(ax - x, az - z)) };
  }

  turnTo(yaw, pitch, ms) {
    const from = { yaw: this.base.yaw, pitch: this.base.pitch };
    const s = { t: 0 };
    return new Promise((resolve) => {
      this.tweens.add({
        targets: s, t: 1, duration: ms, ease: 'Sine.easeInOut',
        onUpdate: () => {
          this.base.yaw = angleLerp(from.yaw, yaw, s.t);
          this.base.pitch = lerp(from.pitch, pitch, s.t);
        },
        onComplete: resolve,
      });
    });
  }

  // The lanterns flicker in a wave, the sound goes, the glass frosts.
  async wrongness() {
    const now = this.time.now;
    this.lanterns.forEach((l) => {
      const d = Math.abs(l.z - STOP);
      l.flick = { at: now + 600 + (1000 - Math.min(d, 1000)) * 2.2, dur: 900 + Math.random() * 400 };
    });
    this.lamps.forEach((l, i) => { l.flick = { at: now + 2600 + i * 60, dur: 700 }; });
    sound.tram.fadeTo(0.15, 4);
    sfx.hush({ duration: 9, gain: 0.015 });
    this.tweens.add({ targets: this, frost: 1, duration: 5000, ease: 'Sine.easeIn' });
    this.fx.tween({ desat: 0.25, tintB: 1.05, tintR: 0.96 }, 5000);
    await wait(this, 3200);
    ui.dialogue.play(TRAM.lookUp);
    await wait(this, 1800);
    // To the door.
    this.free = false;
    this.handsMode = 'none';
    await this.walkTo(DOORWAY.x, DOORWAY.z, null);
    await this.turnTo(Math.PI / 2 + 0.3, 0.05, 1000);
    this.free = true;
    this.startDance();
    ui.hint(input.lastDevice === 'touch' ? 'Look up' : `Look up · or ${input.keyName('action')}`);
    await new Promise((resolve) => {
      let done = false;
      const finish = () => { if (done) return; done = true; this.events.off('update', check); resolve(); };
      const check = () => { if (this.v.cam.pitch > 0.32) finish(); };
      this.events.on('update', check);
      this.awaitAction(2500).then(finish);
    });
    ui.hint('');
    const aim = this.aimAt(SKY_C);
    this.free = false;
    await this.turnTo(aim.yaw, aim.pitch, 1600);
    this.free = true;
    this.followSky = true;
    await ui.dialogue.play(TRAM.sky);
    await wait(this, 600);
    this.dance.mirror = true;
    await ui.dialogue.play(TRAM.mirror);
    await wait(this, 1200);
    await this.drop();
  }

  aimAt(p) {
    const c = this.v.cam;
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const dz = p.z - (c.z + this.v.offset);
    return { yaw: Math.atan2(dx, dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) };
  }

  startDance() {
    this.dance = { t: 0, mirror: false, still: false, falling: 0, fallFrom: null };
    [this.gold.halo, this.gold.core, this.gold.flare, this.hole.img].forEach((i) => i.setVisible(true));
    this.tweens.add({ targets: [this.gold, this.hole], alpha: 1, duration: 2500 });
  }

  // The dark one stops, turns, and falls on the bridge. The gold one follows.
  async drop() {
    const d = this.dance;
    d.still = true;
    await wait(this, 1400);
    ui.dialogue.play(TRAM.drop);
    // The rest of the lanterns go, from midspan outward.
    const now = this.time.now;
    this.lanterns.forEach((l) => {
      l.flick = null;
      l.outAt = now + Math.abs(l.z - STOP) * 3;
    });
    this.lamps.forEach((l) => { l.flick = null; l.outAt = now + 200; });
    sfx.whoosh({ gain: 0.08, duration: 2.2 });
    d.fallFrom = { ...this.hole.p };
    d.falling = 0.0001;
    this.followSky = false;
    this.tweens.add({ targets: d, falling: 1, duration: 1700, ease: 'Cubic.easeIn' });
    // Follow it down with the head.
    const look = { t: 0 };
    const from = { yaw: this.base.yaw, pitch: this.base.pitch };
    this.tweens.add({
      targets: look, t: 1, duration: 1500, ease: 'Sine.easeIn',
      onUpdate: () => {
        const a = this.aimAt(this.hole.p);
        this.base.yaw = angleLerp(from.yaw, a.yaw, look.t);
        this.base.pitch = lerp(from.pitch, clamp(a.pitch, -0.3, 1.3), look.t);
      },
    });
    await wait(this, 1550);
    sfx.flyBy({ gain: 0.12 });
    this.cameras.main.shake(500, 0.006);
    await wait(this, 300);
    sfx.lowImpact({ gain: 0.9, freq: 36 });
    sfx.distantBoom({ gain: 0.4 });
    this.fx.flash({ peak: 1, attack: 40, release: 2600 });
    sound.tram.stop(0.05);
    this.fx.set({ fade: 1 });
    this.free = false;
    ui.touch.setMovement(false);
    await wait(this, 3200);
    await ui.chapterCard('Chapter Two', 'The Starfall Record', 4800);
    ui.caption('End of the prototype.', 6000);
  }

  // --- frame ------------------------------------------------------------------------
  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    const t = time / 1000;
    const v = this.v;
    const cam = v.cam;

    // Driving.
    if (this.phase === 'drive') {
      const d = STOP - v.offset;
      const brake = Math.sqrt(Math.max(0, 2 * 1.1 * d));
      if (brake < this.speed + 0.01 && d < 120) {
        this.speed = brake;
        if (d < 0.05) {
          this.speed = 0;
          v.offset = STOP;
          this.phase = 'stopping';
          this.onStopped?.();
        }
      } else {
        this.speed = Math.min(this.targetSpeed, this.speed + 1.3 * dt);
      }
      v.offset += this.speed * dt;
      this.travelled += this.speed * dt;
      if (this.travelled > 14) { this.travelled -= 14; sound.tram.clack(0.5 + this.speed / CRUISE); }
      this.driveCues.forEach((c) => {
        if (!c.done && v.offset >= c.at) { c.done = true; if (!ui.dialogue.active) ui.dialogue.play(c.lines); }
      });
    }
    sound.tram.setSpeed(this.speed);

    // People walking the bridge.
    this.walkers.forEach((w) => { w.z += w.vz * dt; w.b.z = w.z; });

    // The head: scripted base plus a soft offset from the mouse.
    if (this.free) {
      const ax = input.axis();
      this.base.yaw += ax * 1.5 * dt;
      const fresh = time - this.pointer.at < 4000;
      const nx = fresh ? this.pointer.x / VIEW_W - 0.5 : 0;
      const ny = fresh ? this.pointer.y / VIEW_H - 0.5 : 0;
      this.soft.tx = nx * 0.9;
      this.soft.ty = -ny * 0.6;
      if (Math.abs(nx) > 0.38) this.base.yaw += Math.sign(nx) * (Math.abs(nx) - 0.38) * 7 * dt;
    } else {
      this.soft.tx = 0;
      this.soft.ty = 0;
    }
    if (this.followSky && this.dance) {
      const a = this.aimAt(this.mid || SKY_C);
      this.base.yaw = angleLerp(this.base.yaw, a.yaw, 1 - Math.exp(-dt * 1.2));
      this.base.pitch = lerp(this.base.pitch, a.pitch, 1 - Math.exp(-dt * 1.2));
    }
    const k = 1 - Math.exp(-dt * 6);
    this.soft.yaw = lerp(this.soft.yaw, this.soft.tx, k);
    this.soft.pitch = lerp(this.soft.pitch, this.soft.ty, k);
    const sway = this.speed / CRUISE;
    cam.yaw = this.base.yaw + this.soft.yaw;
    cam.pitch = clamp(this.base.pitch + this.soft.pitch, -0.75, 1.35);
    cam.roll = Math.sin(t * 1.7) * 0.006 * sway;
    cam.y = EYE + Math.sin(t * 6.1) * 0.006 * sway;

    // Doors and frost.
    const lz0 = DOOR[0] - this.doorOpen * 0.58;
    const lz1 = DOOR[1] + this.doorOpen * 0.58;
    const mid = (DOOR[0] + DOOR[1]) / 2;
    this.setLeaf(this.leaves[0], lz0, lz0 + (mid - DOOR[0]));
    this.setLeaf(this.leaves[1], lz1 - (DOOR[1] - mid), lz1);
    const fr = this.frost;
    this.glass.forEach((g) => {
      g.alpha = 0.06 + fr * 0.5;
      g.fill = mixInt(0x8aa0b0, 0xd2e2ec, fr);
    });

    this.facing.forEach(({ b, fx }) => {
      const a = v.project(b.x, b.y + 0.6, b.z, false);
      const c = v.project(b.x + fx * 0.3, b.y + 0.6, b.z, false);
      if (a && c && Math.abs(c.x - a.x) > 0.5) b.img.setFlipX(c.x > a.x);
    });
    this.updateLights(time);
    this.updateRecycled();
    this.updateSky(dt, time);
    v.render();
    this.drawBackdrop(time);
    this.updateHands(dt, t);
    this.updateTarget();
  }

  setLeaf(leaf, z0, z1) {
    const set = (p, y0, y1) => {
      p.points[0][2] = z0; p.points[1][2] = z1; p.points[2][2] = z1; p.points[3][2] = z0;
      p.points[0][1] = y0; p.points[1][1] = y0; p.points[2][1] = y1; p.points[3][1] = y1;
    };
    set(leaf.panel, 0, 1.0);
    set(leaf.frame, 1.0, DOOR_TOP);
    const pz0 = z0 + 0.06, pz1 = z1 - 0.06;
    const p = leaf.pane;
    p.points[0][2] = pz0; p.points[1][2] = pz1; p.points[2][2] = pz1; p.points[3][2] = pz0;
    p.points[0][1] = 1.06; p.points[1][1] = 1.06; p.points[2][1] = DOOR_TOP - 0.06; p.points[3][1] = DOOR_TOP - 0.06;
    p.alpha = 0.18 + this.frost * 0.4;
  }

  updateLights(time) {
    const flick = (f) => {
      if (!f || time < f.at) return 1;
      const u = time - f.at;
      if (u > f.dur) return 1;
      return Math.random() < 0.5 ? 0.15 : 1;
    };
    this.lanterns.forEach((l) => {
      let lit = flick(l.flick);
      if (l.outAt && time > l.outAt) lit = 0;
      if (lit !== l.lit) {
        l.lit = lit;
        this.v.setBoardTexture(l.post, lit > 0.5 ? 'br_lantern' : 'br_lantern_off');
        if (!lit && l.outAt && !l.heard && Math.abs(l.z - STOP) < 40) { l.heard = true; sfx.lanternOut({ pan: l.s * 0.6 }); }
      }
      l.glow.alpha = 0.75 * lit;
      l.pool.alpha = 0.5 * lit;
    });
    let inside = 0;
    this.lamps.forEach((l) => {
      let lit = flick(l.flick);
      if (l.outAt && time > l.outAt) lit = 0.08;
      l.glow.alpha = 0.4 * lit;
      l.fix.alpha = 0.4 + 0.6 * lit;
      inside += lit;
    });
    // The carriage darkens with its lamps.
    const lvl = inside / this.lamps.length;
    this.v.setFog('inside', 0x120d0c, 3 + lvl * 11);
    this.v.shell.fog = { color: 0x120d0c, dist: 3 + lvl * 11 };
  }

  updateRecycled() {
    const o = this.v.offset;
    const base = Math.floor((o - 30) / 8) * 8;
    this.joints.forEach((p, i) => {
      const z = base + i * 8;
      p.points[0][2] = z; p.points[1][2] = z; p.points[2][2] = z + 0.14; p.points[3][2] = z + 0.14;
    });
    const bb = Math.floor((o - 40) / 2) * 2;
    for (let i = 0; i < this.balusters.length; i += 2) {
      const z = bb + (i / 2) * 2;
      this.balusters[i].l.points.forEach((pt) => { pt[2] = z; });
      this.balusters[i + 1].l.points.forEach((pt) => { pt[2] = z; });
    }
  }

  updateSky(dt, time) {
    const d = this.dance;
    if (!d) return;
    d.t += dt;
    // Two bodies circling a shared centre. At first they read as a pair;
    // then, side by side, as reflections.
    const tt = d.t;
    const R = d.mirror ? 30 + Math.sin(tt * 0.9) * 9 : 34;
    const ang = d.still ? d.ang : tt * 0.55;
    if (!d.still) d.ang = ang;
    const c = SKY_C;
    // A frame facing the viewer: u across, w up.
    const from = this.v.cam;
    const dx = c.x - from.x;
    const dz = c.z - (from.z + this.v.offset);
    const len = Math.hypot(dx, dz);
    const u = { x: dz / len, z: -dx / len };
    let gx, gy, hx, hy;
    if (d.mirror) {
      gx = Math.cos(ang) * R; gy = Math.sin(ang * 1.7) * R * 0.5;
      hx = -gx; hy = gy;
    } else {
      gx = Math.cos(ang) * R; gy = Math.sin(ang) * R * 0.45;
      hx = -gx; hy = -gy;
    }
    this.gold.p = { x: c.x + u.x * gx, y: c.y + gy, z: c.z + u.z * gx };
    let hp = { x: c.x + u.x * hx, y: c.y + hy, z: c.z + u.z * hx };
    if (d.falling > 0 && d.fallFrom) {
      // Down onto the bridge, just ahead of the tram.
      const target = { x: 0.5, y: 1.5, z: STOP + 26 };
      const f = d.falling;
      hp = { x: lerp(d.fallFrom.x, target.x, f), y: lerp(d.fallFrom.y, target.y, f), z: lerp(d.fallFrom.z, target.z, f) };
      const gf = Math.max(0, f - 0.25) / 0.75;
      this.gold.p = { x: lerp(this.gold.p.x, target.x, gf * 0.9), y: lerp(this.gold.p.y, target.y + 6, gf * 0.9), z: lerp(this.gold.p.z, target.z, gf * 0.9) };
    }
    this.hole.p = hp;
    this.mid = { x: (this.gold.p.x + hp.x) / 2, y: (this.gold.p.y + hp.y) / 2, z: (this.gold.p.z + hp.z) / 2 };

    const place = (img, p, h, alpha) => {
      const s = this.v.project(p.x, p.y, p.z, true);
      if (!s) { img.setVisible(false); return null; }
      const px = (h / s.z) * this.v.F;
      img.setVisible(alpha > 0).setPosition(s.x, s.y).setScale(px / img.height).setAlpha(alpha);
      return s;
    };
    const pulse = 1 + Math.sin(time / 300) * 0.05;
    place(this.gold.halo, this.gold.p, 80 * pulse, this.gold.alpha * 0.9);
    place(this.gold.core, this.gold.p, 9, this.gold.alpha);
    const fs = place(this.gold.flare, this.gold.p, 3, this.gold.alpha * 0.7);
    if (fs) this.gold.flare.setScale(this.gold.flare.scaleY * 6, this.gold.flare.scaleY);
    place(this.hole.img, hp, 46, this.hole.alpha);
  }

  drawBackdrop(time) {
    const cam = this.v.cam;
    const F = this.v.F;
    const horizon = CY + F * Math.tan(clamp(cam.pitch, -1.3, 1.3));
    this.skyGrad.setPosition(-20, horizon + 2).setDisplaySize(VIEW_W + 40, F * 2.4);
    let left = CX - cam.yaw * F - PANO_W / 2;
    left = ((left % PANO_W) + PANO_W) % PANO_W - PANO_W;
    this.far.forEach((img, i) => img.setPosition(left + i * PANO_W, horizon + 40 * 1));
    this.water.forEach((img, i) => img.setPosition(left + i * PANO_W, horizon - 2));
    // Stars.
    const g = this.stars;
    g.clear();
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
    const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const hole = this.hole.img.visible ? { x: this.hole.img.x, y: this.hole.img.y, r: this.hole.img.displayHeight * 0.33 } : null;
    for (const s of this.starDirs) {
      const ce = Math.cos(s.el);
      const dx = Math.sin(s.az) * ce, dy = Math.sin(s.el), dz = Math.cos(s.az) * ce;
      const x1 = dx * cy - dz * sy;
      const z1 = dx * sy + dz * cy;
      const y2 = dy * cp - z1 * sp;
      const z2 = dy * sp + z1 * cp;
      if (z2 < 0.05) continue;
      const sx = CX + (x1 / z2) * F;
      const sy2 = CY - (y2 / z2) * F;
      if (sx < 0 || sx > VIEW_W || sy2 < 0 || sy2 > VIEW_H) continue;
      if (hole && Math.hypot(sx - hole.x, sy2 - hole.y) < hole.r) continue;
      const tw = 0.75 + 0.25 * Math.sin(time / 700 + s.tw);
      g.fillStyle(0xe8e2ff, s.b * tw);
      g.fillRect(sx, sy2, s.s, s.s);
    }
  }

  updateHands(dt, t) {
    const pitchDrop = this.v.cam.pitch * 520;
    const bob = Math.sin(t * 6.1) * 2 * (this.speed / CRUISE);
    const want = this.handsMode;
    const tgtCab = want === 'cab' ? 0 : 1;
    const tgtPunch = want === 'punch' ? 0 : 1;
    this.handsOff = lerp(this.handsOff ?? 0, tgtCab, 1 - Math.exp(-dt * 4));
    this.punchOff = lerp(this.punchOff ?? 1, tgtPunch, 1 - Math.exp(-dt * 4));
    // The controller is part of the tram: it leaves the frame when she turns.
    const turned = Math.abs(Math.atan2(Math.sin(this.v.cam.yaw), Math.cos(this.v.cam.yaw)));
    const cabX = CX + 40 - this.v.cam.yaw * 820;
    this.hands.setPosition(cabX, VIEW_H + 30 + Math.max(0, pitchDrop) + bob + this.handsOff * 500).setVisible(this.handsOff < 0.98 && turned < 1.3 && this.v.cam.z > 0);
    this.punchHand.setPosition(VIEW_W - 170, VIEW_H + 40 + Math.max(-60, pitchDrop * 0.5) + this.punchOff * 480 + Math.sin(t * 1.3) * 3).setVisible(this.punchOff < 0.98);
  }

  // Which passenger is being looked at.
  updateTarget() {
    if (this.phase !== 'tickets' || this.busy || ui.dialogue.active) {
      if (this.target) { this.target = null; ui.hidePrompt(); }
      return;
    }
    const fresh = this.time.now - this.pointer.at < 2500 && input.lastDevice !== 'touch';
    const ax = fresh ? this.pointer.x : CX;
    const ay = fresh ? this.pointer.y : CY;
    // Nearest to the aim on screen, with a bias toward whoever is closest in
    // the carriage: far seats crowd the middle of the view.
    let best = null;
    let bestD = 1e9;
    for (const s of this.spots) {
      const p = this.v.project(s.at[0], s.at[1], s.at[2], false);
      if (!p) continue;
      const d = Math.hypot(p.x - ax, p.y - ay);
      if (d > 200) continue;
      const score = d + p.z * 22;
      if (score < bestD) { bestD = score; best = { s, p }; }
    }
    if (AUTOPLAY) {
      // Unattended playtests: take the next passenger in order.
      const next = this.spots.find((s) => s.need && !s.visits);
      if (next && !this.autoBusy) {
        this.autoBusy = true;
        this.time.delayedCall(900, () => { this.autoBusy = false; if (this.phase === 'tickets' && !this.busy) this.visit(next); });
      }
    }
    if (!best) {
      if (this.target) { this.target = null; ui.hidePrompt(); }
      return;
    }
    const label = TRAM.people[best.s.id].label;
    if (this.target !== best.s) {
      this.target = best.s;
      ui.showPrompt(best.s.visits ? 'Talk' : label, best.p.x, best.p.y - 70, input.keyName('action'));
    } else {
      ui.movePrompt(best.p.x, best.p.y - 70);
    }
  }
}
