import { describe, it, expect } from 'vitest';
import {
  orderingAnswerMatches,
  orderingMarks,
  orderingSentence,
  parseOrderingTokens,
  toOrderingMarks,
} from './exam-ordering';
import { formatAnswer } from './exam.model';

const content = '① 那只猫  ② 桌子下面  ③ 睡觉  ④ 在';
const tokens = parseOrderingTokens(content);

describe('parseOrderingTokens', () => {
  it('splits the question into numbered words', () => {
    expect(tokens).toEqual([
      { mark: '①', text: '那只猫' },
      { mark: '②', text: '桌子下面' },
      { mark: '③', text: '睡觉' },
      { mark: '④', text: '在' },
    ]);
  });

  it('handles words written without spaces or across lines', () => {
    expect(parseOrderingTokens('①比②妹妹\n③我 ④高').map((t) => t.text)).toEqual([
      '比',
      '妹妹',
      '我',
      '高',
    ]);
  });

  it('returns nothing for content that is not numbered', () => {
    expect(parseOrderingTokens('我 比 妹妹 高')).toEqual([]);
    expect(parseOrderingTokens(null)).toEqual([]);
  });
});

describe('orderingMarks', () => {
  it('keeps the order and ignores spaces', () => {
    expect(orderingMarks('① ④ ②③')).toEqual(['①', '④', '②', '③']);
    expect(orderingMarks('')).toEqual([]);
  });
});

describe('orderingSentence', () => {
  it('turns an answer into the sentence', () => {
    expect(orderingSentence('①④②③', tokens)).toBe('那只猫在桌子下面睡觉');
  });

  it('shows plain-number answers as sentences too', () => {
    expect(orderingSentence('1423', tokens)).toBe('那只猫在桌子下面睡觉');
  });

  it('shows each accepted order of a correct answer', () => {
    expect(orderingSentence('①④②③ / ②④①③', tokens)).toBe(
      '那只猫在桌子下面睡觉 / 桌子下面在那只猫睡觉',
    );
  });

  it('leaves answers it cannot map unchanged', () => {
    expect(orderingSentence('①④②③', [])).toBe('①④②③');
    expect(orderingSentence('', tokens)).toBe('');
  });
});

describe('formatAnswer for ordering questions', () => {
  it('shows the sentence on the result page', () => {
    expect(formatAnswer('①④②③', 'ordering', content)).toBe('那只猫在桌子下面睡觉');
    expect(formatAnswer('', 'ordering', content)).toBe('');
  });
});

describe('toOrderingMarks', () => {
  it('reads circled numbers, plain numbers and the full sentence', () => {
    for (const answer of [
      '①④②③',
      '① ④ ② ③',
      '1423',
      '1-4-2-3',
      '1, 4, 2, 3',
      '1 → 4 → 2 → 3',
      '那只猫在桌子下面睡觉',
      '那只猫在桌子下面睡觉。',
    ]) {
      expect(toOrderingMarks(answer, tokens), answer).toBe('①④②③');
    }
  });

  it('splits a sentence whose words share a prefix', () => {
    const words = parseOrderingTokens('① 我们 ② 我 ③ 喜欢 ④ 们');
    expect(toOrderingMarks('我们喜欢我们', words)).toMatch(/^(①③②④|②④③①)$/);
  });

  it('rejects numbers outside the word list and sentences that do not use every word', () => {
    expect(toOrderingMarks('1425', tokens)).toBe('1425');
    expect(toOrderingMarks('那只猫在睡觉', tokens)).toBe('那只猫在睡觉');
  });
});

describe('orderingAnswerMatches', () => {
  it('grades a chip answer against any way the teacher wrote the correct order', () => {
    for (const correct of ['①④②③', '1423', '1,4,2,3', '那只猫在桌子下面睡觉']) {
      expect(orderingAnswerMatches('①④②③', correct, tokens), correct).toBe(true);
      expect(orderingAnswerMatches('④①②③', correct, tokens), correct).toBe(false);
    }
  });

  it('accepts every listed order', () => {
    const q9 = parseOrderingTokens('① 比  ② 妹妹  ③ 我  ④ 高');
    expect(orderingAnswerMatches('②①③④', '3124 / 2134', q9)).toBe(true);
    expect(orderingAnswerMatches('③①②④', '我比妹妹高 hoặc 妹妹比我高', q9)).toBe(true);
  });

  it('never matches an empty answer', () => {
    expect(orderingAnswerMatches('', '①④②③', tokens)).toBe(false);
  });
});
