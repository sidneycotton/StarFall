import { ui } from '../ui/UI.js';
import { input } from './Input.js';
import { narrative } from '../core/NarrativeState.js';

// Proximity interactions. Each interactable declares where it is, what the
// prompt says, and an async `run(ctx)` that can play dialogue, change world
// state, move the camera or play sound. While one runs, movement is locked.

export class Interactions {
  constructor(scene, player, camera) {
    this.scene = scene;
    this.player = player;
    this.camera = camera;
    this.items = [];
    this.current = null;
    this.busy = false;
    this.enabled = true;
    this.releaseAction = input.pushActionHandler(() => this.trigger());
    ui.onPromptTap = () => this.trigger();
    scene.events.once('shutdown', () => this.destroy());
  }

  add(item) {
    // item: { id, label, x, y (prompt anchor), range, run, once?, enabled?() }
    this.items.push({ range: 90, ...item });
    return item;
  }

  remove(id) {
    this.items = this.items.filter((i) => i.id !== id);
    if (this.current?.id === id) this.setCurrent(null);
  }

  setEnabled(on) {
    this.enabled = on;
    if (!on) this.setCurrent(null);
  }

  update() {
    if (!this.enabled || this.busy) {
      if (this.current) this.setCurrent(null);
      return;
    }
    const px = this.player.x;
    let best = null;
    let bestD = Infinity;
    this.items.forEach((it) => {
      if (it.enabled && !it.enabled()) return;
      const d = Math.abs(px - it.x);
      if (d < it.range && d < bestD) { best = it; bestD = d; }
    });
    if (best !== this.current) this.setCurrent(best);
    if (this.current) {
      const p = this.camera.toScreen(this.current.x, this.current.y);
      ui.movePrompt(p.x, p.y);
    }
  }

  setCurrent(item) {
    this.current = item;
    if (!item) {
      ui.hidePrompt();
      ui.touch.setAction(false);
      this.camera.setFocus(null);
      return;
    }
    const p = this.camera.toScreen(item.x, item.y);
    const key = input.lastDevice === 'gamepad' ? 'A' : (input.lastDevice === 'touch' ? '' : 'E');
    ui.showPrompt(item.label, p.x, p.y, key);
    ui.touch.setAction(true);
    // Let the composition lean gently toward what the player is near.
    this.camera.setFocus(item.focusX ?? item.x, 0.22);
  }

  async trigger() {
    if (!this.enabled || this.busy || !this.current) return;
    const item = this.current;
    this.busy = true;
    this.setCurrent(null);
    this.scene.events.emit('interaction:start', item);
    try {
      await item.run();
    } finally {
      narrative.markInspected(item.id);
      if (item.once) this.remove(item.id);
      this.busy = false;
      this.scene.events.emit('interaction:end', item);
    }
  }

  destroy() {
    this.releaseAction?.();
    ui.hidePrompt();
    ui.onPromptTap = null;
  }
}
