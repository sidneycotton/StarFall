import Phaser from 'phaser';
import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/jost/300.css';
import '@fontsource/jost/400.css';
import './ui/ui.css';

import { VIEW_W, VIEW_H } from './config.js';
import { CinematicPipeline } from './fx/CinematicPipeline.js';
import { ui } from './ui/UI.js';
import { bus } from './core/EventBus.js';
import { audio } from './audio/AudioEngine.js';
import { sound } from './audio/soundscape.js';
import { narrative } from './core/NarrativeState.js';
import { BootScene } from './scenes/BootScene.js';
import { PenthouseScene } from './scenes/PenthouseScene.js';
import { SeerCallScene } from './scenes/SeerCallScene.js';
import { ChamberScene } from './scenes/ChamberScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { VigilScene } from './scenes/VigilScene.js';
import { RecordScene } from './scenes/RecordScene.js';
import { SkyScene } from './scenes/SkyScene.js';
import { TramScene } from './scenes/TramScene.js';
import { SpanScene } from './scenes/SpanScene.js';

// STARFALL. Entry point: game config, the DOM UI layer and the
// few global behaviours (pause, restart) that sit above individual scenes.

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: VIEW_W,
  height: VIEW_H,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
    powerPreference: 'high-performance',
  },
  audio: { noAudio: true },
  input: { gamepad: false },
  pipeline: { CinematicPipeline },
  scene: [BootScene, PenthouseScene, SeerCallScene, ChamberScene, TitleScene, VigilScene, RecordScene, SkyScene, TramScene, SpanScene],
});

ui.init(game);

// Opening a panel pauses the story (scenes and sound), closing resumes it.
bus.on('ui:paused', (paused) => {
  game.scene.getScenes(true).forEach((s) => (paused ? s.scene.pause() : s.scene.resume()));
  if (audio.ctx) paused ? audio.ctx.suspend() : audio.ctx.resume();
});

bus.on('game:restart', (opts = {}) => {
  const chapter = opts.current ? narrative.chapter : (opts.chapter || 1);
  ui.panels.close();
  ui.dialogue.complete();
  ui.dialogue.hide();
  ui.resetTitle();
  ui.letterbox(false);
  ui.showHud(false);
  ui.hidePrompt();
  ui.hint('');
  ui.record.reset();
  sound.stopAll(0.3);
  narrative.beginNewRun();
  if (chapter >= 2) narrative.beginChapterTwo();
  game.scene.getScenes(false).forEach((s) => {
    if (s.scene.key === 'Boot' || !s.scene.isActive()) return;
    s.tweens.timeScale = 1;
    s.time.timeScale = 1;
    s.scene.stop();
  });
  if (audio.ctx) audio.ctx.resume();
  setTimeout(() => (chapter >= 2 ? game.scene.start('Vigil', {}) : game.scene.start('Penthouse', { start: 'wake' })), 400);
});

// Debug handle for automated playtesting (harmless in production).
window.__starfall = { game, narrative, sound, ui };
