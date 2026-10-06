import { Room, AUTOPLAY } from '../../fp/Room.js';
import { ui } from '../../ui/UI.js';
import { narrative } from '../../core/NarrativeState.js';
import { wait } from '../../systems/Cutscene.js';
import * as sfx from '../../audio/sfx.js';
import { sound } from '../../audio/soundscape.js';
import { REQUEST } from '../../data/request.js';
import { nextPart } from './parts.js';

// 3.2 — Cinder Street, the morning after. One room: a bed, a desk under the
// window, a mirror, a door. Everything in it is Wallflower's and almost
// nothing in it has ever been looked at by anyone else.
//
// Room: x -1.8..1.8, z 0..4.2. Door in the near wall, window in the far one.

const B = REQUEST.bedsit;
const CC = REQUEST.cc;
const W = 1.8;
const D = 4.2;
const H = 2.5;
const DOOR = { x: 0.9, z: 0 };
const WIN = { x0: -0.6, x1: 1.0, y0: 1.0, y1: 2.1 };

export class BedsitScene extends Room {
  constructor() {
    super('Bedsit');
  }

  create() {
    narrative.setStage('bedsit');
    ui.letterbox(false);
    this.setupRoom({
      start: { x: -0.4, z: 1.2, yaw: 0.25, pitch: -0.08 },
      fog: 0x0c0c10, fogDist: 12, ambient: 0.24,
      fx: { grain: 0.08, vignette: 0.7, aberration: 0.3, desat: 0.18 },
    });
    this.build();
    this.seen = new Set();
    this.events.once('shutdown', () => {
      if (window.__bedsit === this) delete window.__bedsit;
      sound.room.stop(1);
      ui.hint('');
      ui.paperOff();
    });
    window.__bedsit = this;
    this.run().then(() => this.finish());
  }

