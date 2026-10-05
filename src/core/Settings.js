import { bus } from './EventBus.js';
import { loadJSON, saveJSON } from './storage.js';

const KEY = 'starfall.settings.v1';

const DEFAULTS = {
  subtitles: true,
  textSpeed: 'normal', // slow | normal | fast | instant
  reduceMotion: false,
  master: 0.9,
  music: 0.8,
  muted: false,
};

export const TEXT_SPEED_CPS = { slow: 28, normal: 48, fast: 90, instant: Infinity };

class SettingsStore {
  constructor() {
    this.values = loadJSON(KEY, DEFAULTS);
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches && !this.values._touched) {
      this.values.reduceMotion = true;
    }
  }

  get(key) {
    return this.values[key];
  }

  set(key, value) {
    this.values[key] = value;
    this.values._touched = true;
    saveJSON(KEY, this.values);
    bus.emit('settings:changed', { key, value });
  }
}

export const settings = new SettingsStore();
