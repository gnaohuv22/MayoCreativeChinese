import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import type { Exam, HskVersion } from '../../models/exam.model';
import { ExamCardComponent } from '../../components/exam-card/exam-card';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { ComingSoonBadgeComponent } from '../../../../components/shared/badge/coming-soon-badge';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ExamCardComponent, AppIconComponent, NavHeaderComponent, ComingSoonBadgeComponent],
  templateUrl: './exam-list.html',
  styleUrl: './exam-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly examService = inject(ExamService);

  /** Mọi đề đã xuất bản (cả 2 phiên bản) — lọc phía client để đếm theo cấp */
  private allExams = signal<Exam[]>([]);
  isLoading = signal<boolean>(true);

  // Grouped by version first (HSK 2.0 vs HSK 3.0)
  selectedVersion = signal<HskVersion>('2.0');
  selectedLevel = signal<number | 'all'>('all');

  versionCount = computed(() => {
    const all = this.allExams();
    return {
      '2.0': all.filter(e => e.hsk_version === '2.0').length,
      '3.0': all.filter(e => e.hsk_version === '3.0').length,
    };
  });

  /** Phiên bản còn lại — gợi ý khi phiên bản đang chọn chưa có đề */
  otherVersion = computed<HskVersion>(() => (this.selectedVersion() === '2.0' ? '3.0' : '2.0'));

  availableLevels = computed<{ level: number; label: string; count: number }[]>(() => {
    const ver = this.selectedVersion();
    const ofVersion = this.allExams().filter(e => e.hsk_version === ver);
    const levels = ver === '2.0' ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const prefix = ver === '2.0' ? 'HSK' : 'NEW HSK';
    return levels.map(i => ({
      level: i,
      label: `${prefix} ${i}`,
      count: ofVersion.filter(e => e.hsk_level === i).length,
    }));
  });

  exams = computed(() => {
    const ver = this.selectedVersion();
    const lvl = this.selectedLevel();
    return this.allExams().filter(e => e.hsk_version === ver && (lvl === 'all' || e.hsk_level === lvl));
  });

  ngOnInit() {
    this.loadExams();
  }

  async loadExams() {
    this.isLoading.set(true);
    const data = await this.examService.getExams({ is_published: true });
    this.allExams.set(data);
    // Mở sẵn phiên bản có đề nếu phiên bản mặc định còn trống
    const counts = this.versionCount();
    if (counts[this.selectedVersion()] === 0 && counts['3.0'] > 0) {
      this.selectedVersion.set('3.0');
    }
    this.isLoading.set(false);
  }

  setVersion(ver: HskVersion) {
    this.selectedVersion.set(ver);
    this.selectedLevel.set('all');
  }

  setLevel(lvl: number | 'all') {
    this.selectedLevel.set(lvl);
  }

  startExam(item: Exam) {
    if (item.id) {
      this.router.navigate(['/exams', item.id, 'take']);
    }
  }
}
