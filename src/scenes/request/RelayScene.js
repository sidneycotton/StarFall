import { Room, AUTOPLAY } from '../../fp/Room.js';
import { ui } from '../../ui/UI.js';
import { narrative } from '../../core/NarrativeState.js';
import { settings } from '../../core/Settings.js';
import { input } from '../../systems/Input.js';
import { wait } from '../../systems/Cutscene.js';
import * as sfx from '../../audio/sfx.js';
import { sound } from '../../audio/soundscape.js';
import { REQUEST } from '../../data/request.js';
import { buildRelay, RELAY } from './relay.js';
import { person, walk, show } from './people.js';
import { nextPart } from './parts.js';

// 3.3 — Relay 9 at dusk. Wallflower gets there first and stands by the door
// to see who comes. Four strangers come in past them, one close enough to
// touch, and introduce themselves to each other. To be counted, Wallflower
// has to move.
//
// The lamps are on. They won't be for long.

const PARAMS = new URLSearchParams(window.location.search);
const R = REQUEST.relay;
const timed = (lines) => lines.map((l) => (l.auto ? l : { ...l, auto: Math.max(1700, l.text.length * 58 + 1200) }));

// Where each of them is when the lights go (the ambush starts from here).
const END = {
  humdrum: [0.6, 5.5],
  dowser: [2.8, 8.4],
  paperweight: [-3.4, 6.1],
  lukewarm: [3.9, 5.7],
};
// Just outside the front door, and the way in (round whoever is by the door).
const OUT = [RELAY.front.x + 0.15, -1.6];
const IN = [[RELAY.front.x + 0.25, 0.3], [RELAY.front.x + 0.95, 1.5]];

export class RelayScene extends Room {
  constructor() {
    super('Relay');
  }

  create() {
    narrative.setStage('relay');
    ui.letterbox(false);
    this.setupRoom({
      start: { x: RELAY.byDoor.x, z: RELAY.byDoor.z, yaw: 0.55, pitch: -0.03 },
      fog: 0x0a0708, fogDist: 18, ambient: 0.2,
      fx: { grain: 0.08, vignette: 0.75, aberration: 0.35, desat: 0.08 },
    });
    this.walkTalk = true;
    this.relay = buildRelay(this);
    this.assist = settings.get('assist');
    this.setLight(this.relay.duskLight, { power: 1.1, radius: 9 });

    this.people = {};
    for (const id of ['dowser', 'paperweight', 'humdrum', 'lukewarm']) {
      this.people[id] = person(this, id, OUT[0], OUT[1], { visible: false });
    }

    // The side office has a door that sticks.
    const { side } = RELAY;
    const L = -RELAY.W;
    this.officeDoor = this.face([[L + 0.01, 0, side.z - 0.55], [L + 0.01, 0, side.z + 0.55], [L + 0.01, 2.15, side.z + 0.55], [L + 0.01, 2.15, side.z - 0.55]], { fill: 0x3a2a20, shade: 0.85 });
    // A moth round the second lamp.
    const z = RELAY.lamps[1];
    this.moth = { x: -0.4, y: 2.5, z, t: 0, pinned: false };
    this.mothPoly = this.v.poly(this.mothPts(), { fill: 0xd8c8a8, layer: 'outside' });

    window.__relay = this;
    this.events.once('shutdown', () => {
      if (window.__relay === this) delete window.__relay;
      sound.room.stop(1);
      ui.hint('');
    });
    this.run().then(() => this.finish());
  }

  mothPts() {
    const m = this.moth;
    const flap = m.pinned ? 0.03 : 0.03 + Math.abs(Math.sin(m.t * 22)) * 0.035;
    return [[m.x - flap, m.y, m.z], [m.x, m.y + 0.02, m.z], [m.x + flap, m.y, m.z], [m.x, m.y - 0.02, m.z]];
  }

  tick(dt) {
    const m = this.moth;
    if (!m.pinned) {
      m.t += dt;
      m.x = -0.1 + Math.sin(m.t * 1.7) * 0.45 + Math.sin(m.t * 5.3) * 0.06;
      m.y = 2.55 + Math.sin(m.t * 2.3) * 0.12;
      m.z = RELAY.lamps[1] + Math.cos(m.t * 1.3) * 0.35;
    }
    this.mothPoly.points = this.mothPts();
  }

  async arrive(id, to, lines, { pass = false } = {}) {
    const p = this.people[id];
    sfx.doorSlide({ gain: 0.14 });
    p.b.visible = true;
    p.x = OUT[0]; p.z = OUT[1];
    p.b.x = p.x; p.b.z = p.z;
    const going = walk(this, p, [...IN, to], 1.1);
    if (lines) await wait(this, 900).then(() => ui.dialogue.play(timed(lines)));
    if (pass && Math.hypot(this.pos.x - RELAY.byDoor.x, this.pos.z - RELAY.byDoor.z) < 1) {
      await ui.dialogue.play(R.passing);
    }
    await going;
  }

