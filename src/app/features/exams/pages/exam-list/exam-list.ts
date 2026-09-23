import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
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

  selectedLevel = signal<number | 'all'>('all');
  selectedVersion = signal<HskVersion | 'all'>('all');

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

  setLevel(lvl: number | 'all') {
    this.selectedLevel.set(lvl);
    this.loadExams();
  }

  setVersion(ver: HskVersion | 'all') {
    this.selectedVersion.set(ver);
    this.loadExams();
  }

  startExam(item: Exam) {
    if (item.id) {
      this.router.navigate(['/exams', item.id, 'take']);
    }
  }
}
