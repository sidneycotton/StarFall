import { Room, AUTOPLAY, clamp, lerp, wrap } from '../../fp/Room.js';
import { ui } from '../../ui/UI.js';
import { narrative } from '../../core/NarrativeState.js';
import { settings } from '../../core/Settings.js';
import { input } from '../../systems/Input.js';
import { bus } from '../../core/EventBus.js';
import { wait } from '../../systems/Cutscene.js';
import * as sfx from '../../audio/sfx.js';
import { sound } from '../../audio/soundscape.js';
import { REQUEST } from '../../data/request.js';
import { buildRelay, RELAY } from './relay.js';
import { nextPart } from './parts.js';

// 3.4 — The ambush. Relay 9, after dark. Survival, not victory.
//
// Parallax takes the four of them apart one at a time, slowly, as if she has
// all night. Wallflower can do small things while her helmet is turned away;
// if she catches them moving, she turns to the air where they were, finds
// nothing, and somebody else pays for it.
//
// She never looks straight at Wallflower. Not once.

const PARAMS = new URLSearchParams(window.location.search);
const A = REQUEST.ambush;
const PX_H = 1.98;
const AVERT = 0.18;            // how far her head stays from Wallflower, always

// Lines in here play over the action, so none of them waits for a button.
const timed = (lines) => lines.map((l) => (l.auto ? l : { ...l, auto: Math.max(1600, l.text.length * 55 + 1100) }));

export class AmbushScene extends Room {
  constructor() {
    super('Ambush');
  }

  create() {
    narrative.setStage('ambush');
    ui.letterbox(false);
    this.setupRoom({
      start: { x: RELAY.byDoor.x, z: RELAY.byDoor.z, yaw: 0.35, pitch: -0.04 },
      fog: 0x070508, fogDist: 16, ambient: 0.13,
      fx: { grain: 0.09, vignette: 0.85, aberration: 0.45, desat: 0.1 },
    });
    this.walkTalk = true;
    this.relay = buildRelay(this);
    this.assist = settings.get('assist');
    this.detect = this.assist !== 'auto' && (!AUTOPLAY || PARAMS.has('seen'));
    this.slack = this.assist === 'relaxed' ? 1.5 : 1;
    this.costs = 0;
    this.sus = 0;
    this.hunting = false;

    // The four, where they were when the lights went.
    const at = (key, x, z, h = 1.72) => ({ key, x, z, b: this.figure(key, { x, z, h }), hurt: 0 });
    this.people = {
      humdrum: at('sp_sleeper_a', 0.6, 5.5),
      dowser: at('sp_sami_a', 2.8, 8.4),
      paperweight: at('sp_nell_a', -3.4, 6.1, 1.62),
      lukewarm: at('sp_mara_a', 3.9, 5.7, 1.66),
    };

    // Her: a board, a glow where she stands, a cold patch where she looks.
    const px = { x: RELAY.hatch.x, z: RELAY.hatch.z, y: -0.8, look: null, scan: 0, walk: null };
    px.b = this.figure('sp_px', { x: px.x, z: px.z, h: PX_H, lit: false });
    px.b.alpha = 0;
    px.w = this.still.watch({ id: 'parallax', x: px.x, z: px.z, yaw: Math.PI, fov: 1.5, range: 13, on: false });
    px.glow = this.light({ x: px.x, y: 1.2, z: px.z, power: 0, radius: 1.6, color: 0x8a6cff });
    px.gaze = this.light({ x: px.x, y: 0.3, z: px.z, power: 0, radius: 1.2, color: 0x9a6cff });
    this.px = px;
    // The other one. Out past the back door, for a moment.
    this.echo = this.figure('sp_px', { x: RELAY.back.x + 0.4, z: RELAY.D + 3.2, h: PX_H, lit: false });
    this.echo.visible = false;
    this.boilerLight = this.light({ x: 4.4, y: 0.8, z: 5.7, power: 0.35, radius: 1.8, color: 0xff7a40 });

    window.__ambush = this;
    this.events.once('shutdown', () => {
      if (window.__ambush === this) delete window.__ambush;
      sound.room.stop(1);
      ui.hint('');
    });
    this.run().then(() => this.finish());
  }

