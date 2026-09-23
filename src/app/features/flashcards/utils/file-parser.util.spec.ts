import { describe, it, expect } from 'vitest';
import { parseCsv, validateRows } from './file-parser.util';

describe('file-parser.util', () => {
  describe('parseCsv', () => {
    it('should correctly parse standard CSV with Vietnamese columns or English columns', () => {
      const csv = `hanzi,pinyin,meaning,hsk_level,example,example_pinyin,example_meaning
你好,nǐ hǎo,xin chào,1,你好，我叫小明。,Nǐ hǎo, wǒ jiào Xiǎo Míng.,Xin chào, tôi tên là Tiểu Minh.
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

    it('should correctly parse CSV with hsk_version and lesson_number', () => {
      const csv = `hanzi,pinyin,meaning,hsk_level,hsk_version,lesson_number,lesson_title
你好,nǐ hǎo,xin chào,1,3.0,1,Bài 1: Lời chào
再见,zài jiàn,tạm biệt,1,2.0,,`;

      const rows = parseCsv(csv);
      expect(rows.length).toBe(2);
      expect(rows[0].hsk_version).toBe('3.0');
      expect(rows[0].lesson_number).toBe(1);
      expect(rows[0].lesson_title).toBe('Bài 1: Lời chào');
      expect(rows[1].hsk_version).toBe('2.0');
      expect(rows[1].lesson_number).toBeUndefined();
    });

    it('should throw error if required columns are missing', () => {
      const csv = `hanzi,pinyin
你好,nǐ hǎo`;
      expect(() => parseCsv(csv)).toThrow();
    });
  });

  describe('validateRows', () => {
    it('should mark duplicate words as duplicate status', () => {
      const parsed = [
        { hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào', hsk_level: 1 },
        { hanzi: '再见', pinyin: 'zài jiàn', meaning: 'tạm biệt', hsk_level: 1 },
      ];
      const existing = new Set(['你好']);

      const validated = validateRows(parsed, existing);
      expect(validated[0].status).toBe('duplicate');
      expect(validated[1].status).toBe('valid');
    });

    it('should validate compound keys without false conflicts between versions', () => {
      const parsed = [
        { hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào', hsk_level: 1, hsk_version: '3.0' as const },
        { hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào', hsk_level: 1, hsk_version: '2.0' as const },
      ];
      // Only version 2.0 exists in DB
      const existingCompound = new Set(['你好_1_2.0']);

      const validated = validateRows(parsed, existingCompound);
      expect(validated[0].status).toBe('valid'); // 3.0 does not conflict with 2.0!
      expect(validated[1].status).toBe('duplicate'); // 2.0 is duplicate!
    });

    it('should detect duplicate rows within the same uploaded file', () => {
      const parsed = [
        { hanzi: '猫', pinyin: 'māo', meaning: 'mèo', hsk_level: 1, hsk_version: '3.0' as const },
        { hanzi: '猫', pinyin: 'māo', meaning: 'mèo', hsk_level: 1, hsk_version: '3.0' as const },
      ];

      const validated = validateRows(parsed, new Set());
      expect(validated[0].status).toBe('valid');
      expect(validated[1].status).toBe('duplicate');
    });

    it('should mark invalid rows with error status', () => {
      const parsed = [
        { hanzi: '', pinyin: 'nǐ hǎo', meaning: 'xin chào', hsk_level: 1 },
        { hanzi: '测试', pinyin: 'cè shì', meaning: 'thử nghiệm', hsk_level: 12 },
      ];

      const validated = validateRows(parsed, new Set());
      expect(validated[0].status).toBe('error');
      expect(validated[0].errors).toContain('Thiếu Hán tự');
      expect(validated[1].status).toBe('error');
      expect(validated[1].errors).toContain('HSK level phải từ 1 đến 9');
    });
  });
});
