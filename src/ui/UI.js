import { bus } from '../core/EventBus.js';
import { settings } from '../core/Settings.js';
import { VIEW_W, VIEW_H } from '../config.js';
import { Dialogue } from './Dialogue.js';
import { TouchControls } from './TouchControls.js';
import { Panels } from './Panels.js';
import { RecordOverlay } from './RecordOverlay.js';

// The DOM overlay. It tracks the canvas rectangle exactly, so anything placed
// in percentages lines up with the picture at any window size.

function el(parent, cls, html = '') {
  const d = document.createElement('div');
  d.className = cls;
  d.innerHTML = html;
  parent.appendChild(d);
  return d;
}

// Fullscreen for the whole page (canvas and DOM UI together). Where the API is
// missing (iPhone Safari) the button is simply not offered.
const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
const isFullscreen = () => Boolean(fsElement());
const canFullscreen = () => Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled);
function toggleFullscreen() {
  const root = document.documentElement;
  if (isFullscreen()) {
    (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    return;
  }
  const req = root.requestFullscreen || root.webkitRequestFullscreen;
  Promise.resolve(req?.call(root, { navigationUI: 'hide' }))
    .then(() => screen.orientation?.lock?.('landscape'))
    .catch(() => {});
}

class UIRoot {
  init(game) {
    this.game = game;
    this.root = document.getElementById('ui');
    this.stage = document.getElementById('stage');

    this.barTop = el(this.root, 'bar top');
    this.barBottom = el(this.root, 'bar bottom');
    this.hud = el(this.root, 'hud', '<div class="rim"></div><div class="arc"></div><div class="tick"></div>');
    this.captionEl = el(this.root, 'caption');
    this.barkEl = el(this.root, 'bark');
    this.nameCard = el(this.root, 'namecard', '<div class="n">Parallax</div><div class="rule"></div>');
    this.promptEl = el(this.root, 'prompt', '<div class="key interactive"></div><div class="label"></div>');
    this.promptKey = this.promptEl.querySelector('.key');
    this.promptLabel = this.promptEl.querySelector('.label');
    this.title = el(this.root, 'title', '<div class="word">STARFALL</div><div class="chapter">Chapter One</div><div class="sub">What Survives</div><div class="actions"><button class="next">Chapter Two</button><button class="again">Begin again</button></div>');
    this.hintEl = el(this.root, 'hint');
    this.chapterEl = el(this.root, 'chaptercard', '<div class="c"></div><div class="rule"></div><div class="s"></div>');
    this.paperEl = el(this.root, 'paper');

    this.dialogue = new Dialogue(this.root, this.stage);
    this.touch = new TouchControls(this.root);
    this.panels = new Panels(this.root, this.dialogue);
    this.record = new RecordOverlay(this.root, this.dialogue);
    el(document.body, 'rotate', 'Best experienced in landscape');

    this.promptKey.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.promptKey.setPointerCapture?.(e.pointerId);
      this.onPromptHold?.(true);
      this.onPromptTap?.();
    });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      this.promptKey.addEventListener(ev, () => this.onPromptHold?.(false));
    }
    this.title.querySelector('.again').addEventListener('click', () => bus.emit('game:restart', { chapter: this.titleChapter || 1 }));
    this.title.querySelector('.next').addEventListener('click', () => bus.emit('game:restart', { chapter: (this.titleChapter || 1) + 1 }));

    const sync = () => this.layout();
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', () => setTimeout(sync, 250));
    game.scale.on('resize', sync);
    this.applyMotionSetting();
    bus.on('settings:changed', () => this.applyMotionSetting());
    sync();
    setTimeout(sync, 100);
  }

  applyMotionSetting() {
    this.root.classList.toggle('reduce', settings.get('reduceMotion'));
  }

  layout() {
    const canvas = this.game.canvas;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const s = this.root.style;
    s.left = `${r.left}px`;
    s.top = `${r.top}px`;
    s.width = `${r.width}px`;
    s.height = `${r.height}px`;
    this.root.style.setProperty('--u', `${r.height / 100}px`);
    this.scale = r.width / VIEW_W;
  }

  // --- start screen --------------------------------------------------------
  showStart({ canContinue, checkpointLabel, onBegin, onContinue, chapters = [] }) {
    this.start = el(this.root, 'start interactive', `
      <div class="line"></div>
      <button class="begin">Begin</button>
      ${canContinue ? `<button class="continue">Continue · ${checkpointLabel}</button>` : ''}
      ${chapters.length ? `<div class="chapters">${chapters.map((c, i) => `<button data-i="${i}">${c.label}</button>`).join('<span>·</span>')}</div>` : ''}
      ${canFullscreen() ? '<button class="fullscreen"></button>' : ''}
      <div class="note">Headphones recommended.</div>`);
    const fs = this.start.querySelector('.fullscreen');
    if (fs) {
      const label = () => { fs.textContent = isFullscreen() ? 'Exit fullscreen' : 'Fullscreen'; };
      label();
      document.addEventListener('fullscreenchange', label);
      document.addEventListener('webkitfullscreenchange', label);
      fs.addEventListener('click', (e) => { e.stopPropagation(); toggleFullscreen(); });
    }
    this.start.querySelector('.begin').addEventListener('click', (e) => { e.stopPropagation(); onBegin(); });
    this.start.querySelector('.continue')?.addEventListener('click', (e) => { e.stopPropagation(); onContinue(); });
    this.start.querySelectorAll('.chapters button').forEach((b) => {
      b.addEventListener('click', (e) => { e.stopPropagation(); chapters[Number(b.dataset.i)].go(); });
    });
  }

  hideStart() {
    if (!this.start) return;
    const s = this.start;
    s.classList.add('gone');
    setTimeout(() => s.remove(), 1800);
    this.start = null;
  }

  // --- cinematic chrome ----------------------------------------------------
  letterbox(on) {
    this.root.classList.toggle('letterboxed', on);
  }

  caption(text, ms = 3500) {
    if (!settings.get('subtitles')) return;
    clearTimeout(this.captionTimer);
    this.captionEl.textContent = text;
    this.captionEl.classList.add('on');
    this.captionTimer = setTimeout(() => this.captionEl.classList.remove('on'), ms);
  }

  bark(text, { who = '', ms = 3200 } = {}) {
    clearTimeout(this.barkTimer);
    this.barkEl.innerHTML = `${who ? `<span class="who">${who}</span>` : ''}${text}`;
    this.barkEl.classList.add('on');
    this.barkTimer = setTimeout(() => this.barkEl.classList.remove('on'), ms);
  }

  // A quiet instruction near the bottom of the frame. Empty text hides it.
  hint(text, ms = 0) {
    clearTimeout(this.hintTimer);
    if (!text) { this.hintEl.classList.remove('on'); return; }
    this.hintEl.textContent = text;
    this.hintEl.classList.add('on');
    if (ms) this.hintTimer = setTimeout(() => this.hintEl.classList.remove('on'), ms);
  }

  // A handwritten page held up to the eye. The last line is the signature.
  paper(lines) {
    const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    this.paperEl.innerHTML = lines.map((t, i) => `<p class="${i === lines.length - 1 ? 'sig' : ''}">${esc(t)}</p>`).join('');
    this.paperEl.classList.add('on');
  }

  paperOff() {
    this.paperEl.classList.remove('on');
  }

  // "Chapter Two · The Starfall Record", centred over the picture.
  async chapterCard(chapter, sub, ms = 5200) {
    this.chapterEl.querySelector('.c').textContent = chapter;
    this.chapterEl.querySelector('.s').textContent = sub;
    this.chapterEl.classList.add('on');
    await new Promise((r) => setTimeout(r, ms));
    this.chapterEl.classList.remove('on');
    await new Promise((r) => setTimeout(r, 1600));
  }

  showHud(on, fear = false) {
    this.hud.classList.toggle('on', on);
    this.hud.classList.toggle('fear', fear);
  }

  showNameCard(ms = 4200) {
    this.nameCard.classList.add('on');
    setTimeout(() => this.nameCard.classList.remove('on'), ms);
  }

  // --- interaction prompt ---------------------------------------------------
  // x,y are canvas pixels in the 1600×900 design space.
  showPrompt(label, x, y, keyLabel) {
    this.promptLabel.textContent = label;
    this.promptKey.textContent = keyLabel;
    this.movePrompt(x, y);
    this.promptEl.classList.add('on');
  }

  movePrompt(x, y) {
    this.promptEl.style.left = `${(x / VIEW_W) * 100}%`;
    this.promptEl.style.top = `${(y / VIEW_H) * 100}%`;
  }

  hidePrompt() {
    this.promptEl.classList.remove('on');
  }

  // --- title -----------------------------------------------------------------
  setTitle(chapter, sub, n = 1, { next = true } = {}) {
    this.titleChapter = n;
    this.title.querySelector('.chapter').textContent = chapter;
    this.title.querySelector('.sub').textContent = sub;
    const btn = this.title.querySelector('.next');
    btn.style.display = next ? '' : 'none';
    if (next) btn.textContent = typeof next === 'string' ? next : 'Chapter Two';
  }

  titleStep(step) {
    if (step === 'word') this.title.classList.add('on');
    if (step === 'chapter') this.title.querySelector('.chapter').classList.add('on');
    if (step === 'sub') this.title.querySelector('.sub').classList.add('on');
    if (step === 'again') this.title.querySelector('.actions').classList.add('on');
  }

  resetTitle() {
    this.title.classList.remove('on');
    this.title.querySelectorAll('.on').forEach((e) => e.classList.remove('on'));
  }
}

export const ui = new UIRoot();
