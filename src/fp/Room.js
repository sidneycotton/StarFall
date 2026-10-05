import Phaser from 'phaser';
import { VIEW_W, VIEW_H } from '../config.js';
import { ui } from '../ui/UI.js';
import { input } from '../systems/Input.js';
import { settings } from '../core/Settings.js';
import * as sfx from '../audio/sfx.js';
import { ScreenFX } from '../fx/ScreenFX.js';
import { View3D } from './View3D.js';
import { Stillness } from '../systems/Stillness.js';

// A first-person room for Chapter Three: Wallflower on their own two feet.
// Look with the mouse (or drag, or the right stick), walk with W/S or the
// arrows (or the left stick, or the walk buttons), turn with A/D.
//
// Rooms are boxes of flat polygons lit by a handful of point lights, so a
// light can go out and take its share of the room with it. People are
// billboards, tinted by the light where they stand.
//
// Units are metres, y is up, yaw 0 looks along +z.

export const CX = VIEW_W / 2;
export const CY = VIEW_H / 2;
export const AUTOPLAY = new URLSearchParams(window.location.search).has('autoplay');
export const EYE = 1.6;
const R = 0.3;              // body radius
const WALK = 1.55;          // m/s
const TURN = 1.6;           // rad/s from keys

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => t * t * (3 - 2 * t);
export const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
export function angleLerp(a, b, t) {
  return a + wrap(b - a) * t;
}

// Colour × light, per channel (light as [r, g, b] multipliers).
export function litInt(c, [lr, lg, lb]) {
  const r = clamp(Math.round(((c >> 16) & 255) * lr), 0, 255);
  const g = clamp(Math.round(((c >> 8) & 255) * lg), 0, 255);
  const b = clamp(Math.round((c & 255) * lb), 0, 255);
  return (r << 16) | (g << 8) | b;
}

const rgbOf = (c) => [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];

export class Room extends Phaser.Scene {
  // --- setup ------------------------------------------------------------------
  setupRoom({ start = { x: 0, z: 0, yaw: 0, pitch: 0 }, bg = '#030206', fog = 0x050308, fogDist = 18, fx = {}, ambient = 0.18 } = {}) {
    this.tweens.timeScale = 1;
    this.time.timeScale = 1;
    this.cameras.main.setBackgroundColor(bg);
    this.fx = new ScreenFX(this);
    this.fx.set({ fade: 1, grain: 0.08, vignette: 0.8, aberration: 0.4, desat: 0.05, exposure: 1, ...fx });
    this.v = new View3D(this, { focal: 820 });
    this.v.setFog('outside', fog, fogDist);
    this.v.setFog('inside', fog, fogDist);
    this.fogColor = fog;
    this.pos = { x: start.x, z: start.z };
    this.base = { yaw: start.yaw || 0, pitch: start.pitch || 0 };
    this.soft = { yaw: 0, pitch: 0, tx: 0, ty: 0 };
    this.eye = EYE;
    this.bob = 0;
    this.stride = 0;
    this.speed = 0;
    this.free = false;      // the player has the head
    this.canWalk = false;   // ...and the feet
    this.walkSpeed = WALK;
    this.blocks = [];
    this.bounds = null;
    this.spots = [];
    this.target = null;
    this.lights = [];
    this.ambient = ambient;
    this.lit = [];          // polygons that take light
    this.litBoards = [];    // billboards that take light
    this.lightDirty = true;
    this.pointer = { x: CX, y: CY, at: -1e9 };
    this.mouseHeld = false;
    this.scripted = null;
    this.stepKind = 'soft';
    this.still = new Stillness(this, { fx: this.fx });
    this.lastLook = { yaw: this.base.yaw, pitch: this.base.pitch };
    input.fpMode = true;
    input.keys.delete('fwd');
    input.keys.delete('back');
    this.bindRoomInput();
    this.events.once('shutdown', () => this.teardownRoom());
  }

