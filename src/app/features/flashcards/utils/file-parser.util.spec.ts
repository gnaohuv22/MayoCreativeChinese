import { describe, it, expect } from 'vitest';
import { parseCsv, validateRows, type ExistingVocabKeys } from './file-parser.util';
import { splitExamples, vocabEntryKey, vocabHanziKey } from '../models/vocab-card.model';
import type { VocabCollection } from '../models/vocab-card.model';

describe('file-parser.util', () => {
  describe('parseCsv', () => {
    it('should correctly parse standard CSV with Vietnamese columns or English columns', () => {
      const csv = `hanzi,pinyin,meaning,hsk_level,example,example_pinyin,example_meaning
你好,nǐ hǎo,xin chào,1,你好，我叫小明。,Nǐ hǎo wǒ jiào Xiǎo Míng.,Xin chào tôi tên là Tiểu Minh.
谢谢,xiè xie,cảm ơn,1,谢谢你的帮助。,Xiè xie nǐ de bāng zhù.,Cảm ơn sự giúp đỡ của bạn.`;

      const rows = parseCsv(csv);
      expect(rows.length).toBe(2);
      expect(rows[0].hanzi).toBe('你好');
      expect(rows[0].pinyin).toBe('nǐ hǎo');
      expect(rows[0].meaning).toBe('xin chào');
      expect(rows[0].hsk_level).toBe(1);
      expect(rows[0].example).toBe('你好，我叫小明。');
    });

    it('should correctly parse CSV with quotes and commas inside text', () => {
      const csv = `hanzi,pinyin,meaning,hsk_level
"吃","chī","ăn, dùng bữa",1`;

      const rows = parseCsv(csv);
      expect(rows.length).toBe(1);
      expect(rows[0].hanzi).toBe('吃');
      expect(rows[0].meaning).toBe('ăn, dùng bữa');
    });

    it('should parse lesson and topic columns', () => {
      const csv = `hanzi,pinyin,meaning,hsk_level,lesson_number,lesson_title,chủ đề
你好,nǐ hǎo,xin chào,1,1,Bài 1: Lời chào,
快递,kuàidì,chuyển phát nhanh,3,,,Mua sắm`;

      const rows = parseCsv(csv);
      expect(rows.length).toBe(2);
      expect(rows[0].lesson_number).toBe(1);
      expect(rows[0].lesson_title).toBe('Bài 1: Lời chào');
      expect(rows[0].topic).toBeUndefined();
      expect(rows[1].lesson_number).toBeUndefined();
      expect(rows[1].topic).toBe('Mua sắm');
    });

    it('should keep line breaks inside quoted cells (several examples)', () => {
      const csv = 'hanzi,pinyin,meaning,hsk_level,example,example_pinyin\r\n'
        + '对,duì,đúng,1,"你说得对。\r\n对，我是老师。","Nǐ shuō de duì.\nDuì, wǒ shì lǎoshī."\r\n'
        + '猫,māo,mèo,1,,\r\n';

      const rows = parseCsv(csv);
      expect(rows.length).toBe(2);
      expect(rows[0].example).toBe('你说得对。\n对，我是老师。');
      expect(splitExamples(rows[0]).map(e => [e.text, e.pinyin])).toEqual([
        ['你说得对。', 'Nǐ shuō de duì.'],
        ['对，我是老师。', 'Duì, wǒ shì lǎoshī.'],
      ]);
      expect(rows[1].hanzi).toBe('猫');
    });

    it('should throw error if required columns are missing', () => {
      const csv = `hanzi,pinyin
你好,nǐ hǎo`;
      expect(() => parseCsv(csv)).toThrow();
    });
  });

  describe('validateRows', () => {
    const none = (): ExistingVocabKeys => ({ entries: new Set(), hanzi: new Map() });
    const existingFrom = (collection: VocabCollection, cards: { hanzi: string; pinyin: string; meaning: string; hsk_level: number }[]): ExistingVocabKeys => {
      const keys = none();
      for (const c of cards) {
        const card = { ...c, collection };
        keys.entries.add(vocabEntryKey(card));
        const list = keys.hanzi.get(vocabHanziKey(card)) ?? [];
        list.push({ pinyin: c.pinyin, meaning: c.meaning });
        keys.hanzi.set(vocabHanziKey(card), list);
      }
      return keys;
    };

    it('should mark duplicate words as duplicate status', () => {
      const parsed = [
        { hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào', hsk_level: 1 },
        { hanzi: '再见', pinyin: 'zài jiàn', meaning: 'tạm biệt', hsk_level: 1 },
      ];
      const existing = existingFrom('hsk2', [{ hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào', hsk_level: 1 }]);

      const validated = validateRows(parsed, existing, 'hsk2');
      expect(validated[0].status).toBe('duplicate');
      expect(validated[1].status).toBe('valid');
    });

    it('should not treat words of another collection as duplicates', () => {
      const parsed = [{ hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào', hsk_level: 1 }];
      const existing = existingFrom('hsk2', [{ hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào', hsk_level: 1 }]);

      const validated = validateRows(parsed, existing, 'hsk3');
      expect(validated[0].status).toBe('valid');
      expect(validated[0].sameHanziMatches).toBeUndefined();
    });

    it('should keep the same hanzi when pinyin or meaning differs, and list the existing meanings', () => {
      const parsed = [
        { hanzi: '对', pinyin: 'duì', meaning: 'Đối với, hướng tới', hsk_level: 3 },
        { hanzi: '对', pinyin: 'duì', meaning: 'đúng', hsk_level: 3 },
      ];
      const existing = existingFrom('hsk2', [{ hanzi: '对', pinyin: 'duì', meaning: 'Đúng', hsk_level: 3 }]);

      const validated = validateRows(parsed, existing, 'hsk2');
      expect(validated[0].status).toBe('valid');
      expect(validated[0].sameHanziMatches).toEqual([{ pinyin: 'duì', meaning: 'Đúng' }]);
      // Same hanzi + pinyin + meaning (case/whitespace-insensitive) → duplicate
      expect(validated[1].status).toBe('duplicate');
    });

    it('should detect duplicate rows within the same uploaded file', () => {
      const parsed = [
        { hanzi: '猫', pinyin: 'māo', meaning: 'mèo', hsk_level: 1 },
        { hanzi: '猫', pinyin: 'māo', meaning: 'mèo', hsk_level: 1 },
      ];

      const validated = validateRows(parsed, none(), 'hsk3');
      expect(validated[0].status).toBe('valid');
      expect(validated[1].status).toBe('duplicate');
    });

    it('should reject levels outside the collection', () => {
      const parsed = [
        { hanzi: '', pinyin: 'nǐ hǎo', meaning: 'xin chào', hsk_level: 1 },
        { hanzi: '测试', pinyin: 'cè shì', meaning: 'thử nghiệm', hsk_level: 7 },
        { hanzi: '测试', pinyin: 'cè shì', meaning: 'thử nghiệm', hsk_level: 2 },
      ];

      const hsk2 = validateRows(parsed, none(), 'hsk2');
      expect(hsk2[0].status).toBe('error');
      expect(hsk2[0].errors).toContain('Thiếu Hán tự');
      expect(hsk2[1].status).toBe('error'); // HSK 2.0 chỉ có 1-6
      expect(hsk2[2].status).toBe('valid');

      const supplement = validateRows(parsed, none(), 'supplement');
      expect(supplement[2].status).toBe('error'); // Bổ sung chỉ có 3-6
    });
  });
});
