import { narrative } from '../../core/NarrativeState.js';
import { ui } from '../../ui/UI.js';

// Chapter Three's running order. Parts with a scene of their own play it;
// the rest still play as a script over black (RequestScene).

export const REQUEST_PARTS = ['crowd', 'bedsit', 'relay', 'ambush', 'mine'];

const OWN_SCENE = {
  crowd: 'Crowd',
  bedsit: 'Bedsit',
  relay: 'Relay',
  ambush: 'Ambush',
};

export function partStart(part, data = {}) {
  return OWN_SCENE[part] ? [OWN_SCENE[part], data] : ['Request', { ...data, part }];
}

export function startPart(scene, part, data) {
  const [key, d] = partStart(part, data);
  scene.scene.start(key, d);
}

// `data` is handed on to the next part (where Wallflower was standing, say).
export function nextPart(scene, part, data) {
  const i = REQUEST_PARTS.indexOf(part);
  if (i >= 0 && i < REQUEST_PARTS.length - 1) {
    startPart(scene, REQUEST_PARTS[i + 1], data);
  } else {
    ui.letterbox(false);
    narrative.setStage('ch3end');
    scene.scene.start('Title', { chapter: 3 });
  }
}
