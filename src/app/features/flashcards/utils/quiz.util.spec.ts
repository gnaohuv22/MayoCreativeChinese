import { describe, it, expect } from 'vitest';
import { buildQuestion, buildQuiz, pinyinToneVariants, QUIZ_OPTION_COUNT } from './quiz.util';
import type { VocabCard } from '../models/vocab-card.model';

const card = (id: number, hanzi: string, pinyin: string, meaning: string): VocabCard =>
  ({ id, hanzi, pinyin, meaning, hsk_level: 1, collection: 'hsk2' });

const POOL: VocabCard[] = [
  card(1, '你好', 'nǐ hǎo', 'xin chào'),
  card(2, '谢谢', 'xièxie', 'cảm ơn'),
  card(3, '再见', 'zàijiàn', 'tạm biệt'),
  card(4, '猫', 'māo', 'mèo'),
  card(5, '狗', 'gǒu', 'chó'),
  card(6, '对', 'duì', 'đúng'),
  card(7, '对', 'duì', 'đối với'),
];

describe('pinyinToneVariants', () => {
  it('changes one tone mark at a time', () => {
    const v = pinyinToneVariants('māo');
    expect(v).toEqual(expect.arrayContaining(['máo', 'mǎo', 'mào']));
    expect(v).not.toContain('māo');
  });

  it('returns nothing when there are no tone marks', () => {
    expect(pinyinToneVariants('de')).toEqual([]);
  });
});

describe('buildQuestion', () => {
  it('builds 4 distinct options containing the answer', () => {
    for (const type of ['hanzi_meaning', 'meaning_hanzi', 'hanzi_pinyin'] as const) {
      const q = buildQuestion(type, POOL[0], POOL)!;
      expect(q.options).toHaveLength(QUIZ_OPTION_COUNT);
      expect(new Set(q.options).size).toBe(QUIZ_OPTION_COUNT);
      expect(q.answerIndex).toBeGreaterThanOrEqual(0);
    }
  });

  it('never uses the same hanzi with another meaning as a distractor', () => {
    for (let i = 0; i < 20; i++) {
      const q = buildQuestion('hanzi_meaning', POOL[5], POOL)!;
      expect(q.options).not.toContain('đối với');
    }
  });

  it('returns null when there are not enough distractors', () => {
    expect(buildQuestion('meaning_hanzi', POOL[0], POOL.slice(0, 2))).toBeNull();
  });
});

describe('buildQuiz', () => {
  it('limits to the requested count and uses each card once', () => {
    const quiz = buildQuiz(POOL, ['hanzi_meaning', 'meaning_hanzi'], 5);
    expect(quiz).toHaveLength(5);
    expect(new Set(quiz.map(q => q.card.id)).size).toBe(5);
  });
});
