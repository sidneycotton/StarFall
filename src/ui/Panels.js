import { settings } from '../core/Settings.js';
import { bus } from '../core/EventBus.js';

// Settings and dialogue history. Out of the way until asked for.

const GEAR = '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3"/><circle cx="10" cy="10" r="7.5"/><line x1="10" y1="0.8" x2="10" y2="3"/><line x1="10" y1="17" x2="10" y2="19.2"/><line x1="0.8" y1="10" x2="3" y2="10"/><line x1="17" y1="10" x2="19.2" y2="10"/></svg>';
const LOG = '<svg viewBox="0 0 20 20"><line x1="4" y1="6" x2="16" y2="6"/><line x1="4" y1="10" x2="16" y2="10"/><line x1="4" y1="14" x2="11" y2="14"/></svg>';

function opts(key, choices) {
  return `<div class="opts" data-key="${key}">${choices.map(([v, label]) => `<button data-v="${v}">${label}</button>`).join('')}</div>`;
}

export class Panels {
  constructor(root, dialogue) {
    this.dialogue = dialogue;
    this.corner = document.createElement('div');
    this.corner.className = 'corner';
    this.corner.innerHTML = `<button class="b-log" aria-label="Dialogue history">${LOG}</button><button class="b-set" aria-label="Settings">${GEAR}</button>`;
    root.appendChild(this.corner);

    this.veil = document.createElement('div');
    this.veil.className = 'veil';
    root.appendChild(this.veil);

    this.corner.querySelector('.b-set').addEventListener('click', (e) => { e.stopPropagation(); this.toggle('settings'); });
    this.corner.querySelector('.b-log').addEventListener('click', (e) => { e.stopPropagation(); this.toggle('log'); });
    this.veil.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (e.target === this.veil) this.close();
    });
    bus.on('ui:toggleSettings', () => this.toggle('settings'));
    bus.on('ui:toggleLog', () => this.toggle('log'));
    this.open = null;
  }

  showCorner(on) {
    this.corner.classList.toggle('on', on);
  }

  toggle(which) {
    if (this.open === which) this.close();
    else this.show(which);
  }

  show(which) {
    this.open = which;
    this.veil.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = `panel ${which}`;
    panel.addEventListener('pointerdown', (e) => e.stopPropagation());
    if (which === 'settings') this.buildSettings(panel);
    else this.buildLog(panel);
    this.veil.appendChild(panel);
    requestAnimationFrame(() => this.veil.classList.add('on'));
    bus.emit('ui:paused', true);
  }

  close() {
    if (!this.open) return;
    this.open = null;
    this.veil.classList.remove('on');
    bus.emit('ui:paused', false);
  }

  buildSettings(panel) {
    const pct = (v) => Math.round(v * 100);
    panel.innerHTML = `
      <h2>Settings</h2>
      <div class="row"><span class="k">Captions</span>${opts('subtitles', [[true, 'On'], [false, 'Off']])}</div>
      <div class="row"><span class="k">Text speed</span>${opts('textSpeed', [['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast'], ['instant', 'Instant']])}</div>
      <div class="row"><span class="k">Timed prompts</span>${opts('assist', [['standard', 'Standard'], ['relaxed', 'Relaxed'], ['auto', 'Automatic']])}</div>
      <div class="row"><span class="k">Reduce motion</span>${opts('reduceMotion', [[true, 'On'], [false, 'Off']])}</div>
      <div class="row"><span class="k">Sound</span>${opts('muted', [[false, 'On'], [true, 'Muted']])}</div>
      <div class="row"><span class="k">Volume</span><input type="range" min="0" max="100" value="${pct(settings.get('master'))}" data-range="master" aria-label="Master volume"></div>
      <div class="row"><span class="k">Music</span><input type="range" min="0" max="100" value="${pct(settings.get('music'))}" data-range="music" aria-label="Music volume"></div>
      <div class="keys-help">Move · A D / ← →&nbsp;&nbsp;&nbsp;Interact · Strike · E / Space&nbsp;&nbsp;&nbsp;Dodge · Shift / K&nbsp;&nbsp;&nbsp;History · H&nbsp;&nbsp;&nbsp;Settings · Esc</div>
      <div class="foot"><button class="restart">Begin again</button><button class="resume">Resume</button></div>`;
    const sync = () => {
      panel.querySelectorAll('.opts').forEach((o) => {
        const key = o.dataset.key;
        o.querySelectorAll('button').forEach((b) => {
          b.classList.toggle('sel', String(settings.get(key)) === b.dataset.v);
        });
      });
    };
    panel.querySelectorAll('.opts button').forEach((b) => {
      b.addEventListener('click', () => {
        const key = b.parentElement.dataset.key;
        let v = b.dataset.v;
        if (v === 'true') v = true;
        if (v === 'false') v = false;
        settings.set(key, v);
        sync();
      });
    });
    panel.querySelectorAll('input[type=range]').forEach((r) => {
      r.addEventListener('input', () => settings.set(r.dataset.range, Number(r.value) / 100));
    });
    panel.querySelector('.resume').addEventListener('click', () => this.close());
    panel.querySelector('.restart').addEventListener('click', () => bus.emit('game:restart', { current: true }));
    sync();
  }

  buildLog(panel) {
    const items = this.dialogue.history.slice(-60);
    panel.classList.add('log');
    panel.innerHTML = `<h2>What was said</h2>${items.length ? items.map((h) => `<div class="entry ${h.style}"><span class="who">${h.who}</span><span class="what">${escapeHtml(h.text)}</span></div>`).join('') : '<div class="empty">Nothing yet.</div>'}`;
    requestAnimationFrame(() => { panel.scrollTop = panel.scrollHeight; });
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
