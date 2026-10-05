import { narrative } from '../../core/NarrativeState.js';
import { ui } from '../../ui/UI.js';

// Chapter Three's running order. Parts with a scene of their own play it;
// the rest still play as a script over black (RequestScene).

export const REQUEST_PARTS = ['crowd', 'bedsit', 'relay', 'ambush', 'mine'];

const OWN_SCENE = {
  ambush: 'Ambush',
};

export function partStart(part) {
  return OWN_SCENE[part] ? [OWN_SCENE[part], {}] : ['Request', { part }];
}

export function startPart(scene, part) {
  const [key, data] = partStart(part);
  scene.scene.start(key, data);
}

export function nextPart(scene, part) {
  const i = REQUEST_PARTS.indexOf(part);
  if (i >= 0 && i < REQUEST_PARTS.length - 1) {
    startPart(scene, REQUEST_PARTS[i + 1]);
  } else {
    ui.letterbox(false);
    narrative.setStage('ch3end');
    scene.scene.start('Title', { chapter: 3 });
  }
}