  bindRoomInput() {
    this.drag = null;
    this.input.on('pointermove', (p) => {
      if (p.wasTouch) {
        if (this.drag && this.free) {
          const dx = p.x - this.drag.x;
          const dy = p.y - this.drag.y;
          if (Math.abs(dx) + Math.abs(dy) > 6) this.drag.moved = true;
          this.base.yaw -= dx * 0.0034;
          this.base.pitch = clamp(this.base.pitch + dy * 0.0034, -0.9, 0.9);
          this.drag.x = p.x; this.drag.y = p.y;
        }
        return;
      }
      this.pointer = { x: p.x, y: p.y, at: this.time.now };
    });
    this.input.on('pointerdown', (p) => {
      if (ui.dialogue.active && !this.walkTalk) return;
      if (p.wasTouch) { this.drag = { x: p.x, y: p.y, moved: false, at: this.time.now }; return; }
      this.pointer = { x: p.x, y: p.y, at: this.time.now };
      this.mouseHeld = true;
      this.onAction();
    });
    this.input.on('pointerup', (p) => {
      this.mouseHeld = false;
      if (p.wasTouch && this.drag && !this.drag.moved && (this.walkTalk || !ui.dialogue.active)) this.onAction();
      this.drag = null;
    });
    this.releaseAction = input.pushActionHandler(() => this.onAction());
    ui.onPromptTap = () => this.onAction();
  }

  teardownRoom() {
    this.releaseAction?.();
    input.fpMode = false;
    input.keys.delete('fwd');
    input.keys.delete('back');
    ui.onPromptTap = null;
    ui.hidePrompt();
    ui.hint('');
    ui.touch.setWalk(false);
    ui.touch.setAction(false);
    ui.touch.setDodge(false);
  }

  // The player's hands on the controls (or not).
  setFree(look, walk = look) {
    this.free = look;
    this.canWalk = walk;
    ui.touch.setWalk(walk);
  }

  // --- geometry -----------------------------------------------------------------
  // A polygon that takes light. `shade` is its own brightness (faces turned
  // from the lamps are darker).
  face(points, { fill = 0x2a2630, shade = 1, ground = false, group, alpha = 1, lit = true, stroke, strokeAlpha, lineWidth, layer = 'outside', fog = true } = {}) {
    const p = this.v.poly(points, { fill, alpha, ground, group, stroke, strokeAlpha, lineWidth, layer, fog });
    p.base = fill;
    p.shade = shade;
    if (lit) {
      const n = points.length;
      p.c = [0, 1, 2].map((k) => points.reduce((s, q) => s + q[k], 0) / n);
      this.lit.push(p);
    }
    return p;
  }

  // A floor of tiles (alternating a and b), as ground.
  floor(x0, x1, z0, z1, { y = 0, step = 1, a = 0x1e1a20, b = 0x1a161c } = {}) {
    for (let x = x0; x < x1 - 1e-6; x += step) {
      for (let z = z0; z < z1 - 1e-6; z += step) {
        const xa = Math.min(x + step, x1);
        const za = Math.min(z + step, z1);
        const odd = (Math.round((x - x0) / step) + Math.round((z - z0) / step)) % 2;
        this.face([[x, y, z], [xa, y, z], [xa, y, za], [x, y, za]], { fill: odd ? a : b, ground: true });
      }
    }
  }

  ceiling(x0, x1, z0, z1, y, fill = 0x141018, step = 2) {
    for (let x = x0; x < x1 - 1e-6; x += step) {
      for (let z = z0; z < z1 - 1e-6; z += step) {
        const xa = Math.min(x + step, x1);
        const za = Math.min(z + step, z1);
        this.face([[x, y, z], [x, y, za], [xa, y, za], [xa, y, z]], { fill, shade: 0.7 });
      }
    }
  }

  // A wall across x at depth z (facing the room), split into panels so the
  // light falls across it, with an optional dado line.
  wallZ(z, x0, x1, y0, y1, { fill = 0x2a2430, step = 1, shade = 1, dado = 0, dadoFill } = {}) {
    for (let x = x0; x < x1 - 1e-6; x += step) {
      const xa = Math.min(x + step, x1);
      if (dado) {
        this.face([[x, y0, z], [xa, y0, z], [xa, dado, z], [x, dado, z]], { fill: dadoFill ?? litInt(fill, [0.8, 0.8, 0.8]), shade });
        this.face([[x, dado, z], [xa, dado, z], [xa, y1, z], [x, y1, z]], { fill, shade });
      } else {
        this.face([[x, y0, z], [xa, y0, z], [xa, y1, z], [x, y1, z]], { fill, shade });
      }
    }
  }

