import { describe, expect, it } from 'vitest';
import { blockToDraft, draftToBlock, linesToText, textToLine, textToLines } from './course-draft';
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

  it('không gộp nhiều đoạn **…** trên một dòng thành một', () => {
    expect(textToLine('**Buổi 1** – **Buổi 2**')).toEqual({ text: '**Buổi 1** – **Buổi 2**' });
    expect(textToLine('**Lưu ý:** mang vở')).toEqual({ text: '**Lưu ý:** mang vở' });
  });

  it('đậm + nghiêng cùng lúc', () => {
    const line: RichLine = { text: 'Quan trọng', bold: true, italic: true };
    expect(linesToText([line])).toBe('**_Quan trọng_**');
    expect(textToLine('**_Quan trọng_**')).toEqual(line);
  });

  it('dòng thường trông giống cú pháp được giữ nguyên bằng \\', () => {
    const lines: RichLine[] = [{ text: '- không phải gạch đầu dòng' }, { text: '_nghiêng giả_' }, { text: 'tên_biến_x' }, { text: '**x**' }, { text: '\\ đầu dòng' }];
    const text = linesToText(lines);
    // 4 dòng giống cú pháp được thêm \, "tên_biến_x" không cần
    expect(text.split('\n').filter(l => l.startsWith('\\')).length).toBe(4);
    expect(textToLines(text)).toEqual(lines);
  });
});
