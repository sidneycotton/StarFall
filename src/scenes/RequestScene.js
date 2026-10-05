import Phaser from 'phaser';
import { ui } from '../ui/UI.js';
import { narrative } from '../core/NarrativeState.js';
import { wait } from '../systems/Cutscene.js';
import { input } from '../systems/Input.js';
import { ScreenFX } from '../fx/ScreenFX.js';
import { REQUEST } from '../data/request.js';

// Chapter Three — The Request, as a running order. Each part plays its script
// over black so the whole chapter can be walked end to end; the parts are
// replaced one by one with their own scenes as they are built.

const PARAMS = new URLSearchParams(window.location.search);
const AUTOPLAY = PARAMS.has('autoplay');

export const REQUEST_PARTS = ['crowd', 'bedsit', 'relay', 'ambush', 'mine'];

export class RequestScene extends Phaser.Scene {
  constructor() {
    super('Request');
  }

  create(data = {}) {
    this.part = REQUEST_PARTS.includes(data.part) ? data.part : 'crowd';
    this.cameras.main.setBackgroundColor('#000000');
    this.fx = new ScreenFX(this);
    this.fx.set({ grain: 0.06, vignette: 0.7 });
    narrative.setStage(this.part);
    ui.letterbox(true);
    this[this.part]().then(() => this.next());
  }

  next() {
    const i = REQUEST_PARTS.indexOf(this.part);
    if (i < REQUEST_PARTS.length - 1) this.scene.start('Request', { part: REQUEST_PARTS[i + 1] });
    else {
      ui.letterbox(false);
      narrative.setStage('ch3end');
      this.scene.start('Title', { chapter: 3 });
    }
  }

  async place(text) {
    await ui.chapterCard(text, '', 2600);
  }

  async crowd() {
    const c = REQUEST.crowd;
    await ui.chapterCard(REQUEST.title.chapter, REQUEST.title.sub, 4200);
    await this.place(c.place);
    await ui.dialogue.play(c.open);
    await ui.dialogue.play(c.stillLearned);
    await ui.dialogue.play(c.quake);
    await ui.dialogue.play(c.child.lines);
    for (const k of ['paperweight', 'lukewarm', 'dowser', 'humdrum']) await ui.dialogue.play(c.others[k]);
    await ui.dialogue.play(c.after);
    ui.caption(c.screen, 3000);
    await wait(this, 3200);
  }

  async bedsit() {
    const b = REQUEST.bedsit;
    await this.place(b.place);
    await ui.dialogue.play(b.open);
    for (const item of Object.values(b.items)) await ui.dialogue.play(item.lines);
    await ui.dialogue.play(b.letter.text.map((text, i) => ({ id: `rq_lt${i}`, speaker: 'wallflowerThought', text })));
    await ui.dialogue.play(b.letter.after);
  }

  async relay() {
    const r = REQUEST.relay;
    await this.place(r.place);
    await ui.dialogue.play(r.open);
    for (const a of r.arrivals) await ui.dialogue.play(a);
    await ui.dialogue.play(r.introductions);
    const counted = await this.choose(r.countHint, null, 'Step', null, 6000);
    narrative.setFlag('ch3Counted', counted === 'action');
    await ui.dialogue.play(counted === 'action' ? r.counted : r.notCounted);
    await ui.dialogue.play(r.small);
    await ui.dialogue.play(r.call);
  }

  async ambush() {
    const a = REQUEST.ambush;
    await ui.dialogue.play(a.lights);
    await ui.dialogue.play(a.arrive);
    for (const k of ['humdrum', 'dowser', 'paperweight', 'lukewarm']) await ui.dialogue.play(a[k]);
    const c = await this.choose(
      a.choose(input.keyName('action'), input.keyName('dodge')), a.chooseTouch, 'Stay', 'Step', 9000,
    );
    const stepped = c === 'dodge';
    narrative.setFlag('ch3SteppedForward', stepped);
    await ui.dialogue.play(stepped ? a.step : a.stay);
    await ui.dialogue.play(a.leave);
  }

  async mine() {
    const m = REQUEST.mine;
    const stepped = narrative.flag('ch3SteppedForward');
    await this.place(m.place);
    await ui.dialogue.play(m.lodestar);
    await ui.dialogue.play(m.waiting);
    ui.caption(m.crawl, 4000);
    await wait(this, 4200);
    await ui.dialogue.play(m.broadcast);
    ui.caption(stepped ? m.fifthSeen : m.fifthBlank, 3000);
    await wait(this, 3200);
    await ui.dialogue.play(stepped ? m.closeSeen : m.close);
  }

  // Action, the second button, or nothing at all (which counts as action).
  choose(hint, hintTouch, actionLabel, dodgeLabel, timeout) {
    return new Promise((resolve) => {
      const touch = input.lastDevice === 'touch';
      ui.hint(touch && hintTouch ? hintTouch : hint);
      ui.touch.setAction(true, actionLabel);
      if (dodgeLabel) ui.touch.setDodge(true, dodgeLabel);
      let done = false;
      const release = input.pushActionHandler(() => fin('action'));
      const chk = () => { if (dodgeLabel && input.dodgeHeld) fin('dodge'); };
      const fin = (c) => {
        if (done) return;
        done = true;
        release();
        this.events.off('update', chk);
        ui.hint('');
        ui.touch.setAction(false);
        ui.touch.setDodge(false);
        resolve(c);
      };
      this.events.on('update', chk);
      this.time.delayedCall(timeout, () => fin(dodgeLabel ? 'action' : 'none'));
      if (AUTOPLAY) this.time.delayedCall(1600, () => fin(PARAMS.has('step') ? 'dodge' : 'action'));
    });
  }
}
