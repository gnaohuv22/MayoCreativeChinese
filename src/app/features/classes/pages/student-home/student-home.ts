import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { HskBadgeComponent } from '../../../../components/shared/badge/hsk-badge';
import { COURSE_DETAILS } from '../../../courses/data/course-details.data';
import { scopeRoutes } from '../../../flashcards/utils/vocab-scope.util';
import { VOCAB_COLLECTIONS } from '../../../flashcards/models/vocab-card.model';
import { StudentService } from '../../services/student.service';
import { RemoteProgressStore } from '../../../flashcards/services/remote-progress.store';
import { CLASS_STATUS_LABELS, STAFF_ROLE_LABELS, STUDY_MODE_LABELS, type ClassAnnouncement, type ClassSuggestion, type ExamAttempt } from '../../models/class.model';
import { formatDate, formatDateTime } from '../../utils/class-display.util';
import { vocabSuggestionLabel, vocabSuggestionParam } from '../../utils/suggestion.util';

/** /hoc-vien — lớp của tôi: thông tin lớp, thông báo, gợi ý học, kết quả bài thi */
@Component({
  selector: 'app-student-home',
  standalone: true,
  imports: [RouterLink, NavHeaderComponent, AppIconComponent, HskBadgeComponent],
  templateUrl: './student-home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentHomeComponent {
  protected readonly auth = inject(AuthService);
  private readonly studentService = inject(StudentService);
  private readonly router = inject(Router);
  private readonly progressStore = inject(RemoteProgressStore);

  protected readonly statusLabels = CLASS_STATUS_LABELS;
  protected readonly modeLabels = STUDY_MODE_LABELS;
  protected readonly roleLabels = STAFF_ROLE_LABELS;
  protected readonly formatDate = formatDate;
  protected readonly formatDateTime = formatDateTime;
  protected readonly vocabLabel = vocabSuggestionLabel;

  readonly cls = computed(() => this.auth.student()?.class ?? null);
  readonly courseName = computed(() => COURSE_DETAILS.find(c => c.slug === this.cls()?.course_slug)?.name ?? '');
  readonly announcements = signal<ClassAnnouncement[]>([]);
  readonly suggestions = signal<ClassSuggestion[]>([]);
  readonly attempts = signal<ExamAttempt[]>([]);
  readonly loading = signal(true);

  readonly examSuggestions = computed(() => this.suggestions().filter(s => s.kind === 'exam' && s.exam));
  readonly vocabSuggestions = computed(() => this.suggestions().filter(s => s.kind === 'vocab' && s.collection));
  /** exam_id → điểm cao nhất */
  readonly bestScores = computed(() => {
    const map = new Map<string, number>();
    for (const a of this.attempts()) map.set(a.exam_id, Math.max(map.get(a.exam_id) ?? 0, Number(a.score)));
    return map;
  });

  constructor() {
    this.load();
  }

  async load() {
    this.loading.set(true);
    const [announcements, suggestions, attempts] = await Promise.all([
      this.studentService.myAnnouncements(),
      this.studentService.mySuggestions(),
      this.studentService.myAttempts(),
    ]);
    this.announcements.set(announcements);
    this.suggestions.set(suggestions);
    this.attempts.set(attempts);
    this.loading.set(false);
  }

  vocabRoute(s: ClassSuggestion): string[] {
    // Bộ chia bài / chủ đề → trang chọn bài; bộ phẳng → vào flashcard (giống trang chọn cấp)
    const routes = scopeRoutes({ collection: s.collection!, levelParam: vocabSuggestionParam(s) });
    return VOCAB_COLLECTIONS[s.collection!].grouping ? routes.back : routes.study;
  }

  passed(a: ExamAttempt): boolean | null {
    return a.passing_score == null ? null : Number(a.score) >= Number(a.passing_score);
  }

  async signOut() {
    // Ghi nốt tiến độ flashcard đang chờ trước khi mất phiên
    await this.progressStore.flush();
    await this.auth.signOut();
    await this.router.navigateByUrl('/');
  }
}