  async run() {
    sound.room.start({ gain: 0.35, fadeIn: 3 });
    await ui.chapterCard(R.place, '', 2600);
    await this.fx.fadeTo(0, 2000);
    this.setFree(true, true);
    await ui.dialogue.play(R.open);
    await wait(this, 2600);

    // One by one, through the door you are standing beside.
    const P = this.people;
    await this.arrive('dowser', [1.4, 3.2], R.arrivals[0], { pass: true });
    walk(this, P.dowser, [[2.6, 4.2]], 0.8);
    await wait(this, 2800);
    await this.arrive('paperweight', [-1.6, 3.1], R.arrivals[1].slice(0, 1));
    await ui.dialogue.play(timed(R.arrivals[1].slice(1)));
    await wait(this, 2400);
    const h = this.arrive('humdrum', [0.3, 5.4], null);
    await wait(this, 700);
    const l = this.arrive('lukewarm', [-0.9, 5.2], null);
    sfx.chairFall?.({ gain: 0.06 });
    await ui.dialogue.play(timed(R.arrivals[2]));
    await Promise.all([h, l]);

    // Names, to each other.
    await ui.dialogue.play(timed(R.introductions));
    const counted = await this.count();
    narrative.setFlag('ch3Counted', counted);
    await ui.dialogue.play(timed(counted ? R.counted : R.notCounted));
    await wait(this, 1600);

    // What they do with their hands while they wait.
    await this.waiting();

    // The call.
    walk(this, P.dowser, [END.dowser], 0.9);
    await ui.dialogue.play(timed(R.call.slice(0, 1)));
    sfx.ringback({ rings: 2 });
    await wait(this, 5200);
    await ui.dialogue.play(timed(R.call.slice(1)));
    await wait(this, 900);
  }

  // Stand there and you are not one of them. Walk over and you are.
  count() {
    const from = { x: this.pos.x, z: this.pos.z };
    const touch = input.lastDevice === 'touch';
    ui.hint(touch ? R.countHintTouch : R.countHint);
    const limit = this.assist === 'relaxed' ? 16000 : 11000;
    return new Promise((resolve) => {
      let done = false;
      const end = (v) => {
        if (done) return;
        done = true;
        ev.remove();
        ui.hint('');
        resolve(v);
      };
      const ev = this.time.addEvent({
        delay: 100, loop: true,
        callback: () => {
          if (Math.hypot(this.pos.x - from.x, this.pos.z - from.z) > 1.1) end(true);
        },
      });
      this.time.delayedCall(limit, () => end(false));
      if (AUTOPLAY && !PARAMS.has('uncounted')) {
        this.time.delayedCall(1500, () => this.walkPath(-2.4, 3.4, { speed: 1.2 }));
      }
    });
  }

  async waiting() {
    const P = this.people;
    const { side } = RELAY;
    // Lukewarm goes to the kettle.
    this.glance(-4.6, 1.1, 9.4);
    await walk(this, P.lukewarm, [[-3.2, 7.6], [-4.4, 8.9]], 1);
    show(this, P.lukewarm, 'f_lukewarm_back');
    await wait(this, 1400);
    for (const q of this.relay.kettle.polys) q.base = 0xb8d0e0;
    this.lightDirty = true;
    sfx.glassClink({ pitch: 0.4, gain: 0.08 });
    await ui.dialogue.play(timed(R.small.slice(0, 1)));
    walk(this, P.lukewarm, [[-2.0, 7.4], END.lukewarm], 0.9);

    // Paperweight and the moth.
    this.glance(this.moth.x, this.moth.y, this.moth.z);
    walk(this, P.paperweight, [[-1.0, 3.6]], 0.8);
    await wait(this, 1800);
    this.moth.pinned = true;
    sfx.tell({ ms: 300 });
    await ui.dialogue.play(timed(R.small.slice(1, 2)));
    walk(this, P.paperweight, [END.paperweight], 0.8);

    // Humdrum and the office door.
    this.glance(side.x, 1.2, side.z);
    await walk(this, P.humdrum, [[-2.4, 5.8], [side.x + 0.7, side.z]], 1);
    show(this, P.humdrum, 'f_humdrum_back');
    await ui.dialogue.play(timed(R.small.slice(2, 3)));
    sfx.bell({ freq: 110, gain: 0.05, decay: 1.6, hall: 0.3 });
    await wait(this, 1500);
    this.officeDoor.visible = false;
    sfx.doorSlide({ gain: 0.1 });
    await wait(this, 800);
    walk(this, P.humdrum, [[-2.0, 5.9], END.humdrum], 0.9);
    this.moth.pinned = false;

    // Dowser, at the back door.
    this.glance(4, 1.4, 9.4);
    await walk(this, P.dowser, [[3.6, 7.2], [4, 9.1]], 0.9);
    show(this, P.dowser, 'f_dowser_back');
    await wait(this, 1200);
    await ui.dialogue.play(timed(R.small.slice(3)));
    await wait(this, 1200);
  }

  // Test runs look where the thing is happening; players look for themselves.
  glance(x, y, z) {
    if (AUTOPLAY) this.lookAt({ x, y, z }, 1400);
  }

  async finish() {
    // Hard cut: the room is the same room, a minute later.
    this.fx.set({ fade: 1 });
    sound.room.stop(0.2);
    nextPart(this, 'relay', { x: this.pos.x, z: this.pos.z, yaw: this.base.yaw });
  }
}
