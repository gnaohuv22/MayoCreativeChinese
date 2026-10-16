import { describe, it, expect } from 'vitest';
import { parseProgressBackup, progressKey, shareProgressAcrossLevels } from './progress.service';
import type { CardProgress } from '../models/vocab-card.model';

const record = { id: 7, cardId: 12, hanzi: '你好', hskLevel: 1, hskVersion: '2.0', confidence: 2, reviewCount: 3, bookmarked: false };

describe('parseProgressBackup', () => {
  it('reads an exported backup and drops the local id', () => {
    const [parsed] = parseProgressBackup(JSON.stringify([record]));
    expect(parsed).not.toHaveProperty('id');
    expect(parsed).toMatchObject({ cardId: 12, hanzi: '你好', confidence: 2 });
  });

  it('accepts an empty backup', () => {
    expect(parseProgressBackup('[]')).toEqual([]);
  });

  it('rejects a file that is not JSON', () => {
    expect(() => parseProgressBackup('not json')).toThrow('File không đúng định dạng JSON.');
  });

  it('rejects JSON that is not a progress backup', () => {
    const notBackup = 'File không phải bản sao lưu tiến độ Flashcard.';
    expect(() => parseProgressBackup('{"hanzi":"你好"}')).toThrow(notBackup);
    expect(() => parseProgressBackup(JSON.stringify([{ ...record, confidence: 5 }]))).toThrow(notBackup);
    expect(() => parseProgressBackup(JSON.stringify([record, null]))).toThrow(notBackup);
  });
});

describe('shareProgressAcrossLevels', () => {
  // HSK 2.0 tích luỹ: 爱 ài có id 1 ở HSK 1 và id 151 ở HSK 2; 得 de (318) và 得 dé (2276) là 2 từ khác nhau
  const wordKeys = new Map([
    [1, 'hsk2|爱|ài'],
    [151, 'hsk2|爱|ài'],
    [318, 'hsk2|得|de'],
    [2276, 'hsk2|得|dé'],
  ]);
  const progress = (cardId: number, hskLevel: number, extra: Partial<CardProgress> = {}): CardProgress =>
    ({ cardId, hanzi: '', hskLevel, hskVersion: '2.0', confidence: 3, reviewCount: 1, lastReviewed: 100, bookmarked: false, ...extra });

  it('shows a word learned in a lower level as learned in a higher level', () => {
    const card = { id: 151, hanzi: '爱', pinyin: 'ài', hsk_level: 2, collection: 'hsk2' as const };
    const map = new Map<string, CardProgress>();
    shareProgressAcrossLevels([card], map, [progress(1, 1)], wordKeys);
    expect(map.get(progressKey(card))).toMatchObject({ cardId: 1, confidence: 3, hanzi: '爱' });
  });

  it("keeps the card's own progress", () => {
    const card = { id: 151, hanzi: '爱', pinyin: 'ài', hsk_level: 2, collection: 'hsk2' as const };
    const own = progress(151, 2, { confidence: 1 });
    const map = new Map([[progressKey(card), own]]);
    shareProgressAcrossLevels([card], map, [progress(1, 1, { lastReviewed: 999 }), own], wordKeys);
    expect(map.get(progressKey(card))).toBe(own);
  });

  it('takes the most recent review when the word was studied in several levels', () => {
    const card = { id: 991, hanzi: '爱', pinyin: 'ài', hsk_level: 3, collection: 'hsk2' as const };
    const map = new Map<string, CardProgress>();
    shareProgressAcrossLevels([card], map, [progress(1, 1, { lastReviewed: 100 }), progress(151, 2, { confidence: 1, lastReviewed: 200 })], wordKeys);
    expect(map.get(progressKey(card))).toMatchObject({ cardId: 151, confidence: 1 });
  });

  it('does not mix words with the same hanzi but different pinyin', () => {
    const card = { id: 2276, hanzi: '得', pinyin: 'dé', hsk_level: 4, collection: 'hsk2' as const };
    const map = new Map<string, CardProgress>();
    shareProgressAcrossLevels([card], map, [progress(318, 2)], wordKeys);
    expect(map.size).toBe(0);
  });

  it('only shares within cumulative collections', () => {
    const card = { id: 5000, hanzi: '爱', pinyin: 'ài', hsk_level: 2, collection: 'hsk3' as const };
    const map = new Map<string, CardProgress>();
    shareProgressAcrossLevels([card], map, [progress(4000, 1)], new Map([[4000, 'hsk3|爱|ài']]));
    expect(map.size).toBe(0);
  });
});