  wallX(x, z0, z1, y0, y1, opts = {}) {
    const { fill = 0x2a2430, step = 1, shade = 0.85, dado = 0, dadoFill } = opts;
    for (let z = z0; z < z1 - 1e-6; z += step) {
      const za = Math.min(z + step, z1);
      if (dado) {
        this.face([[x, y0, z], [x, y0, za], [x, dado, za], [x, dado, z]], { fill: dadoFill ?? litInt(fill, [0.8, 0.8, 0.8]), shade });
        this.face([[x, dado, z], [x, dado, za], [x, y1, za], [x, y1, z]], { fill, shade });
      } else {
        this.face([[x, y0, z], [x, y0, za], [x, y1, za], [x, y1, z]], { fill, shade });
      }
    }
  }

  // A solid box (counter, crate, boiler...) that sorts with the people.
  box(x0, x1, y0, y1, z0, z1, { fill = 0x3a3036, top, solid = true, faces = 'all' } = {}) {
    const g = this.v.group([(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], { world: false, layer: 'outside' });
    const f = (pts, shade, col = fill) => this.face(pts, { fill: col, shade, group: g });
    f([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], 1.15, top ?? fill);
    f([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], 0.9);
    f([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], 0.75);
    f([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], 0.8);
    f([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], 0.7);
    if (solid) this.blocks.push({ x0, x1, z0, z1 });
    g.faces = faces;
    return g;
  }

  // A person, a thing: a painted cut-out at (x, z) that takes the light.
  figure(key, { x = 0, y = 0, z = 0, h = 1.75, anchor = 1, lit = true, alpha = 1, flip = false, layer = 'outside' } = {}) {
    const b = this.v.board(key, { x, y, z, h, anchor, alpha, flip, layer, world: false });
    if (lit) this.litBoards.push(b);
    return b;
  }

  // --- light -----------------------------------------------------------------
  // A point light. `color` tints what it touches; `on` dims it (0..1).
  light({ x, y, z, power = 1, radius = 6, color = 0xfff0dc, on = 1 }) {
    const l = { x, y, z, power, radius, color, rgb: rgbOf(color), on };
    this.lights.push(l);
    this.lightDirty = true;
    return l;
  }

  setLight(l, values) {
    Object.assign(l, values);
    if (values.color !== undefined) l.rgb = rgbOf(values.color);
    this.lightDirty = true;
  }

  lightAt(x, y, z) {
    const a = this.ambient;
    const out = Array.isArray(a) ? [...a] : [a, a, a * 1.1];
    for (const l of this.lights) {
      if (l.on <= 0) continue;
      const d = Math.hypot(x - l.x, (y - l.y) * 0.8, z - l.z);
      const f = l.on * l.power / (1 + (d / l.radius) * (d / l.radius) * 3);
      out[0] += f * l.rgb[0];
      out[1] += f * l.rgb[1];
      out[2] += f * l.rgb[2];
    }
    return out.map((v) => Math.min(v, 1.6));
  }

  relight() {
    for (const p of this.lit) {
      const L = this.lightAt(p.c[0], p.c[1], p.c[2]);
      p.fill = litInt(p.base, [L[0] * p.shade, L[1] * p.shade, L[2] * p.shade]);
    }
    this.lightDirty = false;
  }

  lightBoards() {
    for (const b of this.litBoards) {
      if (!b.visible) continue;
      const L = this.lightAt(b.x, b.y + b.h * 0.6, b.z);
      b.tint = litInt(0xffffff, L.map((v) => Math.min(1, 0.1 + v * 0.95)));
    }
  }

  // --- interactions --------------------------------------------------------------
  // Something to look at and use. `reach` is how near you must stand;
  // `hold` (seconds) makes it something you do with your whole body, slowly.
  spot({ id, x, y = 1, z, label, reach = 1.6, hold = 0, use, when }) {
    const s = { id, x, y, z, label, reach, hold, use, when, progress: 0, on: true };
    this.spots.push(s);
    return s;
  }

  removeSpot(s) {
    this.spots = this.spots.filter((x) => x !== s);
    if (this.target === s) { this.target = null; ui.hidePrompt(); }
  }

  get aim() {
    const fresh = this.time.now - this.pointer.at < 2500 && input.lastDevice === 'keyboard';
    return { x: fresh ? this.pointer.x : CX, y: fresh ? this.pointer.y : CY };
  }

  updateTarget() {
    if (!this.free || (ui.dialogue.active && !this.walkTalk) || this.busy) {
      if (this.target) { this.target = null; ui.hidePrompt(); }
      return;
    }
    const { x: ax, y: ay } = this.aim;
    let best = null;
    let bestD = 1e9;
    for (const s of this.spots) {
      if (!s.on || (s.when && !s.when())) continue;
      if (Math.hypot(s.x - this.pos.x, s.z - this.pos.z) > s.reach) continue;
      const p = this.v.project(s.x, s.y, s.z);
      if (!p) continue;
      const d = Math.hypot(p.x - ax, p.y - ay);
      if (d > 260) continue;
      if (d < bestD) { bestD = d; best = { s, p }; }
    }
    if (!best) {
      if (this.target) { this.target = null; ui.hidePrompt(); }
      return;
    }
    const label = best.s.hold && best.s.progress > 0 ? `${best.s.label} ${this.dots(best.s.progress)}` : best.s.label;
    if (this.target !== best.s || this.targetLabel !== label) {
      this.target = best.s;
      this.targetLabel = label;
      ui.showPrompt(label, best.p.x, best.p.y - 60, best.s.hold ? `Hold ${input.keyName('action')}` : input.keyName('action'));
    } else {
      ui.movePrompt(best.p.x, best.p.y - 60);
    }
  }

  dots(p) {
    const n = 6;
    const k = Math.round(p * n);
    return '●'.repeat(k) + '○'.repeat(n - k);
  }

  get actionHeld() {
    return input.actionHeld || this.mouseHeld;
  }

  onAction() {
    if (this.waitingFor) {
      const fn = this.waitingFor;
      this.waitingFor = null;
      fn();
      return;
    }
    if (ui.dialogue.active || this.busy) return;
    const t = this.target;
    if (t && !t.hold && t.use) t.use(t);
  }

  // Resolves on the next action press (or by itself under ?autoplay).
  awaitAction(autoMs = 1500) {
    return new Promise((resolve) => {
      this.waitingFor = resolve;
      if (AUTOPLAY) this.time.delayedCall(autoMs, () => { if (this.waitingFor === resolve) { this.waitingFor = null; resolve(); } });
    });
  }

  // --- scripted movement -------------------------------------------------------------
  aimFrom(x, z, at) {
    const dx = at.x - x;
    const dz = at.z - z;
    return { yaw: Math.atan2(dx, dz), pitch: Math.atan2((at.y ?? EYE) - this.eye, Math.hypot(dx, dz)) };
  }

  turnTo(yaw, pitch, ms = 1200) {
    const from = { yaw: this.base.yaw, pitch: this.base.pitch };
    return new Promise((resolve) => {
      const s = { t: 0 };
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

  lookAt(at, ms = 1200) {
    const a = this.aimFrom(this.pos.x, this.pos.z, at);
    return this.turnTo(a.yaw, a.pitch, ms);
  }

  // Walk to (x, z) on your own feet, facing the way you go (or `face`).
  walkTo(x, z, { speed = this.walkSpeed, face, through = false } = {}) {
    return new Promise((resolve) => {
      this.scripted = { x, z, speed, face, through, resolve };
    });
  }

  // Walk to (x, z) around whatever is in the way.
  async walkPath(x, z, opts = {}) {
    const pts = this.path(x, z);
    for (let i = 0; i < pts.length; i++) {
      await this.walkTo(pts[i][0], pts[i][1], { ...opts, through: i < pts.length - 1 });
    }
  }

  // Waypoints from here to (x, z) on a 0.25 m grid, avoiding blocks.
  path(tx, tz) {
    const G = 0.25;
    const [x0, z0, x1, z1] = this.bounds || [-20, -20, 20, 20];
    const nx = Math.ceil((x1 - x0) / G);
    const nz = Math.ceil((z1 - z0) / G);
    const free = (i, j) => {
      const x = x0 + (i + 0.5) * G;
      const z = z0 + (j + 0.5) * G;
      if (x < x0 + R || x > x1 - R || z < z0 + R || z > z1 - R) return false;
      return !this.blocks.some((b) => !b.off && Math.hypot(x - clamp(x, b.x0, b.x1), z - clamp(z, b.z0, b.z1)) < R + 0.04);
    };
    const cell = (x, z) => [clamp(Math.floor((x - x0) / G), 0, nx - 1), clamp(Math.floor((z - z0) / G), 0, nz - 1)];
    const [si, sj] = cell(this.pos.x, this.pos.z);
    const [ti, tj] = cell(tx, tz);
    const prev = new Map();
    const key = (i, j) => i * 10000 + j;
    const q = [[si, sj]];
    prev.set(key(si, sj), null);
    let found = false;
    while (q.length) {
      const [i, j] = q.shift();
      if (i === ti && j === tj) { found = true; break; }
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const a = i + di;
        const b = j + dj;
        if (a < 0 || b < 0 || a >= nx || b >= nz || prev.has(key(a, b))) continue;
        if (!free(a, b) || (di && dj && (!free(i + di, j) || !free(i, j + dj)))) continue;
        prev.set(key(a, b), [i, j]);
        q.push([a, b]);
      }
    }
    if (!found) return [[tx, tz]];
    const cells = [];
    for (let c = [ti, tj]; c; c = prev.get(key(c[0], c[1]))) cells.unshift(c);
    // Pull the string tight: skip every waypoint the line of sight allows.
    const at = (c) => [x0 + (c[0] + 0.5) * G, z0 + (c[1] + 0.5) * G];
    const clear = (a, b) => {
      const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.1);
      for (let k = 1; k < n; k++) {
        const [i, j] = cell(lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n));
        if (!free(i, j)) return false;
      }
      return true;
    };
    const pts = [];
    let from = [this.pos.x, this.pos.z];
    let k = 0;
    while (k < cells.length - 1) {
      let far = k + 1;
      for (let m = cells.length - 1; m > k + 1; m--) if (clear(from, at(cells[m]))) { far = m; break; }
      if (far === cells.length - 1) break;
      from = at(cells[far]);
      pts.push(from);
      k = far;
    }
    pts.push([tx, tz]);
    return pts;
  }

  // --- the frame ----------------------------------------------------------------------
  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    const t = time / 1000;
    const before = { x: this.pos.x, z: this.pos.z };

    // Head.
    if (this.free) {
      const ax = input.axis();
      this.base.yaw += ax * TURN * dt;
      const pl = input.padLook;
      this.base.yaw += pl.x * 2.2 * dt;
      this.base.pitch = clamp(this.base.pitch - pl.y * 1.6 * dt, -0.9, 0.9);
      const fresh = time - this.pointer.at < 4000 && input.lastDevice === 'keyboard';
      const nx = fresh ? this.pointer.x / VIEW_W - 0.5 : 0;
      const ny = fresh ? this.pointer.y / VIEW_H - 0.5 : 0;
      this.soft.tx = nx * 0.9;
      this.soft.ty = -ny * 0.6;
      if (Math.abs(nx) > 0.38) this.base.yaw += Math.sign(nx) * (Math.abs(nx) - 0.38) * 7 * dt;
    } else {
      this.soft.tx = 0;
      this.soft.ty = 0;
    }
    const k = 1 - Math.exp(-dt * 6);
    this.soft.yaw = lerp(this.soft.yaw, this.soft.tx, k);
    this.soft.pitch = lerp(this.soft.pitch, this.soft.ty, k);
    const yaw = this.base.yaw + this.soft.yaw;
    const pitch = clamp(this.base.pitch + this.soft.pitch, -0.95, 1.0);

    // Feet.
    let want = 0;
    let dir = yaw;
    if (this.scripted) {
      const s = this.scripted;
      const dx = s.x - this.pos.x;
      const dz = s.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < (s.through ? 0.2 : 0.05)) {
        this.scripted = null;
        if (!s.through) this.speed = 0;
        s.resolve();
      } else {
        dir = Math.atan2(dx, dz);
        want = s.through ? s.speed : Math.min(s.speed, d * 3);
        const faceYaw = s.face !== undefined ? s.face : dir;
        this.base.yaw = angleLerp(this.base.yaw, faceYaw, 1 - Math.exp(-dt * 3));
      }
    } else if (this.canWalk && (this.walkTalk || !ui.dialogue.active)) {
      want = input.forward() * this.walkSpeed;
      if (want < 0) want *= 0.6;
    }
    this.speed = lerp(this.speed, want, 1 - Math.exp(-dt * 8));
    if (Math.abs(this.speed) > 0.01) {
      this.pos.x += Math.sin(dir) * this.speed * dt;
      this.pos.z += Math.cos(dir) * this.speed * dt;
      this.collide();
    }
    const walked = Math.hypot(this.pos.x - before.x, this.pos.z - before.z);
    this.stride += walked;
    if (this.stride > 0.72) {
      this.stride -= 0.72;
      sfx.footstep({ kind: this.stepKind, gain: 0.6 });
    }
    const moving = Math.min(1, Math.abs(this.speed) / WALK);
    this.bob += walked * 8.6;
    const bobK = settings.get('reduceMotion') ? 0.3 : 1;

