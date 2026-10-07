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
import { AuthService } from '../../../../services/auth.service';
import { contentAccess, isLockedAccess, type ContentAccess, type ContentViewer } from '../../../../components/shared/visibility/content-visibility';
import { StudentService } from '../../../classes/services/student.service';

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
  private readonly auth = inject(AuthService);

  /** Đề công khai + nội bộ (cả 2 phiên bản) — lọc phía client để đếm theo cấp */
  private listedExams = signal<Exam[]>([]);
  private readonly studentService = inject(StudentService);
  private viewer = signal<ContentViewer>({ staff: false, student: false });
  /** Đề được gợi ý cho lớp của học viên đang đăng nhập */
  private suggestedIds = signal<Set<string>>(new Set());

  /** Khách: đề nội bộ hiện "Sắp ra mắt", đề học viên hiện nhãn "Học viên"; nhân sự: làm được như đề công khai */
  accessOf(exam: Exam): ContentAccess {
    return contentAccess(exam.visibility, this.viewer(), this.suggestedIds().has(exam.id ?? ''));
  }

  /** Đề làm được — dùng để đếm và bật/tắt cấp độ */
  private allExams = computed(() => this.listedExams().filter(e => !isLockedAccess(this.accessOf(e))));
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

  /** Đề làm được trước, đề "Sắp ra mắt" xếp sau */
  exams = computed(() => {
    const ver = this.selectedVersion();
    const lvl = this.selectedLevel();
    const list = this.listedExams().filter(e => e.hsk_version === ver && (lvl === 'all' || e.hsk_level === lvl));
    const locked = (e: Exam) => (isLockedAccess(this.accessOf(e)) ? 1 : 0);
    return list.sort((a, b) => locked(a) - locked(b));
  });

  openCount = computed(() => this.exams().filter(e => !isLockedAccess(this.accessOf(e))).length);

  ngOnInit() {
    this.loadExams();
  }

  async loadExams() {
    this.isLoading.set(true);
    const [data] = await Promise.all([
      this.examService.getExams({ learner: true }),
      this.auth.ready.then(async () => {
        this.viewer.set({ staff: this.auth.can('content.read'), student: this.auth.isStudent() });
        if (this.auth.isStudent()) {
          const suggestions = await this.studentService.mySuggestions();
          this.suggestedIds.set(new Set(suggestions.flatMap(s => (s.exam_id ? [s.exam_id] : []))));
        }
      }),
    ]);
    this.listedExams.set(data);
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
