import Dexie, { type Table } from 'dexie';
import type { CardProgress } from '../models/vocab-card.model';

export class FlashcardDB extends Dexie {
  progress!: Table<CardProgress>;

  constructor() {
    super('mcc-flashcards');
    this.version(1).stores({
      progress: '++id, [hanzi+hskLevel], hskLevel, confidence, bookmarked',
    });
  }
}

export const db = new FlashcardDB();
