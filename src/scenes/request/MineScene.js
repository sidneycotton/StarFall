import { Room, AUTOPLAY, EYE } from '../../fp/Room.js';
import { ui } from '../../ui/UI.js';
import { narrative } from '../../core/NarrativeState.js';
import { wait } from '../../systems/Cutscene.js';
import * as sfx from '../../audio/sfx.js';
import { sound } from '../../audio/soundscape.js';
import { paintTexture, rng } from '../../art/paint.js';
import { REQUEST } from '../../data/request.js';
import { person, walk, show } from './people.js';
import { nextPart } from './parts.js';

// 3.5 — Mine. Lodestar's headlights on the Sere road, then the waiting room
// at Vesper General, where every screen shows the same thing.
//
// Two places in one world: the road at x≈60, the waiting room at the origin.

const M = REQUEST.mine;
const CC = REQUEST.cc;
const ROAD = { x: 60, z: 0 };
const TV = { x: -0.4, y: 1.45, z: 4.9 };
// The row of chairs, facing the screen. Wallflower has the end one.
const SEATS = { dowser: -2.2, paperweight: -1.4, lukewarm: -0.6, humdrum: 0.2, wallflower: 1.0 };
const ROW_Z = 1.05;

export class MineScene extends Room {
  constructor() {
    super('Mine');
  }

  create() {
    narrative.setStage('mine');
    ui.letterbox(false);
    // (`?stage=mine&step` previews the other branch.)
    const q = new URLSearchParams(window.location.search);
    this.stepped = !!narrative.flag('ch3SteppedForward') || (q.get('stage') === 'mine' && q.has('step'));
    this.setupRoom({
      start: { x: ROAD.x, z: ROAD.z, yaw: 0, pitch: -0.02 },
      fog: 0x050408, fogDist: 22, ambient: 0.12,
      fx: { grain: 0.09, vignette: 0.75, aberration: 0.35, desat: 0.1 },
    });
    this.paintScreens();
    this.buildRoad();
    this.buildWard();
    this.bounds = [ROAD.x - 4, -2, ROAD.x + 4, 10];
    this.events.once('shutdown', () => {
      if (window.__mine === this) delete window.__mine;
      sound.room.stop(1);
      ui.hint('');
    });
    window.__mine = this;
    this.run().then(() => this.finish());
  }

