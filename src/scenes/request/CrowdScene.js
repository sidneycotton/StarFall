import { Room, AUTOPLAY, lerp } from '../../fp/Room.js';
import { ui } from '../../ui/UI.js';
import { narrative } from '../../core/NarrativeState.js';
import { settings } from '../../core/Settings.js';
import { input } from '../../systems/Input.js';
import { wait } from '../../systems/Cutscene.js';
import * as sfx from '../../audio/sfx.js';
import { sound } from '../../audio/soundscape.js';
import { paintTexture, rng } from '../../art/paint.js';
import { CROWD_COUNT } from '../../art/five.js';
import { REQUEST } from '../../data/request.js';
import { person, show } from './people.js';
import { nextPart } from './parts.js';

// 3.1 — Vesper Plaza, the seventh anniversary, from the back of the crowd.
// Wallflower is the one everyone steps on. Stand still and the crowd goes
// round you. Then the ground moves, and four strangers do impossible things
// in four corners of the square, and only one person sees all of it.

const C = REQUEST.crowd;
const CC = REQUEST.cc;
const SCREEN_Z = 25;
// Where the four of them are when it happens.
const EV = {
  paperweight: { x: -7.2, z: 8.5 },
  lukewarm: { x: 6.8, z: 7 },
  dowser: { x: 3.4, z: 15 },
  humdrum: { x: -4.6, z: 17.6 },
};
const CHILD = { x: 1.1, z: 3.6 };

export class CrowdScene extends Room {
  constructor() {
    super('Crowd');
  }

  create() {
    narrative.setStage('crowd');
    ui.letterbox(false);
    this.setupRoom({
      start: { x: 0, z: 0.4, yaw: 0, pitch: 0.02 },
      fog: 0x07060c, fogDist: 34, ambient: 0.22,
      fx: { grain: 0.07, vignette: 0.7, aberration: 0.3, desat: 0.05 },
    });
    this.walkTalk = true;
    this.reduce = settings.get('reduceMotion');
    this.paintScreens();
    this.build();
    this.buildCrowd();
    this.events.once('shutdown', () => {
      if (window.__crowd === this) delete window.__crowd;
      sound.vigil.stop(1);
      sound.sirens.stop(1);
      ui.hint('');
    });
    window.__crowd = this;
    this.run().then(() => this.finish());
  }