    const cam = this.v.cam;
    cam.x = this.pos.x;
    cam.z = this.pos.z;
    cam.yaw = yaw;
    cam.pitch = pitch;
    cam.y = this.eye + Math.sin(this.bob) * 0.022 * moving * bobK + Math.sin(t * 1.1) * 0.004;
    cam.roll = Math.sin(this.bob * 0.5) * 0.004 * moving * bobK;

    // Stillness: how much did the body do?
    const turned = Math.abs(wrap(yaw - this.lastLook.yaw)) + Math.abs(pitch - this.lastLook.pitch) * 0.7;
    this.lastLook = { yaw, pitch };
    const held = this.actionHeld && this.target?.hold;
    this.still.update(dt, { walked, turned: this.scripted ? 0 : turned, held });

    this.tick?.(dt, t);
    if (this.lightDirty) this.relight();
    this.lightBoards();
    this.v.render();
    this.updateTarget();
    this.updateHold(dt);
    this.drawOver?.(dt, t);
  }

  updateHold(dt) {
    const s = this.target;
    if (!s || !s.hold) return;
    if (this.actionHeld && (this.walkTalk || !ui.dialogue.active) && !this.busy) {
      s.progress = Math.min(1, s.progress + dt / s.hold);
      if (s.progress >= 1) {
        s.on = false;
        this.target = null;
        ui.hidePrompt();
        s.use?.(s);
      }
    }
  }

  collide() {
    const p = this.pos;
    if (this.bounds) {
      const [x0, z0, x1, z1] = this.bounds;
      p.x = clamp(p.x, x0 + R, x1 - R);
      p.z = clamp(p.z, z0 + R, z1 - R);
    }
    for (const b of this.blocks) {
      if (b.off) continue;
      const nx = clamp(p.x, b.x0, b.x1);
      const nz = clamp(p.z, b.z0, b.z1);
      const dx = p.x - nx;
      const dz = p.z - nz;
      const d = Math.hypot(dx, dz);
      if (d < R) {
        if (d > 1e-5) {
          p.x = nx + (dx / d) * R;
          p.z = nz + (dz / d) * R;
        } else {
          // Inside: push out the shortest way.
          const opts = [[b.x0 - R - p.x, 0], [b.x1 + R - p.x, 0], [0, b.z0 - R - p.z], [0, b.z1 + R - p.z]];
          opts.sort((a, c) => Math.abs(a[0] + a[1]) - Math.abs(c[0] + c[1]));
          p.x += opts[0][0];
          p.z += opts[0][1];
        }
      }
    }
  }
}
