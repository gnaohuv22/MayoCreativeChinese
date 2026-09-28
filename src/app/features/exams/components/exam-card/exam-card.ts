import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SECTION_TYPE_LABELS } from '../../models/exam.model';
import type { Exam } from '../../models/exam.model';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { HskBadgeComponent } from '../../../../components/shared/badge/hsk-badge';

@Component({
  selector: 'app-exam-card',
  standalone: true,
  imports: [CommonModule, RouterLink, AppIconComponent, HskBadgeComponent],
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
  togglePublish = output<Exam>();

  /** "Nghe hiểu 5 câu · Đọc hiểu 6 câu" — số câu thật của từng phần */
  sectionSummary = computed(() =>
    (this.exam().section_counts ?? [])
      .map(s => `${SECTION_TYPE_LABELS[s.section_type] ?? s.section_type} ${s.count} câu`)
      .join(' · ')
  );
}