  // --- her -------------------------------------------------------------------------
  // Where Wallflower is, from where she stands.
  bearing() {
    return this.px.w.yawTo(this.pos.x, this.pos.z);
  }

  // Point her head at something (a person, a place), or let it scan.
  attend(target) {
    this.px.look = target;
  }

  pxWalk(x, z, speed = 0.9) {
    return new Promise((resolve) => { this.px.walk = { x, z, speed, resolve }; });
  }

  tickPx(dt, t) {
    const px = this.px;
    if (px.walk) {
      const w = px.walk;
      const dx = w.x - px.x;
      const dz = w.z - px.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.04) { px.walk = null; w.resolve(); } else {
        const step = Math.min(d, w.speed * dt);
        px.x += (dx / d) * step;
        px.z += (dz / d) * step;
      }
    }
    // The head: whatever she attends to, or a slow sweep.
    let want;
    if (px.look === 'scan' || !px.look) {
      px.scan += dt * 0.35;
      want = (px.scanBase ?? Math.PI) + Math.sin(px.scan) * 1.3;
    } else if (typeof px.look === 'number') {
      want = px.look;
    } else {
      want = px.w.yawTo(px.look.x, px.look.z);
    }
    // Never quite at Wallflower.
    const off = wrap(want - this.bearing());
    if (Math.abs(off) < AVERT) want = this.bearing() + (off >= 0 ? AVERT : -AVERT);
    px.w.turnToward(want, px.look === 'scan' ? 0.9 : 2.2, dt);
    px.w.x = px.x;
    px.w.z = px.z;
    px.b.x = px.x;
    px.b.z = px.z;
    px.b.y = px.y;
    // A very slow breath in the board so she never reads as a cut-out.
    px.b.h = PX_H * (1 + Math.sin(t * 1.3) * 0.004);
    this.setLight(px.glow, { x: px.x, z: px.z });
    this.setLight(px.gaze, { x: px.x + Math.sin(px.w.yaw) * 2.2, z: px.z + Math.cos(px.w.yaw) * 2.2 });
  }

  // --- being seen --------------------------------------------------------------------
  tickSeen(dt) {
    if (!this.hunting || !this.detect || this.seeing) {
      this.sus = Math.max(0, this.sus - dt);
      return;
    }
    const cone = this.px.w.covers(this.pos.x, this.pos.z);
    const k = 1 / this.slack;
    if (cone && this.still.moving) this.sus += 4 * dt * k;
    else if (cone && !this.still.hidden) this.sus += 0.6 * dt * k;
    else this.sus = Math.max(0, this.sus - 0.8 * dt);
    if (this.sus > 0.35 && !this.told) { this.told = true; sfx.tell({ ms: 600 }); }
    if (this.sus < 0.1) this.told = false;
    if (this.sus >= 1) this.onSeen();
  }

  async onSeen() {
    this.seeing = true;
    this.sus = 0;
    this.costs++;
    narrative.setRecord('ch3Seen', this.costs);
    bus.emit('ambush:seen', this.costs);
    const px = this.px;
    const was = px.look;
    // The air where they were.
    const b = this.bearing();
    this.attend(b + (Math.random() < 0.5 ? 0.3 : -0.3));
    sfx.glitch({ gain: 0.4 });
    await wait(this, 900);
    // Then whoever is nearest.
    const near = Object.values(this.people)
      .filter((p) => p.b.visible && !p.gone)
      .sort((a, c) => Math.hypot(a.x - px.x, a.z - px.z) - Math.hypot(c.x - px.x, c.z - px.z))[0];
    if (near) {
      this.attend(near);
      await wait(this, 500);
      this.hurt(near);
    }
    ui.dialogue.play(timed(this.costs === 1 ? A.seen : A.seenAgain));
    await wait(this, 1400);
    this.attend(was);
    this.seeing = false;
  }

  hurt(p) {
    p.hurt++;
    sfx.lowImpact({ gain: 0.45, freq: 52 });
    sfx.cloth({ gain: 0.1, duration: 0.4 });
    this.fx.flash({ r: 0.5, g: 0.3, b: 1, peak: 0.12, release: 500 });
    // Down a little further each time.
    p.b.h = Math.max(0.9, p.b.h * 0.86);
  }

  // --- the evening -------------------------------------------------------------------------
  async run() {
    sound.room.start({ gain: 0.5, fadeIn: 3 });
    await this.fx.fadeTo(0, 2200);
    this.setFree(true, false);
    await wait(this, 1200);

    // The lights, from the far end.
    ui.dialogue.play(timed(A.lights));
    for (const lamp of [...this.relay.lamps].reverse()) {
      await wait(this, 900);
      sfx.lanternOut({ pan: 0 });
      this.setLight(lamp.light, { on: 0 });
      lamp.bulb.fill = 0x1a1612;
    }
    this.setFree(true, true);
    await wait(this, 1600);

    // Her.
    sfx.metalSet({ pan: 0.2 });
    this.setLight(this.px.glow, { power: 0.8 });
    await this.tween(this.px, { y: 0 }, 2600);
    this.tween(this.px.b, { alpha: 1 }, 1800);
    this.setLight(this.px.gaze, { power: 1.4 });
    this.px.w.on = true;
    this.attend('scan');
    this.px.scanBase = Math.PI * 0.85;
    await ui.dialogue.play(timed(A.arrive));
    this.hunting = true;
    ui.hint(A.stillHint);
    this.until(() => this.still.hidden, 9000).then(() => ui.hint(A.moveHint, 3200));
    await wait(this, 2400);

    await this.humdrum();
    await this.dowser();
    await this.paperweight();
    await this.lukewarm();
    await this.choice();
    await this.leave();
  }

  async humdrum() {
    const h = this.people.humdrum;
    this.attend(h);
    await this.pxWalk(h.x + 0.6, h.z + 0.7);
    await ui.dialogue.play(timed(A.humdrum.slice(0, 2)));
    sfx.lowImpact({ gain: 0.6, freq: 60 });
    sfx.cloth({ gain: 0.14 });
    h.b.h *= 0.7;
    await ui.dialogue.play(timed(A.humdrum.slice(2)));
    this.attend('scan');
    await wait(this, 2200);
  }

  async dowser() {
    const d = this.people.dowser;
    ui.dialogue.play(timed(A.dowser.slice(0, 1)));
    // He runs for the back door; she lets him.
    this.attend(d);
    await this.move(d, RELAY.back.x - 0.2, RELAY.D - 0.6, 2.2);
    ui.dialogue.play(timed(A.dowser.slice(1)));
    this.attend('scan');
    this.px.scanBase = Math.PI * 0.6;
    const bar = this.spot({ id: 'bar', x: RELAY.back.x, y: 1.06, z: RELAY.D - 0.1, label: A.tasks.bar.label, reach: 1.5, hold: 1.2 });
    const kicked = await this.task(bar, 14000);
    narrative.setFlag('ch3BarKicked', kicked);
    if (!kicked) {
      // She walks over and lifts it off herself.
      this.attend(d);
      await this.pxWalk(RELAY.back.x - 1.2, RELAY.D - 1.2);
      await ui.dialogue.play(timed(A.goOn));
    }
    this.relay.bar.visible = false;
    this.relay.backLeaf.visible = false;
    sfx.doorSlide({ gain: 0.16 });
    await this.move(d, RELAY.back.x, RELAY.D + 2.6, 2.6);
    // ...and there she is, outside, where he ran to. And still in here.
    this.echo.visible = true;
    this.echo.alpha = 0.9;
    await wait(this, 500);
    sfx.lowImpact({ gain: 0.35, freq: 44 });
    d.b.visible = false;
    d.gone = true;
    ui.dialogue.play(timed(A.outside));
    await wait(this, 1300);
    this.echo.visible = false;
    this.attend('scan');
    await wait(this, 1800);
  }

  async paperweight() {
    const p = this.people.paperweight;
    // She makes for the side office and the lintel comes down on her.
    await this.move(p, RELAY.side.x + 0.4, RELAY.side.z, 2);
    sfx.lowImpact({ gain: 0.5, freq: 40 });
    sfx.collapse?.();
    p.b.h *= 0.82;
    await ui.dialogue.play(timed(A.paperweight));
    this.attend('scan');
    this.px.scanBase = -Math.PI * 0.6;
    await this.pxWalk(-2.2, 7.4);
    const pull = this.spot({ id: 'drag', x: p.x + 0.3, y: 0.9, z: p.z, label: A.tasks.drag.label, reach: 1.5, hold: 3 });
    const pulled = await this.task(pull, 30000);
    narrative.setFlag('ch3PaperweightPulled', pulled);
    if (pulled) {
      await this.move(p, -4.6, 6.9, 1.2);
      ui.dialogue.play(timed(A.pulled));
    } else {
      sfx.lowImpact({ gain: 0.7, freq: 36 });
      p.b.h *= 0.6;
      ui.dialogue.play(timed(A.dropped));
    }
    await wait(this, 2200);
  }

  async lukewarm() {
    const l = this.people.lukewarm;
    this.attend(l);
    await this.pxWalk(l.x - 0.7, l.z - 0.3);
    await this.move(l, RELAY.boiler.x0 - 0.25, 5.7, 1.4);
    this.setLight(this.boilerLight, { power: 0.9, radius: 2.4 });
    await ui.dialogue.play(timed(A.lukewarm));
    this.attend('scan');
    this.px.scanBase = -Math.PI * 0.5;
    const { panel } = RELAY;
    const cut = this.spot({ id: 'power', x: panel.x - 0.1, y: panel.y, z: panel.z, label: A.tasks.power.label, reach: 1.6, hold: 1.5 });
    const done = await this.task(cut, 22000);
    narrative.setFlag('ch3PowerCut', done);
    if (done) {
      sfx.lanternOut({ pan: 0.6 });
      this.setLight(this.boilerLight, { power: 0.08 });
      await ui.dialogue.play(timed(A.powerCut));
    }
    this.attend(l);
  }

  // The one choice: stay still, or walk to her.
  async choice() {
    this.hunting = false;
    this.attend(this.people.lukewarm);
    const from = { x: this.pos.x, z: this.pos.z };
    ui.hint(input.lastDevice === 'touch' ? A.chooseTouch : A.choose(input.keyName('action'), input.keyName('dodge')));
    const limit = (this.assist === 'relaxed' ? 18000 : 12000);
    const pick = await new Promise((resolve) => {
      let done = false;
      const end = (v) => { if (!done) { done = true; offDodge(); resolve(v); } };
      const offDodge = bus.on('input:dodge', () => end('step'));
      this.choosing = () => {
        if (Math.hypot(this.pos.x - from.x, this.pos.z - from.z) > 0.5) end('step');
      };
      this.awaitAction(AUTOPLAY ? 2600 : limit).then(() => end('stay'));
      this.time.delayedCall(limit, () => end('stay'));
      if (AUTOPLAY && PARAMS.has('step')) this.time.delayedCall(1800, () => end('step'));
    });
    this.choosing = null;
    this.waitingFor = null;
    ui.hint('');
    const stepped = pick === 'step';
    narrative.setFlag('ch3SteppedForward', stepped);
    if (stepped) {
      this.setFree(true, false);
      const l = this.people.lukewarm;
      const dx = l.x - this.pos.x;
      const dz = l.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      const go = Math.min(1.4, Math.max(0, d - 1.4));
      await this.walkTo(this.pos.x + (dx / d) * go, this.pos.z + (dz / d) * go, { speed: 1 });
      await ui.dialogue.play(timed(A.step));
    } else {
      this.setFree(true, false);
      await ui.dialogue.play(timed(A.stay));
      this.hurt(this.people.lukewarm);
    }
  }

  async leave() {
    const px = this.px;
    this.setFree(true, false);
    ui.dialogue.play(timed(A.leave));
    // Out by the front door, past Wallflower, without looking.
    this.attend(Math.PI);
    const door = RELAY.front;
    const side = this.pos.x < door.x ? 0.6 : -0.6;
    await this.pxWalk(door.x + side * 0.4, 2.2, 1.1);
    await this.pxWalk(door.x, -0.6, 1.1);
    sfx.doorSlide({ gain: 0.12, open: false });
    this.tween(px.b, { alpha: 0 }, 600);
    this.setLight(px.glow, { power: 0 });
    this.setLight(px.gaze, { power: 0 });
    px.w.on = false;
    await wait(this, 3200);
  }

  async finish() {
    await this.fx.fadeTo(1, 1800);
    sound.room.stop(1.5);
    nextPart(this, 'ambush');
  }

  // --- helpers --------------------------------------------------------------------------
  // Something to do with the hands, against a clock. Resolves true if done.
  // Under autoplay Wallflower walks over and does it.
  task(spot, ms) {
    const limit = ms * this.slack * (this.assist === 'auto' ? 1.6 : 1) * (AUTOPLAY && !PARAMS.has('idle') ? 3 : 1);
    return new Promise((resolve) => {
      let over = false;
      const end = (v) => { if (over) return; over = true; this.removeSpot(spot); resolve(v); };
      spot.use = () => end(true);
      this.time.delayedCall(limit, () => end(false));
      if (AUTOPLAY && !PARAMS.has('idle')) {
        (async () => {
          const dx = this.pos.x - spot.x;
          const dz = this.pos.z - spot.z;
          const d = Math.hypot(dx, dz) || 1;
          const tx = clamp(spot.x + (dx / d) * 0.9, -5.6, 5.6);
          const tz = clamp(spot.z + (dz / d) * 0.9, 0.4, 9.6);
          await this.walkPath(tx, tz, { speed: 1.3 });
          await this.lookAt({ x: spot.x, y: spot.y, z: spot.z }, 500);
          await wait(this, spot.hold * 1000 + 200);
          end(true);
        })();
      }
    });
  }

  // Move a person somewhere at a run.
  async move(p, x, z, speed = 1.5) {
    const d = Math.hypot(x - p.x, z - p.z);
    const ms = (d / speed) * 1000;
    const from = { x: p.x, z: p.z };
    const s = { t: 0 };
    await new Promise((resolve) => this.tweens.add({
      targets: s, t: 1, duration: Math.max(200, ms), ease: 'Sine.easeInOut',
      onUpdate: () => {
        p.x = lerp(from.x, x, s.t);
        p.z = lerp(from.z, z, s.t);
        p.b.x = p.x;
        p.b.z = p.z;
      },
      onComplete: resolve,
    }));
    if (d > 0.5) sfx.footstep({ kind: 'run', gain: 0.4 });
  }

  tween(target, props, ms) {
    return new Promise((resolve) => this.tweens.add({ targets: target, ...props, duration: ms, ease: 'Sine.easeInOut', onComplete: resolve }));
  }

  until(fn, ms) {
    return new Promise((resolve) => {
      const start = this.time.now;
      const ev = this.time.addEvent({
        delay: 100, loop: true,
        callback: () => { if (fn() || this.time.now - start > ms) { ev.remove(); resolve(); } },
      });
    });
  }

  tick(dt, t) {
    this.tickPx(dt, t);
    this.tickSeen(dt);
    this.choosing?.();
    // The edges of the picture tighten as she nearly sees you.
    this.fx.p.aberration = 0.45 + this.sus * 1.4;
    this.fx.p.vignette = 0.85 + this.sus * 0.15;
  }
}
