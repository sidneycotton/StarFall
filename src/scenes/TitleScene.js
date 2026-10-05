import Phaser from 'phaser';
import { VIEW_W, VIEW_H } from '../config.js';
import { ui } from '../ui/UI.js';
import { narrative } from '../core/NarrativeState.js';
import { audio } from '../audio/AudioEngine.js';
import { titleMotif } from '../audio/Music.js';
import { ScreenFX } from '../fx/ScreenFX.js';
import { wait } from '../systems/Cutscene.js';

// Black. Silence. A single distant star falls and stretches into a line —
// the same thin vertical light as the visor. STARFALL.

const ADD = Phaser.BlendModes.ADD;

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(data = {}) {
    this.cameras.main.setBackgroundColor('#000000');
    this.fx = new ScreenFX(this);
    this.fx.set({ grain: 0.05, aberration: 0.4, vignette: 0.6 });
    ui.resetTitle();
    if (data.chapter === 2) {
      ui.setTitle('Chapter Two', 'The Starfall Record', 2, { next: false });
      narrative.completeChapterTwo();
    } else {
      ui.setTitle('Chapter One', 'What Survives', 1);
      narrative.completeRun();
    }
    this.run();
  }

  async run() {
    await wait(this, 2200);
    audio.restoreWorld(0.1);
    const cx = VIEW_W / 2;
    const halo = this.add.image(cx, 170, 'light_soft').setBlendMode(ADD).setTint(0xe8e0ff).setScale(0.18).setAlpha(0);
    const star = this.add.image(cx, 170, 'light_core').setBlendMode(ADD).setScale(0.09).setAlpha(0);
    this.tweens.add({ targets: [star], alpha: 1, duration: 2600, ease: 'Sine.easeIn' });
    this.tweens.add({ targets: [halo], alpha: 0.5, duration: 2600, ease: 'Sine.easeIn' });
    this.tweens.add({ targets: halo, scale: 0.22, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    await wait(this, 3600);

    // It falls, accelerating, and stretches into a thin vertical line.
    const line = this.add.image(cx, 170, 'light_drip').setOrigin(0.5, 1).setBlendMode(ADD).setTint(0xefe8ff).setAlpha(0).setScale(0.12, 0.01);
    line.setFlipY(true);
    const fall = { t: 0 };
    this.tweens.add({
      targets: fall, t: 1, duration: 2300, ease: 'Cubic.easeIn',
      onUpdate: () => {
        const y = 170 + fall.t * 420;
        star.y = y; halo.y = y;
        line.setPosition(cx, y).setAlpha(Math.min(1, fall.t * 3)).setScale(0.12, 0.02 + fall.t * 1.8);
      },
    });
    await wait(this, 2300);
    titleMotif();
    // The line settles into the frame's spine, then dims behind the title.
    const spine = this.add.image(cx, VIEW_H / 2, 'pixel').setDisplaySize(1.2, 0).setTint(0xefe8ff).setAlpha(0.9).setBlendMode(ADD);
    this.tweens.add({ targets: spine, displayHeight: VIEW_H * 0.9, duration: 1400, ease: 'Expo.easeOut' });
    this.tweens.add({ targets: [star, halo, line], alpha: 0, duration: 1200 });
    await wait(this, 900);
    this.tweens.add({ targets: spine, alpha: 0.0, duration: 5200, ease: 'Sine.easeInOut' });
    ui.titleStep('word');
    await wait(this, 4200);
    ui.titleStep('chapter');
    await wait(this, 1800);
    ui.titleStep('sub');
    await wait(this, 5200);
    ui.titleStep('again');
    ui.panels.showCorner(true);
  }
}
