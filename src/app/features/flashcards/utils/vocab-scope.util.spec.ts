import { describe, it, expect } from 'vitest';
import { vocabCardLevelLabel, scopeLevelLabel } from './vocab-scope.util';

describe('vocab-scope.util', () => {
  describe('vocabCardLevelLabel', () => {
    it('labels combined levels 7, 8, 9 as HSK 7-9', () => {
      expect(vocabCardLevelLabel({ collection: 'combined', hsk_level: 7 })).toBe('HSK 7-9');
      expect(vocabCardLevelLabel({ collection: 'combined', hsk_level: 8 })).toBe('HSK 7-9');
      expect(vocabCardLevelLabel({ collection: 'combined', hsk_level: 9 })).toBe('HSK 7-9');
    });

    it('labels combined levels 1 through 6 as HSK n', () => {
      expect(vocabCardLevelLabel({ collection: 'combined', hsk_level: 1 })).toBe('HSK 1');
      expect(vocabCardLevelLabel({ collection: 'combined', hsk_level: 6 })).toBe('HSK 6');
    });

    it('labels HSK 3.0 cards as NEW HSK n', () => {
      expect(vocabCardLevelLabel({ collection: 'hsk3', hsk_level: 1 })).toBe('NEW HSK 1');
      expect(vocabCardLevelLabel({ collection: 'hsk3', hsk_level: 3 })).toBe('NEW HSK 3');
      expect(vocabCardLevelLabel({ collection: 'hsk3', hsk_level: 9 })).toBe('NEW HSK 9');
    });

    it('labels HSK 2.0 cards as HSK n', () => {
      expect(vocabCardLevelLabel({ collection: 'hsk2', hsk_level: 1 })).toBe('HSK 1');
      expect(vocabCardLevelLabel({ collection: 'hsk2', hsk_level: 6 })).toBe('HSK 6');
    });

    it('labels supplement cards as HSK n', () => {
      expect(vocabCardLevelLabel({ collection: 'supplement', hsk_level: 3 })).toBe('HSK 3');
      expect(vocabCardLevelLabel({ collection: 'supplement', hsk_level: 6 })).toBe('HSK 6');
    });
  });

  describe('scopeLevelLabel', () => {
    it('uses correct level prefixes for collections', () => {
      expect(scopeLevelLabel({ collection: 'hsk3', levelParam: '2' })).toBe('NEW HSK 2');
      expect(scopeLevelLabel({ collection: 'hsk2', levelParam: '2' })).toBe('HSK 2');
      expect(scopeLevelLabel({ collection: 'combined', levelParam: '7-9' })).toBe('HSK 7-9');
    });
  });
});
