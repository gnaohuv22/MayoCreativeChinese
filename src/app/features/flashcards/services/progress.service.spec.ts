import { describe, it, expect } from 'vitest';
import { parseProgressBackup } from './progress.service';

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
