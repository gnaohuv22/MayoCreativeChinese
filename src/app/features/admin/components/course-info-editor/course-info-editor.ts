import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import type { DraftInfoRow } from '../../pages/admin-courses/course-draft';

/** Cột "Thông tin khóa học" (Thời lượng, Sĩ số, Học phí…): nhãn + giá trị nhiều dòng */
@Component({
  selector: 'app-course-info-editor',
  standalone: true,
  imports: [AppIconComponent],
  templateUrl: './course-info-editor.html',
  styleUrl: './course-info-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseInfoEditorComponent {
  readonly rows = input.required<DraftInfoRow[]>();

  add(): void {
    this.rows().push({ label: '', text: '' });
  }

  move(index: number, delta: -1 | 1): void {
    const list = this.rows();
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
  }

  remove(index: number): void {
    if (confirm(`Xoá dòng “${this.rows()[index].label || 'chưa có nhãn'}”?`)) this.rows().splice(index, 1);
  }

  rowsFor(text: string): number {
    return Math.min(6, Math.max(1, text.split('\n').length));
  }
}
