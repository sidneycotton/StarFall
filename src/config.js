// Global constants. Everything is authored in a fixed 1600×900 "design space";
// Phaser's FIT scale mode letterboxes it, and the DOM UI layer is sized to match.

export const VIEW_W = 1600;
export const VIEW_H = 900;

// Floor line the characters walk on (feet y) inside penthouse-style scenes.
export const FLOOR_Y = 800;

// The three visual languages. Every colour in the game should trace back here.
export const PALETTE = {
  // SEER A — PROVIDENCE — The Aureate
  aureate: {
    ivory: '#f3ead6',
    gold: '#d9b46a',
    paleGold: '#ead9a8',
    deep: '#6b4e1f',
    shadow: '#2a1d0c',
  },
  // SEER B — CONTINUANCE — The Meridian
  meridian: {
    white: '#e6eaec',
    slate: '#5d6a73',
    cyan: '#8fb7bf',
    deep: '#24303a',
    shadow: '#0f151b',
  },
  // SEER C — RUIN — The Umbral
  umbral: {
    black: '#07050b',
    night: '#120b1c',
    purple: '#2a1640',
    violet: '#7b4bc4',
    ultraviolet: '#a77bff',
    magenta: '#a4307a',
    silver: '#a9a4b6',
  },
  emergency: {
    red: '#ff2a3a',
    deep: '#5c0710',
  },
};

// Narrative stages, in order. Used for checkpoints and debug jumps (?stage=run).
export const STAGES = [
  'boot', 'wake', 'explore', 'equip', 'call', 'aftermath', 'run', 'chamber', 'title', 'end',
  // Chapter Two — The Starfall Record: the vigil, the last tram, the span,
  // the sky over it. ('record' and 'duel' belong to retired scenes.)
  'vigil', 'record', 'duel', 'tram', 'span', 'sky', 'vigilEnd', 'ch2end',
  // Chapter Three — The Request: the crowd, the letter, the relay station,
  // the ambush, the broadcast.
  'crowd', 'bedsit', 'relay', 'ambush', 'mine', 'ch3end',
  // Chapter Four — Under the Sere.
  'annex', 'ch4end',
];

// Stages that leave a checkpoint behind, and which chapter each belongs to.
export const CHECKPOINTS = {
  wake: 1, call: 1, run: 1, chamber: 1,
  vigil: 2, tram: 2, span: 2, sky: 2,
  crowd: 3, bedsit: 3, relay: 3, ambush: 3, mine: 3,
  annex: 4,
};

export const IS_TOUCH = typeof window !== 'undefined'
  && (('ontouchstart' in window) || navigator.maxTouchPoints > 0);

// Chapter Four is being built: reachable only with ?stage=annex until it's ready.
export const CH4_READY = false;
