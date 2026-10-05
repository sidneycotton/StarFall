import { bus } from './EventBus.js';
import { loadJSON, saveJSON } from './storage.js';
import { STAGES, CHECKPOINTS } from '../config.js';

// Single source of truth for story progress. Scenes read and write it; nothing
// else keeps narrative flags. Serialisable so the full game can grow a save system.

const KEY = 'starfall.narrative.v1';

const FRESH = {
  stage: 'boot',
  checkpoint: null,
  inspected: [],          // interactable ids the player has examined
  dialogueSeen: [],       // dialogue line ids that have been displayed
  lastDialogueId: null,   // most recent line, i.e. dialogue progress
  flags: {
    starFigurineExamined: false,
    sleeperCovered: false,
    sawStarProtocol: false,
    completed: false,
  },
  // Which accounts the player chose to believe when the Record's sources disagree.
  record: {},
  playthroughs: 0,
};

class NarrativeStateStore {
  constructor() {
    const saved = loadJSON(KEY, FRESH);
    this.data = { ...FRESH, ...saved, flags: { ...FRESH.flags, ...saved.flags }, record: { ...saved.record } };
  }

  get stage() {
    return this.data.stage;
  }

  setStage(stage) {
    if (!STAGES.includes(stage)) throw new Error(`Unknown stage "${stage}"`);
    this.data.stage = stage;
    if (CHECKPOINTS[stage]) this.data.checkpoint = stage;
    this.persist();
    bus.emit('narrative:stage', stage);
  }

  markInspected(id) {
    if (!this.data.inspected.includes(id)) this.data.inspected.push(id);
    this.persist();
  }

  hasInspected(id) {
    return this.data.inspected.includes(id);
  }

  markDialogue(id) {
    if (!id) return;
    this.data.lastDialogueId = id;
    if (!this.data.dialogueSeen.includes(id)) this.data.dialogueSeen.push(id);
    this.persist();
  }

  setFlag(name, value = true) {
    this.data.flags[name] = value;
    this.persist();
  }

  flag(name) {
    return Boolean(this.data.flags[name]);
  }

  // A new run keeps knowledge that should survive replays (playthrough count,
  // whether the figurine was ever seen) — the hooks a second playthrough needs.
  beginNewRun() {
    const keep = {
      playthroughs: this.data.playthroughs,
      everExaminedFigurine: this.data.flags.starFigurineExamined || this.data.flags.everExaminedFigurine,
      ch2Seen: this.data.flags.ch2Seen || 0,
      ch3Seen: this.data.flags.ch3Seen || 0,
    };
    this.data = structuredClone(FRESH);
    this.data.playthroughs = keep.playthroughs;
    this.data.flags.everExaminedFigurine = Boolean(keep.everExaminedFigurine);
    this.data.flags.ch2Seen = keep.ch2Seen;
    this.data.flags.ch3Seen = keep.ch3Seen;
    this.persist();
  }

  completeRun() {
    this.data.flags.completed = true;
    this.data.playthroughs += 1;
    this.data.checkpoint = null;
    this.persist();
  }

  // Chapter Two can be entered on its own; it keeps what Chapter One left behind.
  beginChapterTwo() {
    this.data.record = {};
    this.data.flags.ch2Completed = false;
    this.persist();
  }

  completeChapterTwo() {
    this.data.flags.ch2Completed = true;
    this.data.flags.ch2Seen = (this.data.flags.ch2Seen || 0) + 1;
    this.data.checkpoint = null;
    this.persist();
  }

  // Chapter Three: what Wallflower did at the relay station.
  beginChapterThree() {
    this.data.flags.ch3Completed = false;
    this.data.flags.ch3Counted = false;
    this.data.flags.ch3SteppedForward = false;
    this.persist();
  }

  completeChapterThree() {
    this.data.flags.ch3Completed = true;
    this.data.flags.ch3Seen = (this.data.flags.ch3Seen || 0) + 1;
    this.data.checkpoint = null;
    this.persist();
  }

  // The Record remembers which witness the player chose to believe.
  setRecord(key, value) {
    this.data.record[key] = value;
    this.persist();
  }

  record(key) {
    return this.data.record[key];
  }

  get chapter() {
    if (CHECKPOINTS[this.data.checkpoint]) return CHECKPOINTS[this.data.checkpoint];
    const i = STAGES.indexOf(this.data.stage);
    if (i >= STAGES.indexOf('crowd')) return 3;
    return i >= STAGES.indexOf('vigil') ? 2 : 1;
  }

  persist() {
    saveJSON(KEY, this.data);
  }
}

export const narrative = new NarrativeStateStore();
