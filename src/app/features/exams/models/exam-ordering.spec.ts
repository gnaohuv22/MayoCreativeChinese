import { describe, it, expect } from 'vitest';
import { orderingMarks, orderingSentence, parseOrderingTokens } from './exam-ordering';
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
