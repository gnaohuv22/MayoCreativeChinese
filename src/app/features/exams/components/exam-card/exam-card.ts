import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
  togglePublish = output<Exam>();
}
