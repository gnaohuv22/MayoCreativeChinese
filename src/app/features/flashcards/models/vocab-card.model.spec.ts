import { describe, it, expect } from 'vitest';
import { splitExamples } from './vocab-card.model';

describe('splitExamples', () => {
  it('pairs line N of example / pinyin / meaning and drops typed numbering', () => {
    const examples = splitExamples({
      example: 'VD1: 他不喜欢吃米饭。 \r\nVD2: 我不是学生。',
      example_pinyin: '1/ Tā bù xǐhuān chī mǐfàn. \r\n2/ Wǒ bú shì xuéshēng.',
      example_meaning: '1/ Anh ấy không thích ăn cơm. \r\n2/ Tôi không phải học sinh.',
    });
    expect(examples).toEqual([
      { text: '他不喜欢吃米饭。', pinyin: 'Tā bù xǐhuān chī mǐfàn.', meaning: 'Anh ấy không thích ăn cơm.', speakText: '他不喜欢吃米饭。' },
      { text: '我不是学生。', pinyin: 'Wǒ bú shì xuéshēng.', meaning: 'Tôi không phải học sinh.', speakText: '我不是学生。' },
    ]);
  });

  it('keeps an A/B dialogue as one example', () => {
    const examples = splitExamples({
      example: 'A: 谢谢你！ \r\nB: 不客气。',
      example_pinyin: 'A: Xièxiè nǐ! \r\nB: Bú kèqi.',
      example_meaning: 'A: Cảm ơn bạn! \r\nB: Đừng ngại.',
    });
    expect(examples).toHaveLength(1);
    expect(examples[0].text).toBe('A: 谢谢你！\nB: 不客气。');
    expect(examples[0].speakText).toBe('谢谢你！\n不客气。');
  });

  it('keeps extra lines when columns have different line counts', () => {
    const examples = splitExamples({ example: '我爱你。\n我爱吃米饭。', example_pinyin: 'Wǒ ài nǐ.', example_meaning: null });
    expect(examples.map(e => [e.text, e.pinyin])).toEqual([['我爱你。', 'Wǒ ài nǐ.'], ['我爱吃米饭。', '']]);
  });

  it('returns nothing for empty examples', () => {
    expect(splitExamples({ example: null, example_pinyin: '', example_meaning: undefined })).toEqual([]);
  });
});