  build() {
    const WALL = 0x5a5650;
    const LOW = 0x403c38;
    this.floor(-W, W, 0, D, { step: 0.6, a: 0x3a2e26, b: 0x362a22 });
    this.ceiling(-W, W, 0, D, H, 0x48443e, 1.2);
    // Near wall and the door.
    this.wallZ(0, -W, DOOR.x - 0.45, 0, H, { fill: WALL, dado: 0.9, dadoFill: LOW, step: 0.9 });
    this.wallZ(0, DOOR.x + 0.45, W, 0, H, { fill: WALL, dado: 0.9, dadoFill: LOW, step: 0.45 });
    this.face([[DOOR.x - 0.45, 2.05, 0], [DOOR.x + 0.45, 2.05, 0], [DOOR.x + 0.45, H, 0], [DOOR.x - 0.45, H, 0]], { fill: WALL });
    this.face([[DOOR.x - 0.45, 0, 0.01], [DOOR.x + 0.45, 0, 0.01], [DOOR.x + 0.45, 2.05, 0.01], [DOOR.x - 0.45, 2.05, 0.01]], { fill: 0x4a3a2c, shade: 0.9 });
    // A line of corridor light under the door.
    this.v.poly([[DOOR.x - 0.42, 0.004, 0.012], [DOOR.x + 0.42, 0.004, 0.012], [DOOR.x + 0.42, 0.02, 0.012], [DOOR.x - 0.42, 0.02, 0.012]], { fill: 0xd8c8a0 });
    this.face([[DOOR.x + 0.32, 1.0, 0.02], [DOOR.x + 0.38, 1.0, 0.02], [DOOR.x + 0.38, 1.06, 0.02], [DOOR.x + 0.32, 1.06, 0.02]], { fill: 0x9a8a5a, shade: 1.3 });

    // Far wall and the window.
    this.wallZ(D, -W, WIN.x0, 0, H, { fill: WALL, dado: 0.9, dadoFill: LOW, step: 0.6 });
    this.wallZ(D, WIN.x1, W, 0, H, { fill: WALL, dado: 0.9, dadoFill: LOW, step: 0.8 });
    this.wallZ(D, WIN.x0, WIN.x1, 0, WIN.y0, { fill: LOW, step: 1.6 });
    this.wallZ(D, WIN.x0, WIN.x1, WIN.y1, H, { fill: WALL, step: 1.6 });
    // The street: white morning, the block opposite, its screens all on the same sky.
    const out = (pts, fill) => this.v.poly(pts.map(([x, y]) => [x, y, D + 0.4]), { fill, layer: 'outside', fog: false });
    out([[WIN.x0 - 0.3, WIN.y0 - 0.2], [WIN.x1 + 0.3, WIN.y0 - 0.2], [WIN.x1 + 0.3, WIN.y1 + 0.3], [WIN.x0 - 0.3, WIN.y1 + 0.3]], 0xb8bcc4);
    out([[WIN.x0 - 0.3, WIN.y0 - 0.2], [WIN.x1 + 0.3, WIN.y0 - 0.2], [WIN.x1 + 0.3, 1.75], [WIN.x0 - 0.3, 1.75]], 0x6a6872);
    [[-0.45, 1.2], [-0.05, 1.3], [0.35, 1.18], [0.7, 1.32]].forEach(([x, y]) => {
      out([[x, y], [x + 0.2, y], [x + 0.2, y + 0.13], [x, y + 0.13]], 0x3a3060);
      out([[x + 0.02, y + 0.02], [x + 0.18, y + 0.02], [x + 0.18, y + 0.11], [x + 0.02, y + 0.11]], 0x8a70c0);
    });
    const m = (WIN.x0 + WIN.x1) / 2;
    this.face([[m - 0.025, WIN.y0, D - 0.02], [m + 0.025, WIN.y0, D - 0.02], [m + 0.025, WIN.y1, D - 0.02], [m - 0.025, WIN.y1, D - 0.02]], { fill: 0x2a2622 });
    this.face([[WIN.x0, (WIN.y0 + WIN.y1) / 2 - 0.02, D - 0.02], [WIN.x1, (WIN.y0 + WIN.y1) / 2 - 0.02, D - 0.02], [WIN.x1, (WIN.y0 + WIN.y1) / 2 + 0.02, D - 0.02], [WIN.x0, (WIN.y0 + WIN.y1) / 2 + 0.02, D - 0.02]], { fill: 0x2a2622 });

    // Side walls.
    this.wallX(-W, 0, D, 0, H, { fill: WALL, dado: 0.9, dadoFill: LOW, step: 0.7 });
    this.wallX(W, 0, D, 0, H, { fill: WALL, dado: 0.9, dadoFill: LOW, step: 0.7, shade: 0.75 });

    // The bed, unmade.
    this.box(-W, -0.85, 0, 0.42, 1.7, D - 0.1, { fill: 0x3a3440, top: 0x6a6a78 });
    this.box(-W + 0.1, -0.95, 0.42, 0.52, D - 0.6, D - 0.15, { fill: 0xb8b4b0, solid: false });
    this.box(-W + 0.05, -0.9, 0.42, 0.5, 1.75, 2.9, { fill: 0x5a5a70, solid: false });
    // Desk under the window, a chair.
    this.box(WIN.x0 - 0.1, WIN.x1 + 0.3, 0.72, 0.77, D - 0.6, D, { fill: 0x5a4430, top: 0x6a5238 });
    [[WIN.x0 - 0.06, D - 0.56], [WIN.x1 + 0.2, D - 0.56]].forEach(([x, z]) => this.box(x, x + 0.05, 0, 0.72, z, z + 0.05, { fill: 0x3a2a20, solid: false }));
    this.box(0.1, 0.5, 0.44, 0.48, D - 1.1, D - 0.7, { fill: 0x4a3626, solid: false });
    // On the desk: the card, the Guild's letter, the phone.
    const top = 0.775;
    const flat = (x, z, w, d, fill) => this.face([[x, top, z], [x + w, top, z], [x + w, top, z + d], [x, top, z + d]], { fill, shade: 1.2 });
    flat(-0.45, D - 0.45, 0.09, 0.055, 0xe8e0d0);
    flat(-0.15, D - 0.5, 0.21, 0.29, 0xd8d0c0);
    flat(0.55, D - 0.42, 0.07, 0.14, 0x18161c);
    // A wardrobe in the corner, the mirror on the right wall.
    this.box(W - 0.6, W, 0, 2.0, 0.2, 1.0, { fill: 0x4a3828, top: 0x5a4430 });
    const MZ = 2.2;
    this.face([[W - 0.02, 0.9, MZ - 0.3], [W - 0.02, 0.9, MZ + 0.3], [W - 0.02, 1.9, MZ + 0.3], [W - 0.02, 1.9, MZ - 0.3]], { fill: 0x2a2622 });
    this.mirror = this.face([[W - 0.03, 0.95, MZ - 0.26], [W - 0.03, 0.95, MZ + 0.26], [W - 0.03, 1.85, MZ + 0.26], [W - 0.03, 1.85, MZ - 0.26]], { fill: 0x8a9098, shade: 1.1 });
    // Whoever is in it: a head and shoulders, there only while you move.
    const sx = W - 0.04;
    this.reflection = this.v.poly([[sx, 0.95, MZ - 0.22], [sx, 1.3, MZ - 0.2], [sx, 1.42, MZ - 0.08], [sx, 1.72, MZ - 0.1], [sx, 1.78, MZ], [sx, 1.72, MZ + 0.1], [sx, 1.42, MZ + 0.08], [sx, 1.3, MZ + 0.2], [sx, 0.95, MZ + 0.22]], { fill: 0x3a3a44, alpha: 0.9 });
    this.MZ = MZ;
    // A radio on a bracket by the window.
    this.box(W - 0.24, W, 1.0, 1.03, 3.25, 3.75, { fill: 0x3a2a20, solid: false });
    this.box(W - 0.2, W - 0.02, 1.03, 1.2, 3.32, 3.66, { fill: 0x5a4a3a, top: 0x6a5a48, solid: false });
    this.face([[W - 0.205, 1.06, 3.36], [W - 0.205, 1.06, 3.5], [W - 0.205, 1.17, 3.5], [W - 0.205, 1.17, 3.36]], { fill: 0x2a2420 });
    this.radioDial = this.face([[W - 0.205, 1.1, 3.54], [W - 0.205, 1.1, 3.62], [W - 0.205, 1.14, 3.62], [W - 0.205, 1.14, 3.54]], { fill: 0x6a5a30, lit: false });
    // A newspaper cutting, pinned over the bed's foot: the Starfall photograph.
    const CX = -W + 0.012;
    this.face([[CX, 1.3, 1.0], [CX, 1.3, 1.4], [CX, 1.78, 1.4], [CX, 1.78, 1.0]], { fill: 0xc8c0ae, shade: 1.1 });
    this.face([[CX + 0.002, 1.44, 1.04], [CX + 0.002, 1.44, 1.36], [CX + 0.002, 1.74, 1.36], [CX + 0.002, 1.74, 1.04]], { fill: 0x2a2a34 });
    this.face([[CX + 0.004, 1.47, 1.04], [CX + 0.004, 1.47, 1.36], [CX + 0.004, 1.5, 1.36], [CX + 0.004, 1.5, 1.04]], { fill: 0x4a4a50 });
    [[1.13, 1.64], [1.27, 1.61]].forEach(([z, y]) => this.face([[CX + 0.005, y - 0.018, z - 0.018], [CX + 0.005, y - 0.018, z + 0.018], [CX + 0.005, y + 0.018, z + 0.018], [CX + 0.005, y + 0.018, z - 0.018]], { fill: 0xf0ecd8, lit: false }));
    [1.34, 1.37, 1.4].forEach((y) => this.face([[CX + 0.002, y, 1.06], [CX + 0.002, y, 1.34], [CX + 0.002, y + 0.012, 1.34], [CX + 0.002, y + 0.012, 1.06]], { fill: 0x6a6658 }));
    // Pencil marks behind the head of the bed, in fives. The twelfth is drawn later.
    const TX = -W + 0.012;
    const mark = (i) => {
      const z = 3.55 + Math.floor(i / 5) * 0.11 + (i % 5) * 0.018;
      if (i % 5 === 4) return this.face([[TX, 0.6, z - 0.075], [TX, 0.6, z - 0.065], [TX, 0.72, z + 0.005], [TX, 0.72, z - 0.005]], { fill: 0x2a2826 });
      return this.face([[TX, 0.6, z], [TX, 0.6, z + 0.006], [TX, 0.72, z + 0.006], [TX, 0.72, z]], { fill: 0x2a2826 });
    };
    for (let i = 0; i < 11; i++) mark(i);
    this.twelfth = mark(11);
    this.twelfth.visible = false;
    // A coat on the hook by the door, a child's handprint on the cuff.
    const KZ = 0.03;
    this.face([[0.02, 1.68, KZ], [0.08, 1.68, KZ], [0.08, 1.74, KZ], [0.02, 1.74, KZ]], { fill: 0x8a7a50, shade: 1.2 });
    this.face([[-0.2, 1.72, KZ + 0.01], [0.3, 1.72, KZ + 0.01], [0.38, 0.92, KZ + 0.01], [-0.28, 0.92, KZ + 0.01]], { fill: 0x2e3238 });
    this.face([[0.24, 1.6, KZ + 0.02], [0.34, 1.58, KZ + 0.02], [0.4, 1.02, KZ + 0.02], [0.3, 1.0, KZ + 0.02]], { fill: 0x343840 });
    this.face([[0.31, 1.02, KZ + 0.03], [0.37, 1.02, KZ + 0.03], [0.38, 1.08, KZ + 0.03], [0.32, 1.09, KZ + 0.03]], { fill: 0x5a4a34 });
    // The letter, once it comes.
    this.letterPoly = this.face([[DOOR.x - 0.12, 0.004, 0.08], [DOOR.x + 0.1, 0.004, 0.12], [DOOR.x + 0.08, 0.004, 0.42], [DOOR.x - 0.14, 0.004, 0.38]], { fill: 0xe8e0d0, ground: true, shade: 1.3 });
    this.letterPoly.visible = false;

    // Light: the window, and a grey bounce off the ceiling.
    this.light({ x: 0.2, y: 1.7, z: D - 0.4, power: 1.5, radius: 4.4, color: 0xc0c8d8 });
    this.light({ x: 0, y: 2.3, z: 1.6, power: 0.45, radius: 3.4, color: 0xd8d0c0 });
    this.bounds = [-W, 0, W, D];

    // Things to look at.
    const it = B.items;
    const item = (id, x, y, z, reach = 1.4) => this.spot({ id, x, y, z, label: it[id].label, reach, use: () => this.examine(id) });
    item('card', -0.4, top, D - 0.42);
    item('rejection', -0.05, top, D - 0.36);
    item('phone', 0.58, top, D - 0.35);
    item('mirror', W, 1.4, MZ, 1.5);
    item('window', 0.2, 1.6, D, 1.7);
    item('radio', W - 0.1, 1.12, 3.5, 1.5);
    item('cutting', -W, 1.55, 1.2, 1.6);
    item('tally', -W, 0.66, 3.65, 1.6);
    item('coat', 0.08, 1.3, 0.05, 1.5);
  }

