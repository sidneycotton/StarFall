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

// Paints every texture (there are no image files), waits for fonts, then
// shows a quiet start prompt — audio needs a user gesture before sound can come first.

const PAINTERS = [registerLights, registerCity, registerKit, registerBedroom, registerLounge, registerParallax, registerSanctum, registerSeers, registerVision, registerChamber];

const START_SCENE = {
  wake: ['Penthouse', { start: 'wake' }],
  explore: ['Penthouse', { start: 'explore' }],
  call: ['SeerCall', {}],
  aftermath: ['Penthouse', { start: 'aftermath' }],
  run: ['Penthouse', { start: 'aftermath' }],
  chamber: ['Chamber', {}],
  title: ['Title', {}],
};

const CHECKPOINT_LABEL = { call: 'The Call', run: 'After', chamber: 'The Chamber' };

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
        const [key, data] = START_SCENE[debugStage];
        this.scene.start(key, data);
      };
      if (params.has('auto')) { go(); return; }
      ui.showStart({ canContinue: false, onBegin: () => { ui.hideStart(); go(); } });
      return;
    }

    const cp = narrative.data.checkpoint;
    const canContinue = Boolean(cp && cp !== 'wake' && CHECKPOINT_LABEL[cp] && !narrative.data.flags.completed);
    ui.showStart({
      canContinue,
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
