import { bus } from '../core/EventBus.js';

// Unified input: keyboard, gamepad and the touch overlay all feed one model.
// Movement is an axis; "action" (interact / advance / strike) is routed to
// whichever handler is on top of a stack, so dialogue can temporarily own the
// button. "Dodge" is a second verb used only in combat; it is broadcast on the
// bus. Both buttons also expose a held state for hold-style prompts.

const ACTION_KEYS = { e: 1, enter: 1, ' ': 1, arrowup: 1, w: 1 };
const DODGE_KEYS = { shift: 1, k: 1, q: 1, arrowdown: 1, s: 1 };

class InputSystem {
  constructor() {
    this.keys = new Set();
    this.touchAxis = 0;
    this.padAxis = 0;
    // First-person walking (Chapter Three): W/S and the arrows walk instead of
    // acting, the left stick's y walks, the right stick looks.
    this.fpMode = false;
    this.touchFwd = 0;
    this.padFwd = 0;
    this.padLook = { x: 0, y: 0 };
    this.enabled = true;
    this.handlers = [];
    this.lastDevice = 'keyboard';
    this.padActionDown = false;
    this.padDodgeDown = false;
    // Held state per source, so releasing one device can't cancel another.
    this.held = { action: new Set(), dodge: new Set() };

    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.touchAxis = 0;
      this.touchFwd = 0;
      this.held.action.clear();
      this.held.dodge.clear();
    });
  }

  get actionHeld() { return this.held.action.size > 0; }
  get dodgeHeld() { return this.held.dodge.size > 0; }

  onKey(e, down) {
    const k = e.key.toLowerCase();
    const code = e.code;
    const walk = this.fpMode ? { w: 'fwd', arrowup: 'fwd', s: 'back', arrowdown: 'back' }[k] : null;
    const mapped = walk || {
      arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
    }[k] || (ACTION_KEYS[k] ? 'action' : null) || (DODGE_KEYS[k] ? 'dodge' : null);
    if (mapped || code === 'Space') e.preventDefault();
    this.lastDevice = 'keyboard';
    if (down && !e.repeat) {
      if (mapped === 'action') this.pressAction(`k:${k}`);
      if (mapped === 'dodge') this.pressDodge(`k:${k}`);
      if (k === 'escape') bus.emit('ui:toggleSettings');
      if (k === 'h' || k === 'l') bus.emit('ui:toggleLog');
      if (k === '1' || k === '2') bus.emit('input:choice', Number(k) - 1);
    }
    if (!down && mapped === 'action') this.releaseAction(`k:${k}`);
    if (!down && mapped === 'dodge') this.releaseDodge(`k:${k}`);
    if (mapped === 'left' || mapped === 'right' || mapped === 'fwd' || mapped === 'back') {
      if (down) this.keys.add(mapped); else this.keys.delete(mapped);
    }
  }

  // --- verbs (also called by the touch overlay) ------------------------------
  pressAction(src = 'touch') {
    this.held.action.add(src);
    this.fireAction();
  }

  releaseAction(src = 'touch') {
    this.held.action.delete(src);
    bus.emit('input:actionUp');
  }

  pressDodge(src = 'touch') {
    this.held.dodge.add(src);
    bus.emit('input:dodge');
  }

  releaseDodge(src = 'touch') {
    this.held.dodge.delete(src);
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
    if (!pad) { this.padAxis = 0; this.padFwd = 0; this.padLook = { x: 0, y: 0 }; return; }
    let ax = pad.axes[0] || 0;
    if (Math.abs(ax) < 0.2) ax = 0;
    const dz = (v) => (Math.abs(v || 0) < 0.2 ? 0 : v);
    let fy = -dz(pad.axes[1]);
    if (this.fpMode && pad.buttons[12]?.pressed) fy = 1;
    if (this.fpMode && pad.buttons[13]?.pressed) fy = -1;
    this.padFwd = fy;
    this.padLook = { x: dz(pad.axes[2]), y: dz(pad.axes[3]) };
    if (fy || this.padLook.x || this.padLook.y) this.lastDevice = 'gamepad';
    if (pad.buttons[14]?.pressed) ax = -1;
    if (pad.buttons[15]?.pressed) ax = 1;
    this.padAxis = ax;
    if (ax) this.lastDevice = 'gamepad';
    const act = pad.buttons[0]?.pressed;
    if (act && !this.padActionDown) { this.lastDevice = 'gamepad'; this.pressAction('pad'); }
    if (!act && this.padActionDown) this.releaseAction('pad');
    this.padActionDown = act;
    const dodge = pad.buttons[1]?.pressed || pad.buttons[5]?.pressed;
    if (dodge && !this.padDodgeDown) { this.lastDevice = 'gamepad'; this.pressDodge('pad'); }
    if (!dodge && this.padDodgeDown) this.releaseDodge('pad');
    this.padDodgeDown = dodge;
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

  // Walking, -1..1 (first person only).
  forward() {
    if (!this.enabled || !this.fpMode) return 0;
    let f = 0;
    if (this.keys.has('fwd')) f += 1;
    if (this.keys.has('back')) f -= 1;
    if (!f) f = this.padFwd || this.touchFwd;
    return Math.max(-1, Math.min(1, f));
  }

  // Human-readable name of a verb on the current device.
  keyName(verb) {
    const d = this.lastDevice;
    if (verb === 'dodge') return d === 'gamepad' ? 'B' : d === 'touch' ? 'Dodge' : 'Shift';
    return d === 'gamepad' ? 'A' : d === 'touch' ? 'Tap' : 'E';
  }
}

export const input = new InputSystem();
