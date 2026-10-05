import { bus } from './EventBus.js';
import { loadJSON, saveJSON } from './storage.js';
import { STAGES } from '../config.js';

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
  playthroughs: 0,
};

class NarrativeStateStore {
  constructor() {
    const saved = loadJSON(KEY, FRESH);
    this.data = { ...FRESH, ...saved, flags: { ...FRESH.flags, ...saved.flags } };
  }

  get stage() {
    return this.data.stage;
  }

  setStage(stage) {
    if (!STAGES.includes(stage)) throw new Error(`Unknown stage "${stage}"`);
    this.data.stage = stage;
    if (['wake', 'call', 'run', 'chamber'].includes(stage)) this.data.checkpoint = stage;
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
    };
    this.data = structuredClone(FRESH);
    this.data.playthroughs = keep.playthroughs;
    this.data.flags.everExaminedFigurine = Boolean(keep.everExaminedFigurine);
    this.persist();
  }

  completeRun() {
    this.data.flags.completed = true;
    this.data.playthroughs += 1;
    this.persist();
  }

  persist() {
    saveJSON(KEY, this.data);
  }
}

export const narrative = new NarrativeStateStore();
