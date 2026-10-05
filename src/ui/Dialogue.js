import { settings, TEXT_SPEED_CPS } from '../core/Settings.js';
import { narrative } from '../core/NarrativeState.js';
import { bus } from '../core/EventBus.js';
import { SPEAKERS } from '../data/speakers.js';
import { speakModulated } from '../audio/VoiceModulator.js';
import { input } from '../systems/Input.js';

// Reusable dialogue presenter. Lines are subtitles laid over the picture,
// never a visual-novel box. Characters fade in individually so line wrapping
// never shifts while text is typing.
//
// line: { id, speaker, text, auto?: ms, pause?: ms before, voice?: bool }
// play(lines) resolves when the last line has been dismissed.

// ?autoplay advances lines by itself (used for unattended playtests).
const AUTOPLAY = new URLSearchParams(window.location.search).has('autoplay');

const PUNCT_PAUSE = { '.': 320, ',': 140, '—': 260, '…': 380, '?': 320, '!': 300, ':': 200, ';': 200 };

export class Dialogue {
  constructor(root, clickTarget = root) {
    this.el = document.createElement('div');
    this.el.className = 'dlg';
    this.el.innerHTML = '<div class="dlg-speaker"><span class="sigil"></span><span class="name"></span></div><div class="dlg-text"></div><div class="dlg-next"></div>';
    root.appendChild(this.el);
    this.speakerEl = this.el.querySelector('.dlg-speaker');
    this.sigilEl = this.el.querySelector('.sigil');
    this.nameEl = this.el.querySelector('.name');
    this.textEl = this.el.querySelector('.dlg-text');
    this.active = false;
    this.history = [];
    this.fast = false;

    // Pointer anywhere on the picture advances while dialogue is up.
    clickTarget.addEventListener('pointerdown', (e) => {
      if (!this.active || e.target.closest('button')) return;
      this.fast = true;
      this.advance();
    });
    window.addEventListener('pointerup', () => { this.fast = false; });
    bus.on('input:actionUp', () => { this.fast = false; });
  }

  async play(lines) {
    for (const line of lines) {
      if (line.pause) await sleep(line.pause);
      await this.say(line);
    }
    this.hide();
  }

  say(line) {
    const sp = SPEAKERS[line.speaker] || SPEAKERS.self;
    this.active = true;
    this.typing = true;
    this.lineDone = null;
    narrative.markDialogue(line.id);
    this.history.push({ who: sp.name || '—', style: sp.style, text: line.text });
    bus.emit('dialogue:line', line);

    this.el.className = `dlg on ${sp.style}${line.auto ? ' auto' : ''}`;
    this.nameEl.textContent = sp.name;
    this.sigilEl.innerHTML = sp.sigil || '';
    this.sigilEl.style.display = sp.sigil ? '' : 'none';
    this.speakerEl.style.visibility = sp.name ? 'visible' : 'hidden';

    this.textEl.innerHTML = '';
    this.textEl.setAttribute('aria-label', line.text);
    const chars = [...line.text].map((ch) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = ch;
      this.textEl.appendChild(s);
      return s;
    });
    this.chars = chars;
    this.index = 0;
    this.pendingLine = line;

    const cps = TEXT_SPEED_CPS[settings.get('textSpeed')] || 48;
    const voiced = sp.voice === 'modulated' && line.voice !== false;
    if (voiced) {
      const duration = cps === Infinity ? Math.min(2.2, line.text.length / 20) : line.text.length / cps;
      this.stopVoice = speakModulated(line.text, { duration: Math.max(0.5, duration * 0.92), gain: line.voiceGain ?? 0.11 });
    }

    const releaseAction = input.pushActionHandler(() => this.advance());

    return new Promise((resolve) => {
      this.resolveLine = () => {
        releaseAction();
        resolve();
      };
      let last = performance.now();
      let acc = 0;
      const tick = (now) => {
        if (!this.typing) return;
        const dt = now - last;
        last = now;
        acc += dt * (this.fast ? 4 : 1);
        while (this.typing && this.index < chars.length) {
          // A beat after punctuation, so sentences breathe.
          const prev = chars[this.index - 1]?.textContent;
          const cost = cps === Infinity ? 0 : 1000 / cps + (PUNCT_PAUSE[prev] || 0);
          if (acc < cost) break;
          acc -= cost;
          chars[this.index].classList.add('v');
          this.index++;
        }
        if (this.index >= chars.length) {
          this.finishTyping(line);
        } else {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    });
  }

  finishTyping(line) {
    if (!this.typing) return;
    this.typing = false;
    this.chars.forEach((c) => c.classList.add('v'));
    this.el.classList.add('done');
    if (line?.auto || AUTOPLAY) {
      clearTimeout(this.autoTimer);
      this.autoTimer = setTimeout(() => this.complete(), line?.auto || 1400);
    }
    this.currentLine = line;
  }

  advance() {
    if (!this.active) return;
    if (this.typing) {
      this.finishTyping(this.pendingLine);
      return;
    }
    if (this.el.classList.contains('auto')) return;
    this.complete();
  }

  complete() {
    clearTimeout(this.autoTimer);
    this.stopVoice?.();
    this.stopVoice = null;
    const r = this.resolveLine;
    this.resolveLine = null;
    r?.();
  }

  hide() {
    this.active = false;
    this.el.classList.remove('on', 'done');
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
