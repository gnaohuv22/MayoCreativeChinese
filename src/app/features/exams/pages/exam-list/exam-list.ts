import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import type { Exam, HskVersion } from '../../models/exam.model';
import { ExamCardComponent } from '../../components/exam-card/exam-card';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ExamCardComponent, AppIconComponent, NavHeaderComponent],
  templateUrl: './exam-list.html',
  styleUrl: './exam-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly examService = inject(ExamService);

  exams = signal<Exam[]>([]);
  isLoading = signal<boolean>(true);

  // Grouped by version first (HSK 2.0 vs HSK 3.0)
  selectedVersion = signal<HskVersion>('2.0');
  selectedLevel = signal<number | 'all'>('all');

  availableLevels = computed<{ level: number; label: string }[]>(() => {
    const ver = this.selectedVersion();
    if (ver === '2.0') {
      return [1, 2, 3, 4, 5, 6].map(i => ({ level: i, label: `HSK ${i}` }));
    } else {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => ({ level: i, label: `NEW HSK ${i}` }));
    }
  });

  ngOnInit() {
    this.loadExams();
  }

  async loadExams() {
    this.isLoading.set(true);
    const data = await this.examService.getExams({
      hsk_level: this.selectedLevel(),
      hsk_version: this.selectedVersion(),
      is_published: true,
    });
    this.exams.set(data);
    this.isLoading.set(false);
  }

  setVersion(ver: HskVersion) {
    this.selectedVersion.set(ver);
    this.selectedLevel.set('all');
    this.loadExams();
  }

  setLevel(lvl: number | 'all') {
    this.selectedLevel.set(lvl);
    this.loadExams();
  }

  startExam(item: Exam) {
    if (item.id) {
      this.router.navigate(['/exams', item.id, 'take']);
    }
  }
}
