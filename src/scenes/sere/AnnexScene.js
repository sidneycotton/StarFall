import Phaser from 'phaser';
import { narrative } from '../../core/NarrativeState.js';
import { nextSere } from './parts.js';

// 4.1 — The Annex. Placeholder while the room is built; it hands straight on.
export class AnnexScene extends Phaser.Scene {
  constructor() {
    super('Annex');
  }

  create() {
    narrative.setStage('annex');
    nextSere(this, 'annex');
  }
}
