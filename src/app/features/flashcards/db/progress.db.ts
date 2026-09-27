import Dexie, { type Table } from 'dexie';
import type { CardProgress } from '../models/vocab-card.model';

export class FlashcardDB extends Dexie {
  progress!: Table<CardProgress>;

  constructor() {
    super('mcc-flashcards');
    this.version(1).stores({
      progress: '++id, [hanzi+hskLevel], hskLevel, confidence, bookmarked',
    });
    this.version(2).stores({
      progress: '++id, [hanzi+hskLevel], hskLevel, hskVersion, confidence, bookmarked',
    });
    // v3: thêm cardId để tách tiến độ của các từ cùng Hán tự nhưng khác pinyin/nghĩa
    this.version(3).stores({
      progress: '++id, cardId, [hanzi+hskLevel], hskLevel, hskVersion, confidence, bookmarked',
    });
  }
}

export const db = new FlashcardDB();
