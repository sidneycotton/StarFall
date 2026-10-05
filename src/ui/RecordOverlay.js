import { bus } from '../core/EventBus.js';
import { input } from '../systems/Input.js';
import { settings } from '../core/Settings.js';

// The Starfall Record's chrome: the civic archive's frame laid over footage.
// Timecode, the source of the current shot, witness annotations, gaps where no
// camera survived, and the moments where sources disagree and the viewer
// must choose which account the reconstruction follows.

function el(parent, cls, html = '') {
  const d = document.createElement('div');
  d.className = cls;
  d.innerHTML = html;
  parent.appendChild(d);
  return d;
}

const pad = (n, w = 2) => String(Math.floor(n)).padStart(w, '0');

export class RecordOverlay {
  constructor(root, dialogue) {
    this.dialogue = dialogue;
    this.el = el(root, 'record', `
      <div class="scan"></div>
      <div class="rc tl"><span class="mark">▣</span> THE STARFALL RECORD <span class="sep">·</span> VESPER CIVIC NETWORK</div>
      <div class="rc tr"><span class="rec">●</span> <span class="tc">23:31:40:00</span></div>
      <div class="rc bl"><span class="src"></span></div>
      <div class="rc br"><span class="count"></span></div>
      <div class="note"><div class="who"></div><div class="txt"></div></div>
      <div class="gap"><div class="g1"></div><div class="g2"></div></div>
      <div class="interf">SIGNAL INTERFERENCE</div>
      <div class="card"></div>
      <div class="choice"><div class="q"></div><div class="qs"></div><div class="opts"></div><div class="help"></div></div>`);
    this.tcEl = this.el.querySelector('.tc');
    this.srcEl = this.el.querySelector('.src');
    this.countEl = this.el.querySelector('.count');
    this.noteEl = this.el.querySelector('.note');
    this.gapEl = this.el.querySelector('.gap');
    this.cardEl = this.el.querySelector('.card');
    this.choiceEl = this.el.querySelector('.choice');
    this.interfEl = this.el.querySelector('.interf');
    this.seconds = 0;
  }

  show(on = true) {
    this.el.classList.toggle('on', on);
  }

  // Seconds since midnight; frames are just for texture.
  setTime(h, m, s) {
    this.seconds = h * 3600 + m * 60 + s;
    this.renderTime(0);
  }

  advance(dt) {
    this.seconds += dt;
    this.renderTime(this.seconds % 1);
  }

  renderTime(frac) {
    const t = this.seconds;
    this.tcEl.textContent = `${pad(t / 3600)}:${pad((t / 60) % 60)}:${pad(t % 60)}:${pad(frac * 24)}`;
  }

  source(text, count = '') {
    this.srcEl.textContent = text;
    this.countEl.textContent = count;
    this.el.classList.remove('cut');
    void this.el.offsetWidth;
    this.el.classList.add('cut');
  }

  // A witness annotation. Logged so it can be reread in the history panel.
  note({ wit, text }, ms = 6500) {
    this.noteEl.querySelector('.who').textContent = wit;
    this.noteEl.querySelector('.txt').textContent = `“${text}”`;
    this.noteEl.classList.add('on');
    this.dialogue.history.push({ who: wit, style: 'meridian', text });
    clearTimeout(this.noteTimer);
    const scaled = ms * ({ slow: 1.3, normal: 1, fast: 0.85, instant: 0.8 }[settings.get('textSpeed')] || 1);
    return new Promise((resolve) => {
      this.noteTimer = setTimeout(() => { this.noteEl.classList.remove('on'); resolve(); }, scaled);
    });
  }

  hideNote() {
    clearTimeout(this.noteTimer);
    this.noteEl.classList.remove('on');
  }

  // Full-frame black with archive text: "NO FOOTAGE", or the opening slate.
  gap(line1, line2 = '') {
    this.gapEl.querySelector('.g1').textContent = line1;
    this.gapEl.querySelector('.g2').textContent = line2;
    this.gapEl.classList.add('on');
  }

  hideGap() {
    this.gapEl.classList.remove('on');
  }

  // A centred title card (lines appear one after another).
  async card(lines, { hold = 2600, step = 1300 } = {}) {
    this.cardEl.innerHTML = lines.map((l) => `<div>${l}</div>`).join('');
    this.cardEl.classList.add('on');
    const rows = [...this.cardEl.children];
    for (const r of rows) {
      r.classList.add('v');
      await sleep(step);
    }
    await sleep(hold);
    this.cardEl.classList.remove('on');
    await sleep(900);
  }

  interference(on) {
    this.interfEl.classList.toggle('on', on);
    this.el.classList.toggle('glitch', on);
  }

  glitchPulse(ms = 220) {
    this.el.classList.add('glitch');
    clearTimeout(this.glitchTimer);
    this.glitchTimer = setTimeout(() => {
      if (!this.interfEl.classList.contains('on')) this.el.classList.remove('glitch');
    }, ms);
  }

  // Two accounts, side by side. Resolves with the chosen option.
  choose({ title, sub, a, b }) {
    this.choiceEl.querySelector('.q').textContent = title;
    this.choiceEl.querySelector('.qs').textContent = sub;
    const opts = this.choiceEl.querySelector('.opts');
    opts.innerHTML = '';
    const items = [a, b].map((o, i) => {
      const btn = document.createElement('button');
      btn.className = 'opt';
      btn.innerHTML = `<span class="n">${i + 1}</span><span class="w">${o.wit}</span><span class="t">“${o.text}”</span>`;
      opts.appendChild(btn);
      return btn;
    });
    const help = this.choiceEl.querySelector('.help');
    help.textContent = input.lastDevice === 'touch'
      ? 'Tap an account'
      : `◀ ▶ to compare · ${input.keyName('action')} to follow · or press 1 / 2`;
    this.choiceEl.classList.add('on');
    let sel = -1;
    const select = (i) => {
      sel = i;
      items.forEach((b2, j) => b2.classList.toggle('sel', j === i));
    };
    return new Promise((resolve) => {
      let lastAxis = 0;
      let raf = 0;
      const finish = (i) => {
        cancelAnimationFrame(raf);
        release();
        offChoice();
        items[i].classList.add('chosen');
        this.dialogue.history.push({ who: 'The Record', style: 'meridian', text: `Following ${[a, b][i].wit}.` });
        setTimeout(() => { this.choiceEl.classList.remove('on'); resolve([a, b][i]); }, 900);
      };
      items.forEach((btn, i) => {
        btn.addEventListener('pointerenter', () => select(i));
        btn.addEventListener('click', (e) => { e.stopPropagation(); finish(i); });
      });
      const release = input.pushActionHandler(() => { if (sel >= 0) finish(sel); else select(0); });
      const offChoice = bus.on('input:choice', (i) => finish(i));
      const poll = () => {
        const ax = input.axis();
        if (ax && Math.sign(ax) !== lastAxis) select(ax < 0 ? 0 : 1);
        lastAxis = Math.sign(ax);
        raf = requestAnimationFrame(poll);
      };
      raf = requestAnimationFrame(poll);
      // ?autoplay: unattended playtests pick the first account.
      if (new URLSearchParams(window.location.search).has('autoplay')) setTimeout(() => finish(0), 1800);
    });
  }

  reset() {
    this.hideNote();
    this.hideGap();
    this.interference(false);
    this.choiceEl.classList.remove('on');
    this.cardEl.classList.remove('on');
    this.show(false);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
