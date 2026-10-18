import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import type { DraftBlock, DraftBlockKind } from '../../pages/admin-courses/course-draft';

const BLOCK_LABELS: Record<DraftBlockKind, string> = {
  heading: 'Tiêu đề',
  subheading: 'Tiêu đề nhỏ',
  paragraph: 'Đoạn văn',
  list: 'Danh sách',
  table: 'Bảng',
  stage: 'Giai đoạn',
};

/**
 * Sửa nội dung trang khóa học (khối CourseBlock dạng nháp). Sửa thẳng vào mảng của trang cha.
 * Bảng và giai đoạn thu gọn mặc định để trang không quá dài; giai đoạn chứa khối con (đệ quy).
 */
@Component({
  selector: 'app-course-blocks-editor',
  standalone: true,
  imports: [AppIconComponent],
  templateUrl: './course-blocks-editor.html',
  styleUrl: './course-blocks-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseBlocksEditorComponent {
  readonly blocks = input.required<DraftBlock[]>();
  /** Bên trong một giai đoạn: không thêm giai đoạn lồng nhau */
  readonly nested = input(false);

  readonly labels = BLOCK_LABELS;
  /** Bảng / giai đoạn đang mở */
  readonly open = signal(new Set<DraftBlock>());

  addKinds(): { kind: DraftBlockKind; label: string }[] {
    return (Object.keys(BLOCK_LABELS) as DraftBlockKind[])
      .filter(k => !(this.nested() && k === 'stage'))
      .map(kind => ({ kind, label: BLOCK_LABELS[kind] }));
  }

  isOpen(block: DraftBlock): boolean {
    return this.open().has(block);
  }

  toggle(block: DraftBlock): void {
    this.open.update(set => {
      const next = new Set(set);
      if (!next.delete(block)) next.add(block);
      return next;
    });
  }

  add(kind: DraftBlockKind): void {
    const block: DraftBlock =
      kind === 'table' ? { kind, head: ['', ''], rows: [['', '']] }
        : kind === 'stage' ? { kind, title: '', blocks: [] }
          : kind === 'list' ? { kind, title: '', text: '' }
            : { kind, text: '' };
    this.blocks().push(block);
    if (kind === 'table' || kind === 'stage') this.toggle(block);
  }

  move(index: number, delta: -1 | 1): void {
    const list = this.blocks();
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
  }

  remove(index: number): void {
    const block = this.blocks()[index];
    if (!confirm(`Xoá ${BLOCK_LABELS[block.kind].toLowerCase()}${block.kind === 'stage' ? ' và toàn bộ nội dung bên trong' : ''}?`)) return;
    this.blocks().splice(index, 1);
  }

  /** Dòng tóm tắt trên khối thu gọn */
  summary(block: DraftBlock): string {
    if (block.kind === 'stage') return block.title || '(chưa có tên)';
    if (block.kind === 'table') return `${block.head.filter(Boolean).join(' · ') || 'Bảng'} — ${block.rows.length} dòng`;
    return '';
  }

  // Bảng ------------------------------------------------------------------------

  addRow(table: { head: string[]; rows: string[][] }): void {
    table.rows.push(table.head.map(() => ''));
  }

  addColumn(table: { head: string[]; rows: string[][] }): void {
    table.head.push('');
    table.rows.forEach(r => r.push(''));
  }

  removeColumn(table: { head: string[]; rows: string[][] }, col: number): void {
    if (table.head.length <= 1 || !confirm('Xoá cột này ở mọi dòng?')) return;
    table.head.splice(col, 1);
    table.rows.forEach(r => r.splice(col, 1));
  }

  moveRow(table: { rows: string[][] }, index: number, delta: -1 | 1): void {
    const target = index + delta;
    if (target < 0 || target >= table.rows.length) return;
    [table.rows[index], table.rows[target]] = [table.rows[target], table.rows[index]];
  }

  removeRow(table: { rows: string[][] }, index: number): void {
    if (confirm('Xoá dòng này?')) table.rows.splice(index, 1);
  }

  /** Số dòng ô văn bản theo nội dung (2–8) */
  rowsFor(text: string): number {
    return Math.min(8, Math.max(2, text.split('\n').length));
  }
}
