import { bus } from '../core/EventBus.js';

// Unified input: keyboard, gamepad and the touch overlay all feed one model.
// Movement is an axis; "action" (interact / advance) is routed to whichever
// handler is on top of a stack, so dialogue can temporarily own the button.

class InputSystem {
  constructor() {
    this.keys = new Set();
    this.touchAxis = 0;
    this.padAxis = 0;
    this.enabled = true;
    this.handlers = [];
    this.lastDevice = 'keyboard';
    this.padActionDown = false;

    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
    window.addEventListener('blur', () => { this.keys.clear(); this.touchAxis = 0; });
  }

  onKey(e, down) {
    const k = e.key.toLowerCase();
    const code = e.code;
    const mapped = {
      arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
      e: 'action', enter: 'action', ' ': 'action', arrowup: 'action', w: 'action',
    }[k];
    if (mapped || code === 'Space') e.preventDefault();
    this.lastDevice = 'keyboard';
    if (down && !e.repeat) {
      if (mapped === 'action') this.fireAction();
      if (k === 'escape') bus.emit('ui:toggleSettings');
      if (k === 'h' || k === 'l') bus.emit('ui:toggleLog');
    }
    if (!down && mapped === 'action') bus.emit('input:actionUp');
    if (mapped === 'left' || mapped === 'right') {
      if (down) this.keys.add(mapped); else this.keys.delete(mapped);
    }
  }

  fireAction() {
    const top = this.handlers[this.handlers.length - 1];
    if (top) top();
  }

  // Returns a release function. The most recent handler wins.
  pushActionHandler(fn) {
    this.handlers.push(fn);
    return () => {
      const i = this.handlers.lastIndexOf(fn);
      if (i >= 0) this.handlers.splice(i, 1);
    };
  }

  pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = pads && [...pads].find((p) => p && p.connected);
    if (!pad) { this.padAxis = 0; return; }
    let ax = pad.axes[0] || 0;
    if (Math.abs(ax) < 0.2) ax = 0;
    if (pad.buttons[14]?.pressed) ax = -1;
    if (pad.buttons[15]?.pressed) ax = 1;
    this.padAxis = ax;
    if (ax) this.lastDevice = 'gamepad';
    const act = pad.buttons[0]?.pressed;
    if (act && !this.padActionDown) { this.lastDevice = 'gamepad'; this.fireAction(); }
    if (!act && this.padActionDown) bus.emit('input:actionUp');
    this.padActionDown = act;
    const start = pad.buttons[9]?.pressed;
    if (start && !this.padStartDown) bus.emit('ui:toggleSettings');
    this.padStartDown = start;
  }

  // -1..1; zero when input is disabled (cutscenes).
  axis() {
    this.pollGamepad();
    if (!this.enabled) return 0;
    let a = 0;
    if (this.keys.has('left')) a -= 1;
    if (this.keys.has('right')) a += 1;
    if (!a) a = this.padAxis || this.touchAxis;
    return Math.max(-1, Math.min(1, a));
  }
}

export const input = new InputSystem();