  // --- the screens ------------------------------------------------------------------------------
  paintScreens() {
    const W = 800;
    const H = 450;
    const crawl = (ctx, text) => {
      ctx.fillStyle = '#c8a040'; ctx.fillRect(0, H - 58, W, 44);
      ctx.fillStyle = '#141018'; ctx.font = '500 22px Jost, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(text.toUpperCase(), 18, H - 28);
    };
    paintTexture(this, 'mn_tv_news', W, H, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1a2a44'); g.addColorStop(1, '#0a1220');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#e8eef4'; ctx.font = '600 30px Jost, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('VESPER NEWS', 24, 46);
      ctx.fillStyle = '#c03030'; ctx.fillRect(220, 22, 64, 30);
      ctx.fillStyle = '#fff'; ctx.font = '600 18px Jost, sans-serif'; ctx.fillText('LIVE', 232, 44);
      // Rubble in the plaza, from a helicopter, in the dark.
      const R = rng(4);
      for (let i = 0; i < 90; i++) {
        ctx.fillStyle = `rgba(${120 + R() * 80 | 0},${110 + R() * 60 | 0},${100 + R() * 50 | 0},${0.2 + R() * 0.4})`;
        ctx.fillRect(60 + R() * 680, 120 + R() * 230, 4 + R() * 30, 3 + R() * 12);
      }
      crawl(ctx, 'Vesper Plaza · quake during anniversary vigil · no deaths reported');
    });
    paintTexture(this, 'mn_tv_px', W, H, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0c0818'); g.addColorStop(1, '#2a1a40');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // The top of the Spire, and someone standing on it.
      ctx.fillStyle = '#0a0810';
      ctx.beginPath(); ctx.moveTo(300, H); ctx.lineTo(380, 250); ctx.lineTo(420, 250); ctx.lineTo(500, H); ctx.fill();
      const px = this.textures.get('f_px').getSourceImage();
      const s = 200 / px.height;
      const grd = ctx.createRadialGradient(400, 150, 4, 400, 150, 140);
      grd.addColorStop(0, 'rgba(184,160,255,0.45)'); grd.addColorStop(1, 'rgba(184,160,255,0)');
      ctx.fillStyle = grd; ctx.fillRect(250, 20, 300, 260);
      ctx.drawImage(px, 400 - px.width * s / 2, 252 - 200, px.width * s, 200);
      ctx.fillStyle = '#e8eef4'; ctx.font = '600 20px Jost, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('THE SPIRE · LIVE', 24, 40);
      crawl(ctx, M.crawl);
    });
    // Five registration photographs.
    const five = (key, last) => paintTexture(this, key, W, H, (ctx) => {
      ctx.fillStyle = '#d8d8d0'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#20242a'; ctx.font = '600 20px Jost, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('GUILD REGISTER · UNASSIGNED', W / 2, 40);
      const ids = ['dowser', 'paperweight', 'humdrum', 'lukewarm'];
      const fw = 136;
      const fh = 176;
      const y = 120;
      for (let i = 0; i < 5; i++) {
        const x = 30 + i * (fw + 18);
        ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x, y, fw, fh);
        if (i < 4) {
          const im = this.textures.get(`f_${ids[i]}`).getSourceImage();
          ctx.drawImage(im, 58, 6, 184, 238, x, y, fw, fh);
          ctx.fillStyle = '#20242a'; ctx.font = '500 15px Jost, sans-serif';
          ctx.fillText(ids[i].toUpperCase(), x + fw / 2, y + fh + 26);
          ctx.font = '400 13px Jost, sans-serif';
          ctx.fillText(`REG ${4100 + i * 37}·${(23 + i * 11) % 90}`, x + fw / 2, y + fh + 46);
        } else if (last === 'seen') {
          // A camera still: green, grainy, a doorway, someone in it.
          ctx.fillStyle = '#1a2a20'; ctx.fillRect(x, y, fw, fh);
          const R = rng(9);
          for (let k = 0; k < 500; k++) {
            ctx.fillStyle = `rgba(160,200,160,${R() * 0.18})`;
            ctx.fillRect(x + R() * fw, y + R() * fh, 2, 2);
          }
          ctx.fillStyle = '#2e4436'; ctx.fillRect(x + 20, y + 30, 50, 120);
          ctx.fillStyle = '#4a6a52';
          ctx.beginPath(); ctx.ellipse(x + 92, y + 70, 12, 14, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(x + 76, y + 84, 32, 70);
          ctx.fillStyle = '#20242a'; ctx.font = '500 13px Jost, sans-serif';
          ctx.fillText(M.fifthSeen, x + fw / 2, y + fh + 26);
        } else {
          ctx.fillStyle = '#b8bcc0'; ctx.fillRect(x, y, fw, fh);
          ctx.fillStyle = '#20242a'; ctx.font = '500 15px Jost, sans-serif';
          ctx.fillText('—', x + fw / 2, y + fh + 26);
          ctx.font = '400 13px Jost, sans-serif';
          ctx.fillText(M.fifthBlank, x + fw / 2, y + fh + 46);
        }
      }
    });
    five('mn_tv_five_blank', 'blank');
    five('mn_tv_five_seen', 'seen');
  }

  // --- the Sere road ----------------------------------------------------------------------------
  buildRoad() {
    const { x } = ROAD;
    this.floor(x - 8, x + 8, -4, 16, { step: 2, a: 0x2a2420, b: 0x28221e });
    // The car, nose toward you.
    this.box(x - 0.9, x + 0.9, 0.25, 1.0, 7.4, 11.8, { fill: 0x2a2e36, top: 0x343a44 });
    this.box(x - 0.8, x + 0.8, 1.0, 1.45, 8.6, 10.6, { fill: 0x1e2228, top: 0x2a2e36 });
    this.headlamps = [-0.6, 0.6].map((dx) => this.face([[x + dx - 0.2, 0.6, 7.38], [x + dx + 0.2, 0.6, 7.38], [x + dx + 0.2, 0.8, 7.38], [x + dx - 0.2, 0.8, 7.38]], { fill: 0x3a3a34, lit: false }));
    this.carLight = this.light({ x, y: 0.8, z: 6.6, power: 0, radius: 11, color: 0xfff4d8 });
    this.lodestar = person(this, 'lodestar', x + 1.3, 9.2, { visible: false });
  }

  // --- Vesper General ---------------------------------------------------------------------------
  buildWard() {
    const X = 3.4;
    const Z0 = -0.6;
    const Z1 = 5.2;
    const HT = 2.7;
    this.floor(-X, X, Z0, Z1, { step: 0.6, a: 0x9aa89a, b: 0x8e9c90 });
    this.ceiling(-X, X, Z0, Z1, HT, 0x8a9090, 1.2);
    const WALL = 0x7a827c;
    const LOW = 0x4a6258;
    this.wallZ(Z1, -X, X, 0, HT, { fill: WALL, dado: 1.0, dadoFill: LOW, step: 0.8 });
    this.wallZ(Z0, -X, X, 0, HT, { fill: WALL, dado: 1.0, dadoFill: LOW, step: 0.8 });
    this.wallX(-X, Z0, Z1, 0, HT, { fill: WALL, dado: 1.0, dadoFill: LOW, step: 0.8 });
    this.wallX(X, Z0, Z1, 0, HT, { fill: WALL, dado: 1.0, dadoFill: LOW, step: 0.8, shade: 0.75 });
    // Strip lights.
    [0.6, 2.6, 4.4].forEach((z) => this.face([[-1.2, HT - 0.01, z - 0.08], [1.2, HT - 0.01, z - 0.08], [1.2, HT - 0.01, z + 0.08], [-1.2, HT - 0.01, z + 0.08]], { fill: 0xe8f0f0, lit: false }));
    this.light({ x: 0, y: HT - 0.2, z: 1.2, power: 0.6, radius: 4.5, color: 0xd8e8e8 });
    this.light({ x: 0, y: HT - 0.2, z: 4, power: 0.45, radius: 4.5, color: 0xd8e8e8 });
    // The chairs, in a row, bolted together.
    for (const sx of Object.values(SEATS)) {
      this.box(sx - 0.3, sx + 0.3, 0.42, 0.5, ROW_Z - 0.2, ROW_Z + 0.3, { fill: 0x3a5a7a, top: 0x4a6a8a, solid: false });
      this.box(sx - 0.3, sx + 0.3, 0.5, 0.98, ROW_Z - 0.26, ROW_Z - 0.2, { fill: 0x3a5a7a, solid: false });
    }
    this.box(-2.6, 1.4, 0.36, 0.42, ROW_Z - 0.1, ROW_Z + 0.1, { fill: 0x5a5a60, solid: false });
    // A vending machine; the reception hatch, shut.
    this.box(2.5, X, 0, 1.9, 3.6, 4.5, { fill: 0x7a2a2a, top: 0x8a3a3a });
    this.face([[X - 0.92, 0.9, 3.75], [X - 0.92, 0.9, 4.35], [X - 0.92, 1.7, 4.35], [X - 0.92, 1.7, 3.75]], { fill: 0xd8e0e8, lit: false });
    this.face([[-X + 0.01, 1.0, 2.4], [-X + 0.01, 1.0, 3.6], [-X + 0.01, 1.6, 3.6], [-X + 0.01, 1.6, 2.4]], { fill: 0x3a4248 });
    // The television, high in the corner, and its light on the room.
    this.face([[TV.x - 0.82, TV.y - 0.06, TV.z + 0.05], [TV.x + 0.82, TV.y - 0.06, TV.z + 0.05], [TV.x + 0.82, TV.y + 0.98, TV.z + 0.05], [TV.x - 0.82, TV.y + 0.98, TV.z + 0.05]], { fill: 0x141418 });
    this.tv = this.figure('mn_tv_news', { x: TV.x, y: TV.y, z: TV.z, h: 0.9, lit: false });
    // A clock over the hatch side, its second hand stuck.
    const CZ = Z1 - 0.01;
    const ring = (r, n = 16) => Array.from({ length: n }, (_, i) => [1.9 + Math.cos((i / n) * Math.PI * 2) * r, 2.15 + Math.sin((i / n) * Math.PI * 2) * r, CZ]);
    this.face(ring(0.2), { fill: 0x2a2e30 });
    this.face(ring(0.17).map(([x, y]) => [x, y, CZ - 0.005]), { fill: 0xe8e8e0, shade: 1.1 });
    this.face([[1.89, 2.15, CZ - 0.01], [1.91, 2.15, CZ - 0.01], [1.97, 2.25, CZ - 0.01], [1.95, 2.26, CZ - 0.01]], { fill: 0x1a1a1a });
    this.face([[1.895, 2.15, CZ - 0.01], [1.905, 2.15, CZ - 0.01], [1.905, 2.05, CZ - 0.01], [1.895, 2.05, CZ - 0.01]], { fill: 0x1a1a1a });
    this.secondHand = this.face([[1.898, 2.15, CZ - 0.012], [1.902, 2.15, CZ - 0.012], [1.83, 2.02, CZ - 0.012], [1.826, 2.024, CZ - 0.012]], { fill: 0xa02020 });
    this.tvLight = this.light({ x: TV.x, y: TV.y, z: TV.z - 0.8, power: 0.5, radius: 4.5, color: 0x8aa0c0 });
    // The four.
    this.four = {};
    for (const id of ['dowser', 'paperweight', 'lukewarm', 'humdrum']) {
      const p = person(this, id, SEATS[id], ROW_Z + 0.05);
      show(this, p, `f_${id}_sitback`);
      this.four[id] = p;
    }
  }

  // --- running order ----------------------------------------------------------------------------
  async run() {
    // Dark, then headlights.
    this.fx.set({ fade: 1 });
    await wait(this, 800);
    sfx.brakeHiss({ gain: 0.06, duration: 1.6 });
    ui.caption(CC.car, 2600);
    for (const q of this.headlamps) { q.base = 0xfff8e0; q.fill = 0xfff8e0; }
    this.lightDirty = true;
    this.tweens.add({ targets: this.carLight, power: 1.6, duration: 900, onUpdate: () => { this.lightDirty = true; } });
    await this.fx.fadeTo(0, 1600);
    await wait(this, 600);
    sfx.doorSlide({ gain: 0.12 });
    const L = this.lodestar;
    L.b.visible = true;
    const coming = walk(this, L, [[ROAD.x + 1.0, 6.4], [ROAD.x + 0.3, 1.6]], 1.6);
    await wait(this, 900);
    await ui.dialogue.play(M.lodestar.slice(0, 1));
    await coming;
    await ui.dialogue.play(M.lodestar.slice(1, 2));
    walk(this, L, [[ROAD.x + 1.1, 7.0]], 1.2, { end: 'back' });
    await ui.dialogue.play(M.lodestar.slice(2));
    await this.fx.fadeTo(1, 1400);

    // Vesper General.
    sound.room.start({ gain: 0.3, fadeIn: 2 });
    await ui.chapterCard(M.place, '', 2600);
    this.sitDown();
    await this.fx.fadeTo(0, 1600);
    this.setFree(true, false);
    await wait(this, 1200);
    await ui.dialogue.play(M.waiting);
    await this.lookAround();
    await wait(this, 1400);

    // Every screen, the same thing.
    if (AUTOPLAY) this.lookAt({ x: TV.x, y: TV.y + 0.3, z: TV.z }, 1200);
    sfx.glitch({ gain: 0.3 });
    ui.caption(CC.broadcast, 2200);
    this.v.setBoardTexture(this.tv, 'mn_tv_px');
    this.setLight(this.tvLight, { color: 0xa890e0, power: 0.7 });
    this.time.delayedCall(2300, () => ui.caption(M.crawl, 4000));
    sound.room.stop(0.6);
    await wait(this, 4400);
    await ui.dialogue.play(M.broadcast.slice(0, 1));
    await wait(this, 600);
    await ui.dialogue.play(M.broadcast.slice(1));
    sfx.screenWake({});
    this.v.setBoardTexture(this.tv, this.stepped ? 'mn_tv_five_seen' : 'mn_tv_five_blank');
    this.setLight(this.tvLight, { color: 0xe0e4e8, power: 0.9 });
    ui.caption(this.stepped ? M.fifthSeen : M.fifthBlank, 3200);
    await wait(this, 3600);
    const lines = this.stepped ? M.closeSeen : M.close;
    await ui.dialogue.play(lines.slice(0, 1));
    // Turn to look at them: the one who spoke, the one beside you.
    this.setFree(false, false);
    const who = this.four[this.stepped ? 'lukewarm' : 'humdrum'];
    await this.lookAt({ x: who.x, y: 0.95, z: who.z + 0.3 }, 1100);
    await ui.dialogue.play(lines.slice(1));
    await wait(this, 1000);

    // From the screen's side: four people looking up, and a chair.
    this.setFree(false, false);
    this.fx.set({ fade: 1 });
    for (const p of Object.values(this.four)) show(this, p, `f_${p.id}_sit`);
    this.pos.x = TV.x + 0.2;
    this.pos.z = TV.z - 0.9;
    this.eye = 1.95;
    this.bounds = [-3.3, -0.5, 3.3, 5.1];
    await this.lookAt({ x: -0.6, y: 0.9, z: ROW_Z }, 10);
    await wait(this, 200);
    await this.fx.fadeTo(0, 900);
    await wait(this, 4200);
  }

  // From the end chair: the four, the room. They talk among themselves.
  async lookAround() {
    const seen = new Set();
    const it = M.items;
    const linesFor = (id) => {
      if (id === 'paperweight' && !narrative.flag('ch3PaperweightPulled')) return it.paperweight.linesDropped;
      if (id === 'lukewarm' && this.stepped) return it.lukewarm.linesStepped;
      return it[id].lines;
    };
    const examine = async (id) => {
      if (this.busy || ui.dialogue.active) return;
      this.busy = true;
      if (id === 'machine') sfx.metalSet({ pan: 0.5 });
      await ui.dialogue.play(linesFor(id));
      seen.add(id);
      this.lastExamined = this.time.now;
      this.busy = false;
    };
    const at = {
      clock: [1.9, 2.15, 5.1], hatch: [-3.4, 1.3, 3.0], machine: [2.6, 1.3, 4.05],
    };
    for (const id of Object.keys(this.four)) {
      const p = this.four[id];
      at[id] = [p.x, 1.0, p.z];
    }
    const spots = Object.entries(at).map(([id, [x, y, z]]) => this.spot({ id, x, y, z, label: it[id].label, reach: 5, use: () => examine(id) }));
    ui.hint(M.lookHint, 4000);

    // The second hand tries for the eight and falls back.
    const stick = this.time.addEvent({ delay: 1000, loop: true, callback: () => {
      this.secondHand.visible = !this.secondHand.visible || Math.random() < 0.5;
    } });

    const start = this.time.now;
    this.lastExamined = start;
    this.chatted = 0;
    const idle = () => !this.busy && !ui.dialogue.active;
    // They talk in the gaps: never straight over something you've just looked at.
    const lull = () => idle() && this.time.now - this.lastExamined > 3500;
    const chat = (async () => {
      for (const [i, group] of M.chat.entries()) {
        await this.until(() => this.lookDone || (this.time.now - start > 7000 + i * 14000 && lull()));
        if (this.lookDone) return;
        await ui.dialogue.play(group);
        this.chatted = i + 1;
        if (i === 2 && this.stepped) await ui.dialogue.play(M.chatStepped);
      }
    })();
    if (AUTOPLAY) {
      (async () => {
        for (const id of ['lukewarm', 'clock', 'paperweight']) {
          const [x, y, z] = at[id];
          while (!seen.has(id) && !this.lookDone) {
            await this.until(() => idle() || this.lookDone);
            if (this.lookDone) return;
            await this.lookAt({ x, y, z }, 1100);
            await wait(this, 500);
            await examine(id);
          }
          await wait(this, 1500);
        }
      })();
    }
    await this.until(() => (seen.size >= 2 && this.chatted >= 2 && this.time.now - start > 30000) || this.time.now - start > 60000);
    this.lookDone = true;
    await this.until(idle);
    stick.remove();
    this.secondHand.visible = true;
    spots.forEach((s) => this.removeSpot(s));
    ui.hint('');
    await chat.catch(() => {});
  }

  until(fn, ms = 1e9) {
    return new Promise((resolve) => {
      const t0 = this.time.now;
      const ev = this.time.addEvent({ delay: 100, loop: true, callback: () => { if (fn() || this.time.now - t0 > ms) { ev.remove(); resolve(); } } });
    });
  }

  sitDown() {
    this.pos.x = SEATS.wallflower;
    this.pos.z = ROW_Z + 0.05;
    this.eye = 1.12;
    this.bounds = [-3.3, -0.5, 3.3, 5.1];
    this.lookAt({ x: TV.x - 0.5, y: TV.y + 0.1, z: TV.z }, 10);
  }

  async finish() {
    await this.fx.fadeTo(1, 1600);
    this.eye = EYE;
    nextPart(this, 'mine');
  }
}
