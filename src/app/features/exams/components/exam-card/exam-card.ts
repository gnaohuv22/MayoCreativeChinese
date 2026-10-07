import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SECTION_TYPE_LABELS } from '../../models/exam.model';
import type { Exam } from '../../models/exam.model';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { HskBadgeComponent } from '../../../../components/shared/badge/hsk-badge';
import { ComingSoonBadgeComponent } from '../../../../components/shared/badge/coming-soon-badge';
import { StaffOnlyBadgeComponent } from '../../../../components/shared/visibility/staff-only-badge';
import { MembersOnlyBadgeComponent } from '../../../../components/shared/visibility/members-only-badge';
import { VisibilityPickerComponent } from '../../../../components/shared/visibility/visibility-picker';
import { isLockedAccess, type ContentAccess, type ContentVisibility } from '../../../../components/shared/visibility/content-visibility';

@Component({
  selector: 'app-exam-card',
  standalone: true,
  imports: [CommonModule, RouterLink, AppIconComponent, HskBadgeComponent, ComingSoonBadgeComponent, StaffOnlyBadgeComponent, MembersOnlyBadgeComponent, VisibilityPickerComponent],
  templateUrl: './exam-card.html',
  styleUrl: './exam-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamCardComponent {
  exam = input.required<Exam>();
  mode = input<'learner' | 'admin'>('learner');

  start = output<Exam>();
  edit = output<Exam>();
  delete = output<Exam>();
  duplicate = output<Exam>();
  /** Đang nhân bản đề này (khoá nút) */
  duplicating = input<boolean>(false);
  canDelete = input<boolean>(false);
  /** Trang học viên: locked = "Sắp ra mắt" (đề nội bộ, khách xem), members = đề dành cho học viên */
  access = input<ContentAccess>('open');
  /** Đang lưu trạng thái hiển thị (khoá bộ chọn) */
  savingVisibility = input<boolean>(false);
  visibilityChange = output<{ exam: Exam; visibility: ContentVisibility }>();

  locked = computed(() => this.mode() === 'learner' && isLockedAccess(this.access()));

  /** "Nghe hiểu 5 câu · Đọc hiểu 6 câu" — số câu thật của từng phần */
  sectionSummary = computed(() =>
    (this.exam().section_counts ?? [])
      .map(s => `${SECTION_TYPE_LABELS[s.section_type] ?? s.section_type} ${s.count} câu`)
      .join(' · ')
  );
}