  paintScreens() {
    const frame = (ctx, w, h) => {
      ctx.fillStyle = '#0a0a10'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#16161e'; ctx.fillRect(14, 14, w - 28, h - 28);
    };
    paintTexture(this, 'cr_scr_vigil', 960, 540, (ctx, w, h) => {
      frame(ctx, w, h);
      const g = ctx.createLinearGradient(0, 14, 0, h - 14);
      g.addColorStop(0, '#1a1830'); g.addColorStop(1, '#3a2a40');
      ctx.fillStyle = g; ctx.fillRect(14, 14, w - 28, h - 28);
      // Candles, and the number of years.
      const R = rng(7);
      for (let i = 0; i < 60; i++) {
        const x = 40 + R() * (w - 80);
        const y = h * 0.62 + R() * h * 0.28;
        ctx.fillStyle = `rgba(255,${190 + R() * 50 | 0},120,${0.4 + R() * 0.5})`;
        ctx.beginPath(); ctx.arc(x, y, 2 + R() * 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#e8e0f0'; ctx.textAlign = 'center';
      ctx.font = '300 92px Jost, sans-serif'; ctx.fillText('VII', w / 2, h * 0.42);
      ctx.font = '300 28px Jost, sans-serif'; ctx.fillText('S T A R F A L L   ·   W E   R E M E M B E R', w / 2, h * 0.53);
    });
    paintTexture(this, 'cr_scr_static', 960, 540, (ctx, w, h) => {
      frame(ctx, w, h);
      const R = rng(3);
      for (let y = 14; y < h - 14; y += 4) {
        for (let x = 14; x < w - 14; x += 6) {
          const v = R() * 120 | 0;
          ctx.fillStyle = `rgb(${v},${v},${v + 10})`; ctx.fillRect(x, y, 6, 4);
        }
      }
    });
    paintTexture(this, 'cr_scr_event', 960, 540, (ctx, w, h) => {
      frame(ctx, w, h);
      ctx.fillStyle = '#e8eef0'; ctx.fillRect(14, 14, w - 28, h - 28);
      ctx.fillStyle = '#101418'; ctx.textAlign = 'center';
      ctx.font = '500 46px Jost, sans-serif';
      const words = C.screen.split(' ');
      ctx.fillText(words.slice(0, 2).join(' '), w / 2, h * 0.46);
      ctx.fillText(words.slice(2).join(' '), w / 2, h * 0.58);
    });
  }

  build() {
    this.floor(-12, 12, -2, 28, { step: 2, a: 0x2a2830, b: 0x26242c });
    // The civic block, its screen, and the statue above it.
    this.wallZ(28, -14, 14, 0, 14, { fill: 0x1a1820, step: 3.5 });
    this.wallX(-12, -2, 28, 0, 9, { fill: 0x1e1c24, step: 3 });
    this.wallX(12, -2, 28, 0, 9, { fill: 0x1e1c24, step: 3, shade: 0.7 });
    const st = (pts) => this.v.poly(pts.map(([x, y]) => [x, y, 27.6]), { fill: 0x1c1a26, layer: 'outside' });
    st([[-3, 0], [3, 0], [3, 3], [-3, 3]]);
    st([[-1.6, 3], [1.6, 3], [1.1, 9], [0.8, 12.5], [-0.8, 12.5], [-1.1, 9]]);
    st([[-0.6, 12.4], [0.6, 12.4], [0.55, 13.6], [0, 14.1], [-0.55, 13.6]]);
    st([[0.7, 11.6], [1.0, 11.8], [2.6, 15.4], [2.3, 15.6]]);
    this.screen = this.figure('cr_scr_vigil', { x: 0, y: 3.4, z: SCREEN_Z, h: 5.6, lit: false });
    this.screenLight = this.light({ x: 0, y: 5, z: SCREEN_Z - 2, power: 1.3, radius: 22, color: 0x9a90d0 });
    // Plaza lamps.
    this.lamps = [[-8.5, 4], [8.5, 4], [-8.5, 14], [8.5, 14]].map(([x, z]) => {
      this.box(x - 0.07, x + 0.07, 0, 4.2, z - 0.07, z + 0.07, { fill: 0x2a2a30, solid: false });
      this.face([[x - 0.25, 4.2, z], [x + 0.25, 4.2, z], [x + 0.15, 4.45, z], [x - 0.15, 4.45, z]], { fill: 0xf0d8a0, lit: false });
      return this.light({ x, y: 4.2, z, power: 1.0, radius: 9, color: 0xffd8a0 });
    });

    // Paperweight's corner: a lamp post, a pram.
    const P = EV.paperweight;
    this.post = { x: P.x - 1.4, z: P.z + 0.6, a: 0 };
    this.postPoly = this.face(this.postPts(), { fill: 0x3a3a44 });
    this.postHead = this.face(this.postHeadPts(), { fill: 0xf0d8a0, lit: false });
    this.box(P.x + 0.2, P.x + 1.0, 0.25, 0.75, P.z + 0.3, P.z + 0.9, { fill: 0x4a3a5a, top: 0x5a4a6a, solid: false });
    [[P.x + 0.3, P.z + 0.35], [P.x + 0.9, P.z + 0.85]].forEach(([x, z]) => this.box(x - 0.08, x + 0.08, 0, 0.25, z - 0.02, z + 0.02, { fill: 0x18161c, solid: false }));

    // Lukewarm's corner: the steam main, a grate in the paving.
    const L = EV.lukewarm;
    this.box(L.x - 2, L.x + 2, 0, 0.35, L.z + 0.8, L.z + 1.15, { fill: 0x4a4a50, top: 0x5a5a60, solid: false });
    this.steam = Array.from({ length: 12 }, (_, i) => ({ t: i / 12, p: this.v.poly([[0, 0, 0], [0, 0, 0], [0, 0, 0]], { fill: 0xe8e8e8, alpha: 0 }) }));
    this.steamOn = 0;
    this.steamCold = 0;

    // Dowser's corner: a culvert grate in the middle of the square.
    const D = EV.dowser;
    this.culvert = { x: D.x - 4, z: D.z + 1.5 };
    this.face([[this.culvert.x - 0.6, 0.01, this.culvert.z - 0.3], [this.culvert.x + 0.6, 0.01, this.culvert.z - 0.3], [this.culvert.x + 0.6, 0.01, this.culvert.z + 0.3], [this.culvert.x - 0.6, 0.01, this.culvert.z + 0.3]], { fill: 0x141418, ground: true });
    this.water = Array.from({ length: 5 }, () => this.v.poly([[0, 0, 0], [0, 0, 0], [0, 0, 0]], { fill: 0x7a9ab8, alpha: 0 }));
    this.waterOn = 0;

    // Humdrum's corner: a hoarding round the plinth works.
    const H = EV.humdrum;
    this.hoard = { x0: H.x - 1.6, x1: H.x + 1.6, z: H.z + 0.45, shake: 0 };
    this.hoardPoly = this.face(this.hoardPts(), { fill: 0x5a4a3a });
    this.hoardBand = this.face(this.hoardPts(1.2, 1.5), { fill: 0xc8a040, shade: 1.1 });

    this.bounds = [-11, -1.5, 11, 22];
  }

  postPts() {
    const { x, z, a } = this.post;
    const L = 4.4;
    const tx = x + Math.sin(a) * L;
    const ty = Math.cos(a) * L;
    const nx = Math.cos(a) * 0.08;
    const ny = -Math.sin(a) * 0.08;
    return [[x - 0.08, 0, z], [x + 0.08, 0, z], [tx + nx, ty + ny, z], [tx - nx, ty - ny, z]];
  }

  postHeadPts() {
    const { x, z, a } = this.post;
    const tx = x + Math.sin(a) * 4.4;
    const ty = Math.cos(a) * 4.4;
    return [[tx - 0.25, ty, z], [tx + 0.25, ty, z], [tx + 0.15, ty + 0.25, z], [tx - 0.15, ty + 0.25, z]];
  }

  hoardPts(y0 = 0, y1 = 2.8) {
    const { x0, x1, z, shake } = this.hoard;
    const t = this.time?.now ?? 0;
    const dx = Math.sin(t * 0.06) * 0.06 * shake;
    const dy = Math.sin(t * 0.045) * 0.03 * shake;
    return [[x0, y0, z], [x1, y0, z], [x1 + dx, y1 + dy, z], [x0 + dx, y1 - dy, z]];
  }

  buildCrowd() {
    const R = rng(11);
    this.crowd = [];
    const clear = (x, z) => Object.values(EV).some((e) => Math.hypot(e.x - x, e.z - z) < 2.2) || Math.hypot(CHILD.x - x, CHILD.z - z) < 1.2 || (Math.abs(x) < 1.2 && z < 2.2);
    for (let z = 1.6; z < 17; z += 1.25) {
      for (let x = -9.6; x < 9.8; x += 1.15) {
        const px = x + (R() - 0.5) * 0.7;
        const pz = z + (R() - 0.5) * 0.6;
        if (clear(px, pz) || R() < 0.3) continue;
        const k = `f_crowd${(R() * CROWD_COUNT) | 0}`;
        const p = person(this, 'crowd', px, pz, { key: k, h: 1.62 + R() * 0.24 });
        show(this, p, `${k}_back`);
        p.home = { x: px, z: pz };
        p.ph = R() * 10;
        p.vx = 0; p.vz = 0;
        this.crowd.push(p);
      }
    }
    // The child, somewhere in it; and the four.
    this.child = person(this, 'child', CHILD.x, CHILD.z, { key: 'f_child' });
    show(this, this.child, 'f_child_back');
    this.four = {
      paperweight: person(this, 'paperweight', EV.paperweight.x, EV.paperweight.z),
      lukewarm: person(this, 'lukewarm', EV.lukewarm.x, EV.lukewarm.z),
      dowser: person(this, 'dowser', EV.dowser.x, EV.dowser.z),
      humdrum: person(this, 'humdrum', EV.humdrum.x, EV.humdrum.z),
    };
    for (const p of Object.values(this.four)) show(this, p, `${p.key}_back`);
    this.mode = 'vigil';
  }

  tick(dt, t) {
    const me = this.pos;
    const still = this.still.value;
    for (const p of this.crowd) {
      if (!p.b.visible) continue;
      if (this.mode === 'surge') {
        p.x += p.vx * dt; p.z += p.vz * dt;
        if (p.z < -2.5 || Math.abs(p.x) > 12) p.b.visible = false;
      } else {
        // A little sway; and, if you are still enough, room around you.
        let tx = p.home.x + Math.sin(t / 1000 * 0.4 + p.ph) * 0.06;
        let tz = p.home.z;
        const dx = p.home.x - me.x;
        const dz = p.home.z - me.z;
        const d = Math.hypot(dx, dz);
        const want = 0.6 + still * 1.4;
        if (d < want && d > 0.01) {
          tx = me.x + (dx / d) * want;
          tz = me.z + (dz / d) * want;
        }
        const k = Math.min(1, dt * 2.2);
        p.x = lerp(p.x, tx, k); p.z = lerp(p.z, tz, k);
      }
      p.b.x = p.x; p.b.z = p.z;
    }
    // The things that happen in the corners.
    this.postPoly.points = this.postPts();
    this.postHead.points = this.postHeadPts();
    if (this.hoard.shake > 0) {
      this.hoardPoly.points = this.hoardPts();
      this.hoardBand.points = this.hoardPts(1.2, 1.5);
    }
    this.tickSteam(dt);
    this.tickWater(t);
  }

  tickSteam(dt) {
    const L = EV.lukewarm;
    const cold = this.steamCold;
    for (const s of this.steam) {
      s.t = (s.t + dt * (0.5 - cold * 0.38)) % 1;
      const x = L.x - 0.6 + Math.sin(s.t * 9 + s.t * 3) * 0.2 * (1 + s.t);
      const y = 0.35 + s.t * (3.2 - cold * 2.4);
      const z = L.z + 0.95;
      const r = 0.15 + s.t * (0.9 - cold * 0.4);
      s.p.points = [[x - r, y, z], [x, y + r, z], [x + r, y, z], [x, y - r, z]];
      s.p.fill = cold > 0.5 ? 0xb8d0e8 : 0xe0e0e0;
      s.p.alpha = this.steamOn * (1 - s.t) * 0.55;
    }
  }

  tickWater(t) {
    const { x, z } = this.culvert;
    this.water.forEach((p, i) => {
      const h = this.waterOn * (1.6 + Math.sin(t * 0.012 + i * 1.7) * 0.4) * (1 - Math.abs(i - 2) * 0.18);
      const w0 = -0.5 + i * 0.22;
      p.points = [[x + w0, 0, z], [x + w0 + 0.24, 0, z], [x + w0 + 0.18 + Math.sin(t * 0.01 + i) * 0.05, h, z], [x + w0 + 0.06, h * 0.92, z]];
      p.alpha = this.waterOn * 0.7;
    });
  }

  async run() {
    sound.vigil.start({ fadeIn: 3, gain: 0.8 });
    await ui.chapterCard(REQUEST.title.chapter, REQUEST.title.sub, 4200);
    await ui.chapterCard(C.place, '', 2600);
    await this.fx.fadeTo(0, 2400);
    this.setFree(true, false);
    await wait(this, 1200);
    sfx.glassClink({ pitch: 0.7, gain: 0.08 });
    ui.caption(CC.cup, 2600);
    await ui.dialogue.play(C.open.slice(0, 1));
    // Somebody walks into them.
    await this.jostle();
    await ui.dialogue.play(C.open.slice(1));

    // The lesson.
    await this.stillness();
    await ui.dialogue.play(C.stillLearned);
    await wait(this, 1800);

    // The ground moves.
    await this.quake();
    await this.rescue();
    await this.witness();
    await this.screenOut();
  }

  async jostle() {
    const p = this.crowd.reduce((a, b) => (Math.abs(b.home.z - 2) + Math.abs(b.home.x - 1.5) < Math.abs(a.home.z - 2) + Math.abs(a.home.x - 1.5) ? b : a));
    const was = p.home;
    p.home = { x: this.pos.x - 0.7, z: this.pos.z + 0.35 };
    show(this, p, p.key);
    await wait(this, 900);
    sfx.cloth({ gain: 0.12 });
    if (!this.reduce) this.cameras.main.shake(140, 0.004);
    this.base.yaw += 0.04;
    await wait(this, 700);
    p.home = was;
    show(this, p, `${p.key}_back`);
  }

  // Let go of everything. They go round.
  stillness() {
    const touch = input.lastDevice === 'touch';
    this.setFree(true, true);
    ui.hint(touch ? C.stillHintTouch : C.stillHint);
    const t0 = this.time.now;
    let held = 0;
    return new Promise((resolve) => {
      const ev = this.time.addEvent({
        delay: 100, loop: true,
        callback: () => {
          held = this.still.value > 0.9 ? held + 100 : 0;
          if (held > 1200 || this.time.now - t0 > 32000) {
            ev.remove();
            ui.hint('');
            resolve();
          }
        },
      });
    });
  }

  async quake() {
    sound.vigil.hush(0.15, 0.3);
    sfx.lowImpact({ gain: 0.6, freq: 36 });
    sfx.distantBoom({ gain: 0.35 });
    ui.caption(CC.quake, 2600);
    if (!this.reduce) this.cameras.main.shake(2600, 0.012);
    this.lamps.forEach((l, i) => this.time.delayedCall(200 + i * 160, () => this.setLight(l, { on: 0.3 })));
    this.v.setBoardTexture(this.screen, 'cr_scr_static');
    sfx.glitch({ gain: 0.4 });
    this.setLight(this.screenLight, { color: 0xb0b0b8, power: 0.8 });
    await ui.dialogue.play(C.quake);
    this.lamps.forEach((l) => this.setLight(l, { on: 0.8 }));
    sound.sirens.start({ gain: 0.25, fadeIn: 4 });
    ui.caption(CC.sirens, 2400);
    sound.vigil.hush(0.7, 0.6);
    // Everyone, at once, away from the screen.
    this.mode = 'surge';
    const R = rng(5);
    for (const p of this.crowd) {
      const side = p.x - this.pos.x;
      p.vx = Math.sign(side || 1) * (0.4 + R() * 1.4);
      p.vz = -(1.6 + R() * 1.4);
      show(this, p, p.key);
    }
    this.time.addEvent({ delay: 420, repeat: 12, callback: () => sfx.footstep({ kind: 'soft', gain: 0.25 }) });
    if (!this.reduce) this.time.delayedCall(600, () => this.cameras.main.shake(1600, 0.005));
    // The child goes down.
    show(this, this.child, 'f_child_hurt');
    await wait(this, 1400);
  }

  // Pull her out.
  async rescue() {
    const { x, z } = this.child;
    if (AUTOPLAY) this.lookAt({ x, y: 0.5, z }, 900);
    await new Promise((resolve) => {
      const s = this.spot({ id: 'child', x, y: 0.5, z, label: C.child.prompt, reach: 1.5, hold: 0.8, use: () => { this.removeSpot(s); resolve(); } });
      if (AUTOPLAY) this.walkPath(x - 0.2, z - 1.0, { speed: 1.6 }).then(() => this.lookAt({ x, y: 0.5, z }, 600)).then(() => { this.removeSpot(s); resolve(); });
    });
    this.setFree(false, false);
    sfx.cloth({ gain: 0.18 });
    show(this, this.child, 'f_child');
    this.child.b.x = this.child.x = lerp(this.child.x, this.pos.x, 0.4);
    this.child.b.z = this.child.z = lerp(this.child.z, this.pos.z, 0.4);
    await this.lookAt({ x: this.child.x, y: 0.95, z: this.child.z }, 700);
    await ui.dialogue.play(C.child.lines.slice(0, 2));
    // For the length of a breath, somebody sees you.
    sound.vigil.hush(0.2, 0.4);
    sound.sirens.stop(0.4);
    await wait(this, 900);
    await ui.dialogue.play(C.child.lines.slice(2));
    sound.sirens.start({ gain: 0.2, fadeIn: 1 });
    sound.vigil.hush(0.6, 1);
    narrative.setFlag('ch3ChildSeen', true);
    // Someone's arms take her; she goes, looking back.
    show(this, this.child, 'f_child_back');
    this.tweens.add({ targets: this.child, x: this.child.x - 2.5, z: this.child.z - 3.5, duration: 2600, onUpdate: () => { this.child.b.x = this.child.x; this.child.b.z = this.child.z; }, onComplete: () => { this.child.b.visible = false; } });
    await wait(this, 1200);
  }

  // Four corners of the square. Nobody else looks.
  async witness() {
    const F = this.four;
    // A lamp post comes down on a pram, and stops.
    const P = EV.paperweight;
    await this.lookAt({ x: P.x - 0.3, y: 1.8, z: P.z }, 1400);
    sfx.metalSet({ pan: -0.6 });
    ui.caption(CC.post, 2000);
    await new Promise((r) => this.tweens.add({ targets: this.post, a: 0.95, duration: 900, ease: 'Quad.easeIn', onComplete: r }));
    show(this, F.paperweight, 'f_paperweight_brace');
    sfx.tell({ pan: -0.6, ms: 400 });
    await this.drift(this.post, 'a', 0.92, 0.97);
    await ui.dialogue.play(C.others.paperweight);

    // Steam, then cold steam.
    const L = EV.lukewarm;
    await this.lookAt({ x: L.x - 0.4, y: 1.2, z: L.z }, 1400);
    sfx.brakeHiss({ gain: 0.09, duration: 2.6 });
    ui.caption(CC.steam, 2200);
    this.tweens.add({ targets: this, steamOn: 1, duration: 500 });
    await wait(this, 1100);
    show(this, F.lukewarm, 'f_lukewarm_held');
    await wait(this, 500);
    this.tweens.add({ targets: this, steamCold: 1, duration: 1600 });
    await ui.dialogue.play(C.others.lukewarm);
    this.tweens.add({ targets: this, steamOn: 0.3, duration: 2000 });

    // He shouts at nothing; then the culvert goes.
    const D = EV.dowser;
    await this.lookAt({ x: D.x, y: 1.5, z: D.z }, 1400);
    show(this, F.dowser, 'f_dowser');
    await ui.dialogue.play(C.others.dowser.slice(0, 1));
    show(this, F.dowser, 'f_dowser_run');
    await this.lookAt({ x: this.culvert.x, y: 1, z: this.culvert.z }, 900);
    await wait(this, 700);
    sfx.whoosh({ gain: 0.12, duration: 2.2 });
    ui.caption(CC.water, 2400);
    sfx.lowImpact({ gain: 0.3, freq: 60 });
    this.tweens.add({ targets: this, waterOn: 1, duration: 500, ease: 'Quad.easeOut' });
    await ui.dialogue.play(C.others.dowser.slice(1));

    // The hoarding shakes; a man hums at it; it stops.
    const H = EV.humdrum;
    await this.lookAt({ x: H.x, y: 1.5, z: H.z + 0.4 }, 1400);
    this.hoard.shake = 1;
    sfx.bridgeGroan({ gain: 0.5, duration: 3 });
    ui.caption(CC.hoarding, 1800);
    await wait(this, 1200);
    sfx.bell({ freq: 110, gain: 0.06, decay: 3, hall: 0.3, pan: -0.4 });
    ui.caption(CC.hum, 2400);
    await new Promise((r) => this.tweens.add({ targets: this.hoard, shake: 0, duration: 2200, ease: 'Sine.easeOut', onComplete: r }));
    this.hoardPoly.points = this.hoardPts();
    this.hoardBand.points = this.hoardPts(1.2, 1.5);
    await ui.dialogue.play(C.others.humdrum);
    this.tweens.add({ targets: this, waterOn: 0.25, duration: 3000 });

    // Each of them, walking off a different way.
    const away = { paperweight: [-11, 12], lukewarm: [11, 4], dowser: [8, 21], humdrum: [-11, 20] };
    for (const [id, [x, z]] of Object.entries(away)) {
      const p = F[id];
      show(this, p, `${p.key}_back`);
      this.tweens.add({ targets: p, x, z, duration: 9000, onUpdate: () => { p.b.x = p.x; p.b.z = p.z; } });
    }
    await this.lookAt({ x: 0, y: 1.6, z: 12 }, 1800);
    await ui.dialogue.play(C.after);
  }

  // Slight give, as if whatever is holding it is holding it with effort.
  drift(target, key, a, b) {
    return new Promise((r) => this.tweens.add({ targets: target, [key]: { from: a, to: b }, duration: 260, yoyo: true, repeat: 1, onComplete: r }));
  }

  async screenOut() {
    await this.lookAt({ x: 0, y: 6, z: SCREEN_Z }, 1800);
    await wait(this, 1200);
    sfx.screenWake({});
    this.v.setBoardTexture(this.screen, 'cr_scr_event');
    this.setLight(this.screenLight, { color: 0xe0eef8, power: 1.6 });
    ui.caption(C.screen, 3600);
    await wait(this, 4200);
  }

  async finish() {
    await this.fx.fadeTo(1, 2000);
    sound.vigil.stop(1.5);
    sound.sirens.stop(1.5);
    nextPart(this, 'crowd');
  }
}

