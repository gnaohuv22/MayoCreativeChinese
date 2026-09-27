import { Component, ChangeDetectionStrategy, computed, input, signal } from '@angular/core';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import type { CourseBlock, RichLine } from '../../models/course-detail.model';

/**
 * Hiển thị nội dung lộ trình theo brief: đoạn văn, danh sách, bảng buổi học và
 * accordion theo giai đoạn (mặc định mở giai đoạn đầu tiên).
 */
@Component({
  selector: 'app-course-blocks',
  standalone: true,
  imports: [AppIconComponent],
  templateUrl: './course-blocks.html',
  styleUrl: './course-blocks.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseBlocksComponent {
  blocks = input.required<CourseBlock[]>();

  /** Vị trí các block là giai đoạn (accordion) */
  private readonly stageIndexes = computed(() =>
    this.blocks().flatMap((b, i) => (b.kind === 'stage' ? [i] : []))
  );

  /** null = theo mặc định (mở giai đoạn đầu); còn lại là tập các giai đoạn đang mở */
  private readonly openSet = signal<Set<number> | null>(null);

  isOpen(index: number): boolean {
    const open = this.openSet();
    return open ? open.has(index) : index === this.stageIndexes()[0];
  }

  toggle(index: number): void {
    const next = new Set(this.openSet() ?? [this.stageIndexes()[0]]);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    this.openSet.set(next);
  }

  /** Dòng tiêu đề của ô (in đậm) — dùng cho nhãn buổi học / bài */
  lineClass(line: RichLine, first: boolean): string {
    if (line.italic) return 'font-sans text-brand-pink dark:text-brand-accent';
    if (line.bold) return first ? 'font-bold text-brand-navy dark:text-white' : 'font-semibold text-brand-navy dark:text-white';
    return 'text-brand-navy/80 dark:text-white/80';
  }
}
