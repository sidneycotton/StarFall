// Promise helpers that run on a scene's clock, so cinematics pause with the
// scene (settings panel) and are readable as straight-line async code.

export function wait(scene, ms) {
  return new Promise((resolve) => scene.time.delayedCall(ms, resolve));
}

export function tween(scene, config) {
  return new Promise((resolve) => {
    scene.tweens.add({ ...config, onComplete: (...args) => { config.onComplete?.(...args); resolve(); } });
  });
}

// Run several promises, resolve when all finish.
export const all = (...ps) => Promise.all(ps);

// Ease a numeric property on any object (used for audio-visual parameters).
export function ramp(scene, target, props, duration, ease = 'Sine.easeInOut') {
  return tween(scene, { targets: target, ...props, duration, ease });
}
