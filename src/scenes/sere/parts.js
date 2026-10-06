import { narrative } from '../../core/NarrativeState.js';
import { ui } from '../../ui/UI.js';

// Chapter Four's running order.

export const SERE_PARTS = ['annex'];

const OWN_SCENE = {
  annex: 'Annex',
};

export function serePart(part, data = {}) {
  return [OWN_SCENE[part], data];
}

export function startSere(scene, part, data) {
  scene.scene.start(...serePart(part, data));
}

export function nextSere(scene, part, data) {
  const i = SERE_PARTS.indexOf(part);
  if (i >= 0 && i < SERE_PARTS.length - 1) {
    startSere(scene, SERE_PARTS[i + 1], data);
  } else {
    ui.letterbox(false);
    narrative.setStage('ch4end');
    scene.scene.start('Title', { chapter: 4 });
  }
}
