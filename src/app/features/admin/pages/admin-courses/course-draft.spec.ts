import { describe, expect, it } from 'vitest';
import { blockToDraft, draftToBlock, linesToText, textToLines } from './course-draft';
import type { CourseBlock, RichLine } from '../../../courses/models/course-detail.model';

describe('course-draft', () => {
  it('chuyển dòng định dạng sang chữ và ngược lại', () => {
    const lines: RichLine[] = [
      { text: 'Buổi 1', bold: true },
      { text: 'Ngữ âm', italic: true },
      { text: 'Thanh điệu', bullet: true },
      { text: 'Bình thường' },
    ];
    const text = linesToText(lines);
    expect(text).toBe('**Buổi 1**\n_Ngữ âm_\n- Thanh điệu\nBình thường');
    expect(textToLines(text)).toEqual(lines);
  });

  it('bỏ dòng trống và khoảng trắng thừa', () => {
    expect(textToLines('  a  \n\n- b ')).toEqual([{ text: 'a' }, { text: 'b', bullet: true }]);
  });

  it('giữ nguyên khối lồng nhau khi đi một vòng', () => {
    const block: CourseBlock = {
      kind: 'stage',
      title: 'Giai đoạn 1',
      blocks: [
        { kind: 'subheading', text: 'Bài học' },
        { kind: 'table', head: ['Buổi', 'Nội dung'], rows: [[[{ text: 'Buổi 1', bold: true }], [{ text: 'Chào hỏi', bullet: true }]]] },
        { kind: 'list', items: ['Một', 'Hai'] },
      ],
    };
    expect(draftToBlock(blockToDraft(block))).toEqual(block);
  });
});