  async examine(id) {
    if (this.busy) return;
    this.busy = true;
    if (id === 'card' || id === 'rejection') sfx.paperShuffle();
    if (id === 'phone') sfx.glassClink({ pitch: 0.5, gain: 0.05 });
    if (id === 'radio') {
      ui.caption(CC.radio, 2000);
      sfx.radio({ gain: 0.05 });
      this.radioDial.base = 0xe8c060; this.radioDial.fill = 0xe8c060;
      this.lightDirty = true;
      await wait(this, 900);
    }
    await ui.dialogue.play(B.items[id].lines);
    this.seen.add(id);
    this.busy = false;
  }

  tick() {
    // The mirror loses you when you stop.
    this.reflection.alpha = 0.9 * (1 - this.still.value) + 0.05;
    const near = Math.abs(this.pos.z - this.MZ) < 1.4 && this.pos.x > 0;
    this.reflection.visible = near;
  }

  async run() {
    sound.room.start({ gain: 0.25, fadeIn: 3 });
    await ui.chapterCard(B.place, '', 2600);
    await this.fx.fadeTo(0, 2200);
    this.setFree(true, true);
    await ui.dialogue.play(B.open);

    // Look around; after a while (or four things), something comes under the door.
    const start = this.time.now;
    if (AUTOPLAY) this.autoLook();
    await this.until(() => this.seen.size >= 4 || this.time.now - start > 110000);
    await this.until(() => !this.busy && !ui.dialogue.active);
    await wait(this, 1400);
    sfx.sheetPull();
    ui.caption(CC.letter, 2800);
    this.letterPoly.visible = true;
    await wait(this, 600);
    ui.hint(B.letterHint, 5000);
    const taken = new Promise((resolve) => {
      const s = this.spot({ id: 'letter', x: DOOR.x, y: 0.05, z: 0.25, label: B.letter.label, reach: 1.6, use: () => { this.removeSpot(s); resolve(); } });
      if (AUTOPLAY) this.walkPath(DOOR.x - 0.2, 0.9, { speed: 1.2 }).then(() => this.lookAt({ x: DOOR.x, y: 0, z: 0.25 }, 800)).then(() => wait(this, 600)).then(() => { this.removeSpot(s); resolve(); });
    });
    await taken;
    ui.hint('');
    this.letterPoly.visible = false;
    sfx.paperShuffle();
    this.setFree(false, false);
    await this.lookAt({ x: DOOR.x, y: 1.2, z: 0.6 }, 900);
    ui.paper(B.letter.text);
    await wait(this, 1800);
    await this.awaitAction(5200);
    ui.paperOff();
    await wait(this, 700);
    await ui.dialogue.play(B.letter.after);
    narrative.setFlag('ch3LetterRead', true);
    await wait(this, 800);

    // Somebody wrote her name without being told it.
    this.setFree(false, false);
    await this.walkPath(-0.6, 3.4, { speed: 1.1 });
    await this.lookAt({ x: -W, y: 0.66, z: 3.7 }, 1000);
    await wait(this, 700);
    sfx.paperShuffle();
    this.twelfth.visible = true;
    await wait(this, 900);
    await ui.dialogue.play(B.tallyAfter);
    await wait(this, 800);
  }

  // Under autoplay: walk to things and look at them.
  async autoLook() {
    for (const id of ['card', 'radio', 'mirror', 'cutting', 'window']) {
      const s = this.spots.find((x) => x.id === id);
      const at = { mirror: [W - 0.8, this.MZ], radio: [W - 0.9, 3.0], cutting: [-0.5, 1.2] }[id] || [s.x, D - 1.4];
      const [tx, tz] = at;
      await this.walkPath(tx, tz, { speed: 1.2 });
      await this.lookAt({ x: s.x, y: s.y, z: s.z }, 700);
      await wait(this, id === 'mirror' ? 2600 : 400);
      await this.examine(id);
    }
  }

  until(fn, ms = 1e9) {
    return new Promise((resolve) => {
      const t0 = this.time.now;
      const ev = this.time.addEvent({ delay: 100, loop: true, callback: () => { if (fn() || this.time.now - t0 > ms) { ev.remove(); resolve(); } } });
    });
  }

  async finish() {
    await this.fx.fadeTo(1, 1800);
    sound.room.stop(1.5);
    nextPart(this, 'bedsit');
  }
}
