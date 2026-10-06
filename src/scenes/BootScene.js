import { CH4_READY } from '../config.js';
import Phaser from 'phaser';
import { ui } from '../ui/UI.js';
import { narrative } from '../core/NarrativeState.js';
import { audio } from '../audio/AudioEngine.js';
import { registerLights } from '../art/lights.js';
import { registerCity } from '../art/city.js';
import { registerKit } from '../art/kit.js';
import { registerBedroom } from '../art/bedroom.js';
import { registerLounge } from '../art/lounge.js';
import { registerParallax } from '../art/parallax.js';
import { registerSanctum } from '../art/sanctum.js';
import { registerSeers } from '../art/seers.js';
import { registerVision } from '../art/vision.js';
import { registerChamber } from '../art/chamber.js';
import { registerStar } from '../art/star.js';
import { registerBridge } from '../art/bridge.js';
import { registerVigil } from '../art/vigil.js';
import { registerTram } from '../art/tram.js';
import { registerSpan } from '../art/span.js';
import { registerFive } from '../art/five.js';
import { partStart, startPart } from './request/parts.js';
import { serePart, startSere } from './sere/parts.js';

// Paints every texture (there are no image files), waits for fonts, then
// shows a quiet start prompt — audio needs a user gesture before sound can come first.

const PAINTERS = [registerLights, registerCity, registerKit, registerBedroom, registerLounge, registerParallax, registerSanctum, registerSeers, registerVision, registerChamber, registerStar, registerBridge, registerVigil, registerTram, registerSpan, registerFive];

const START_SCENE = {
  wake: ['Penthouse', { start: 'wake' }],
  explore: ['Penthouse', { start: 'explore' }],
  call: ['SeerCall', {}],
  aftermath: ['Penthouse', { start: 'aftermath' }],
  run: ['Penthouse', { start: 'aftermath' }],
  chamber: ['Chamber', {}],
  title: ['Title', {}],
  vigil: ['Vigil', {}],
  sky: ['Sky', {}],
  vigilEnd: ['Vigil', { end: true }],
  title2: ['Title', { chapter: 2 }],
  tram: ['Tram', {}],
  span: ['Span', {}],
  // Saves from before the Record and the duel were retired.
  record: ['Tram', {}],
  duel: ['Tram', {}],
  crowd: partStart('crowd'),
  bedsit: partStart('bedsit'),
  relay: partStart('relay'),
  ambush: partStart('ambush'),
  mine: partStart('mine'),
  title3: ['Title', { chapter: 3 }],
  annex: serePart('annex'),
  title4: ['Title', { chapter: 4 }],
};

const CHAPTER_TWO = ['vigil', 'tram', 'span', 'sky', 'vigilEnd', 'title2', 'record', 'duel'];
const CHAPTER_THREE = ['crowd', 'bedsit', 'relay', 'ambush', 'mine', 'title3'];
const CHAPTER_FOUR = ['annex', 'title4'];

const CHECKPOINT_LABEL = {
  call: 'The Call', run: 'After', chamber: 'The Chamber',
  vigil: 'The Vigil', tram: 'Tram 6', span: 'The Centre Span', sky: 'The West Tower',
  record: 'Tram 6', duel: 'Tram 6',
  crowd: 'The Crowd', bedsit: 'The Letter', relay: 'Relay 9', ambush: 'Relay 9', mine: 'Vesper General', annex: 'The Annex',
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  async create() {
    this.cameras.main.setBackgroundColor('#000000');
    try {
      await Promise.race([
        Promise.all([
          document.fonts.load('300 40px "Cormorant Garamond"'),
          document.fonts.load('400 40px "Cormorant Garamond"'),
          document.fonts.load('italic 400 20px "Cormorant Garamond"'),
          document.fonts.load('300 20px Jost'),
          document.fonts.load('400 20px Jost'),
        ]),
        new Promise((r) => setTimeout(r, 2500)),
      ]);
    } catch { /* fonts are progressive enhancement */ }

    // Paint in small slices so the page stays responsive.
    for (const paint of PAINTERS) {
      paint(this);
      await new Promise((r) => requestAnimationFrame(r));
    }

    const params = new URLSearchParams(window.location.search);
    const debugStage = params.get('stage');
    if (debugStage && START_SCENE[debugStage]) {
      const go = () => {
        audio.unlock();
        narrative.beginNewRun();
        if (CHAPTER_TWO.includes(debugStage)) narrative.beginChapterTwo();
        if (CHAPTER_THREE.includes(debugStage)) narrative.beginChapterThree();
        if (CHAPTER_FOUR.includes(debugStage)) narrative.beginChapterFour();
        const [key, data] = START_SCENE[debugStage];
        this.scene.start(key, data);
      };
      if (params.has('auto')) { go(); return; }
      ui.showStart({ canContinue: false, onBegin: () => { ui.hideStart(); go(); } });
      return;
    }

    const cp = narrative.data.checkpoint;
    const flags = narrative.data.flags;
    const done = CHAPTER_FOUR.includes(cp) ? flags.ch4Completed
      : CHAPTER_THREE.includes(cp) ? flags.ch3Completed
      : CHAPTER_TWO.includes(cp) ? flags.ch2Completed : flags.completed;
    const canContinue = Boolean(cp && cp !== 'wake' && CHECKPOINT_LABEL[cp] && !done);
    const chapters = [
      { label: 'Chapter One', go: () => begin(() => this.scene.start('Penthouse', { start: 'wake' }), true) },
      { label: 'Chapter Two', go: () => begin(() => { narrative.beginChapterTwo(); this.scene.start('Vigil', {}); }, true) },
    ];
    // Chapter Three opens once Chapter Two has been seen through.
    if (flags.ch2Seen || flags.ch3Seen) {
      chapters.push({ label: 'Chapter Three', go: () => begin(() => { narrative.beginChapterThree(); startPart(this, 'crowd'); }, true) });
    }
    // Chapter Four, once Chapter Three has been seen through.
    if (CH4_READY && (flags.ch3Seen || flags.ch4Seen)) {
      chapters.push({ label: 'Chapter Four', go: () => begin(() => { narrative.beginChapterFour(); startSere(this, 'annex'); }, true) });
    }
    const begin = async (fn, fresh) => {
      await audio.unlock();
      if (fresh) narrative.beginNewRun();
      ui.hideStart();
      this.time.delayedCall(1200, fn);
    };
    ui.showStart({
      canContinue,
      chapters,
      checkpointLabel: CHECKPOINT_LABEL[cp],
      onBegin: async () => {
        await audio.unlock();
        narrative.beginNewRun();
        ui.hideStart();
        this.time.delayedCall(1400, () => this.scene.start('Penthouse', { start: 'wake' }));
      },
      onContinue: async () => {
        await audio.unlock();
        ui.hideStart();
        const [key, data] = START_SCENE[cp];
        this.time.delayedCall(900, () => this.scene.start(key, data));
      },
    });
  }
}
