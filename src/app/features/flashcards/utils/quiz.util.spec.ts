import { describe, it, expect } from 'vitest';
import { buildQuestion, buildQuiz, meaningSenses, pinyinToneVariants, QUIZ_OPTION_COUNT } from './quiz.util';
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

describe('meaningSenses', () => {
  it('splits a meaning into senses and drops notes in brackets', () => {
    expect(meaningSenses('cần, yêu cầu')).toEqual(['cần', 'yêu cầu']);
    expect(meaningSenses('Có thể (khả năng); được')).toEqual(['có thể', 'được']);
    expect(meaningSenses('bố hoặc cha')).toEqual(['bố', 'cha']);
  });
});

describe('distractors that would also be correct', () => {
  const pool: VocabCard[] = [
    card(10, '要', 'yào', 'cần, yêu cầu'),
    card(11, '要', 'yào', 'muốn'),
    card(12, '想', 'xiǎng', 'muốn'),
    card(13, '可以', 'kěyǐ', 'có thể, được'),
    card(14, '能', 'néng', 'có thể'),
    card(15, '不客气', 'bú kèqi', 'đừng khách sáo'),
    card(16, '一起', 'yìqǐ', 'cùng nhau'),
    ...POOL,
  ];

  it('skips a meaning that is another sense of the same hanzi', () => {
    for (let i = 0; i < 30; i++) {
      expect(buildQuestion('hanzi_meaning', pool[0], pool)!.options).not.toContain('muốn');
    }
  });

  it('skips near-synonyms that share a sense', () => {
    for (let i = 0; i < 30; i++) {
      expect(buildQuestion('hanzi_meaning', pool[3], pool)!.options).not.toContain('có thể');
      expect(buildQuestion('meaning_hanzi', pool[4], pool)!.options).not.toContain('可以');
    }
  });

  it('does not offer the tone-sandhi spelling of 不 / 一 as a wrong pinyin', () => {
    for (let i = 0; i < 30; i++) {
      const q1 = buildQuestion('hanzi_pinyin', pool[5], pool)!;
      expect(q1.options.filter(o => o !== 'bú kèqi')).not.toContain('bù kèqi');
      const q2 = buildQuestion('hanzi_pinyin', pool[6], pool)!;
      expect(q2.options).not.toContain('yīqǐ');
      expect(q2.options).not.toContain('yíqǐ');
    }
  });
});

describe('buildQuiz', () => {
  it('limits to the requested count and uses each card once', () => {
    const quiz = buildQuiz(POOL, ['hanzi_meaning', 'meaning_hanzi'], 5);
    expect(quiz).toHaveLength(5);
    expect(new Set(quiz.map(q => q.card.id)).size).toBe(5);
  });
});
