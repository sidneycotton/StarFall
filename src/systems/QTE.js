import { VIEW_W, VIEW_H } from '../config.js';
import { input } from './Input.js';
import { bus } from '../core/EventBus.js';
import { settings } from '../core/Settings.js';
import { ui } from '../ui/UI.js';
import * as sfx from '../audio/sfx.js';

// Timed prompts. Four kinds:
//   press  — a ring closes on a mark; press as it lands.
//   hold   — keep the button down until the arc fills.
//   mash   — press repeatedly to fill a meter that drains.
//   rigged — looks like hold or mash; it cannot be completed. The Record
//            already knows how this ends; the prompt is a witness's account.
//
// Runs on the scene's update event with the real frame delta, so slow motion
// never stretches a window. The "Timed prompts" setting widens windows
// (Relaxed: mash becomes hold) or completes prompts for the player (Automatic).
// Resolves 'success' or 'fail'.

const RING = '<svg viewBox="0 0 100 100"><circle class="track" cx="50" cy="50" r="44"/><circle class="fill" cx="50" cy="50" r="44"/><circle class="closer" cx="50" cy="50" r="44"/></svg>';
const C = 2 * Math.PI * 44;

export function qte(scene, opts) {
  const assist = settings.get('assist') || 'standard';
  const relaxed = assist === 'relaxed';
  const auto = assist === 'auto';
  const o = {
    type: 'press', verb: 'action', label: '', x: VIEW_W / 2, y: VIEW_H * 0.62,
    lead: 900, window: 260, hold: 1400, presses: 12, limit: 4200, drain: 0.9, cap: 0.82,
    giveUp: 9000, ...opts,
  };
  let type = o.type;
  let shown = type === 'rigged' ? (o.looks || 'hold') : type;
  if (relaxed && shown === 'mash' && type !== 'rigged') { type = 'hold'; shown = 'hold'; o.hold = 1600; }
  if (relaxed) { o.window *= 1.8; o.lead *= 1.25; o.limit *= 1.5; o.drain *= 0.6; }

  const el = document.createElement('div');
  el.className = `qte ${shown}${o.verb === 'dodge' ? ' dodge' : ''}`;
  el.innerHTML = `${RING}<div class="k"></div><div class="l"></div>`;
  el.style.left = `${(o.x / VIEW_W) * 100}%`;
  el.style.top = `${(o.y / VIEW_H) * 100}%`;
  el.querySelector('.k').textContent = input.keyName(o.verb);
  el.querySelector('.l').textContent = o.label;
  ui.root.appendChild(el);
  const fill = el.querySelector('.fill');
  const closer = el.querySelector('.closer');
  fill.style.strokeDasharray = `${C}`;
  fill.style.strokeDashoffset = `${C}`;
  requestAnimationFrame(() => el.classList.add('on'));
  if (o.verb === 'dodge') ui.touch.setCombat(true); else ui.touch.setAction(true, o.label || 'Use');

  return new Promise((resolve) => {
    let t = 0;
    let progress = 0;
    let done = false;
    let pointerHeld = false;
    const held = () => pointerHeld || (o.verb === 'dodge' ? input.dodgeHeld : input.actionHeld);

    const finish = (result) => {
      if (done) return;
      done = true;
      scene.events.off('update', tick);
      releaseAction();
      bus.off('input:dodge', onDodge);
      window.removeEventListener('pointerup', onUp);
      el.classList.add(result === 'success' ? 'ok' : 'fail');
      if (result === 'success') sfx.qteOk(); else if (type !== 'rigged') sfx.qteFail();
      ui.touch.setAction(false);
      if (o.verb === 'dodge' && !o.keepCombat) ui.touch.setCombat(false);
      setTimeout(() => el.remove(), 700);
      resolve(result);
    };

    const press = () => {
      if (done) return;
      el.classList.remove('pulse');
      void el.offsetWidth;
      el.classList.add('pulse');
      if (type === 'press') {
        // Early presses before the ring is even close are ignored, not punished.
        const toMark = o.lead - t;
        if (toMark > o.window * 2.2) return;
        finish(Math.abs(toMark) <= o.window ? 'success' : 'fail');
      } else if (type === 'mash') {
        progress = Math.min(1, progress + 1 / o.presses);
        sfx.qteTick({ p: progress });
      } else if (type === 'rigged' && shown === 'mash') {
        progress = Math.min(o.cap, progress + 1 / o.presses);
        sfx.qteTick({ p: progress });
      }
    };
    const releaseAction = o.verb === 'action' ? input.pushActionHandler(press) : () => {};
    const onDodge = () => { if (o.verb === 'dodge') press(); };
    bus.on('input:dodge', onDodge);
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); pointerHeld = true; press(); });
    const onUp = () => { pointerHeld = false; };
    window.addEventListener('pointerup', onUp);

    const tick = (_time, delta) => {
      if (done) return;
      const dt = Math.min(delta, 50);
      t += dt;
      if (type === 'press') {
        // The closing ring: from 2.1× down to the mark.
        const k = Math.max(0, 1 - t / o.lead);
        closer.style.transform = `scale(${1 + k * 1.1})`;
        closer.style.opacity = String(Math.min(1, t / 200));
        el.classList.toggle('hot', Math.abs(o.lead - t) <= o.window);
        if (auto && t >= o.lead - 40) finish('success');
        if (t > o.lead + o.window) finish('fail');
      } else if (type === 'hold' || (type === 'rigged' && shown === 'hold')) {
        const h = held() || auto;
        el.classList.toggle('held', h);
        const cap = type === 'rigged' ? o.cap : 1;
        if (h) progress = Math.min(cap, progress + dt / o.hold);
        else progress = Math.max(0, progress - dt / (o.hold * 1.6));
        if (type === 'rigged' && progress >= cap) {
          // It stalls. The arc shudders and drains no matter what.
          o.stall = (o.stall || 0) + dt;
          el.classList.add('stall');
          if (o.stall > (o.stallMs || 1600)) finish('fail');
        } else if (progress >= 1) finish('success');
        if (h && Math.floor((t - dt) / 160) !== Math.floor(t / 160)) sfx.qteTick({ p: progress, soft: true });
      } else if (type === 'mash' || (type === 'rigged' && shown === 'mash')) {
        if (auto) for (let k = Math.floor(t / 95) - Math.floor((t - dt) / 95); k > 0; k--) press();
        // Drain is in presses per second (0.9 → about 3/s to break even), so it
        // stays fair whatever the press count.
        progress = Math.max(0, progress - (dt / 1000) * o.drain * (3.4 / o.presses) * (type === 'rigged' ? 0.5 : 1) * (progress > 0.6 ? 1.12 : 1));
        if (type === 'mash' && progress >= 1) finish('success');
        if (type === 'rigged' && progress >= o.cap * 0.98) {
          el.classList.add('stall');
          o.stall = (o.stall || 0) + dt;
          if (o.stall > (o.stallMs || 1400)) finish('fail');
        }
        if (t > o.limit && type === 'mash') finish('fail');
        if (type === 'rigged' && t > o.limit) finish('fail');
      }
      if (type !== 'press') {
        fill.style.strokeDashoffset = String(C * (1 - progress));
        if (t > o.giveUp) finish('fail');
      }
      opts.onProgress?.(progress, t);
    };
    scene.events.on('update', tick);
  });
}
