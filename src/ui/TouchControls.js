import { input } from '../systems/Input.js';
import { IS_TOUCH } from '../config.js';

// Context-sensitive touch controls: a quiet pair of chevrons that only appear
// once the player has touched the screen and only while they can move.

const CHEVRON_L = '<svg viewBox="0 0 20 20"><polyline points="13,3 6,10 13,17"/></svg>';
const CHEVRON_R = '<svg viewBox="0 0 20 20"><polyline points="7,3 14,10 7,17"/></svg>';

export class TouchControls {
  constructor(root) {
    this.root = root;
    this.touchSeen = IS_TOUCH;
    this.wanted = false;

    this.pad = document.createElement('div');
    this.pad.className = 'pad';
    this.pad.innerHTML = `<button aria-label="Move left" data-dir="-1">${CHEVRON_L}</button><button aria-label="Move right" data-dir="1">${CHEVRON_R}</button>`;
    root.appendChild(this.pad);

    this.act = document.createElement('button');
    this.act.className = 'act';
    this.act.setAttribute('aria-label', 'Interact');
    this.act.textContent = 'Use';
    root.appendChild(this.act);

    // Combat only: a second, smaller button above the first.
    this.dodge = document.createElement('button');
    this.dodge.className = 'act dodge';
    this.dodge.setAttribute('aria-label', 'Dodge');
    this.dodge.textContent = 'Dodge';
    root.appendChild(this.dodge);

    const held = new Map();
    const update = () => {
      let a = 0;
      held.forEach((dir) => { a += dir; });
      input.touchAxis = Math.max(-1, Math.min(1, a));
    };
    this.pad.querySelectorAll('button').forEach((b) => {
      const dir = Number(b.dataset.dir);
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        b.setPointerCapture?.(e.pointerId);
        held.set(e.pointerId, dir);
        b.classList.add('held');
        input.lastDevice = 'touch';
        update();
      });
      const release = (e) => {
        held.delete(e.pointerId);
        b.classList.remove('held');
        update();
      };
      b.addEventListener('pointerup', release);
      b.addEventListener('pointercancel', release);
      b.addEventListener('lostpointercapture', release);
    });

    const hold = (btn, press, release) => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.setPointerCapture?.(e.pointerId);
        input.lastDevice = 'touch';
        press(`t:${e.pointerId}`);
      });
      const up = (e) => release(`t:${e.pointerId}`);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('lostpointercapture', up);
    };
    hold(this.act, (id) => input.pressAction(id), (id) => input.releaseAction(id));
    hold(this.dodge, (id) => input.pressDodge(id), (id) => input.releaseDodge(id));

    window.addEventListener('touchstart', () => {
      this.touchSeen = true;
      input.lastDevice = 'touch';
      document.getElementById('ui').classList.add('touch');
      this.refresh();
      if (this.combat) this.setCombat(true);
    }, { passive: true });
    if (IS_TOUCH) {
      document.getElementById('ui').classList.add('touch');
      input.lastDevice = 'touch';
    }
  }

  // Scenes call this when player control starts/stops.
  setMovement(on) {
    this.wanted = on;
    this.refresh();
  }

  setAction(on, label = 'Use') {
    this.act.textContent = label;
    this.act.classList.toggle('on', on && this.touchSeen);
  }

  // Strike + Dodge, for the duels.
  setCombat(on) {
    this.combat = on;
    this.setAction(on, on ? 'Strike' : 'Use');
    this.dodge.classList.toggle('on', on && this.touchSeen);
  }

  refresh() {
    this.pad.classList.toggle('on', this.wanted && this.touchSeen);
    if (!this.wanted) input.touchAxis = 0;
  }
}
