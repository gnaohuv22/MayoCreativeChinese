import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { HskBadgeComponent } from '../../../../components/shared/badge/hsk-badge';
import { CourseService } from '../../../courses/services/course.service';
import { scopeRoutes } from '../../../flashcards/utils/vocab-scope.util';
import { VOCAB_COLLECTIONS } from '../../../flashcards/models/vocab-card.model';
import { StudentService } from '../../services/student.service';
import { RemoteProgressStore } from '../../../flashcards/services/remote-progress.store';
import { CLASS_STATUS_LABELS, STAFF_ROLE_LABELS, STUDY_MODE_LABELS, type ClassAnnouncement, type ClassSuggestion, type ExamAttempt, type LearningSummary } from '../../models/class.model';
import { formatDate, formatDateTime } from '../../utils/class-display.util';
import { RecoveryEmailComponent } from '../../components/recovery-email/recovery-email';
import { DeviceListComponent } from '../../components/device-list/device-list';
import type { DeviceList, LearnerDevice } from '../../../../services/auth.service';
import { vocabSuggestionLabel, vocabSuggestionParam } from '../../utils/suggestion.util';
import { ACCESS_MODULE_LABELS, UNLOCK_CONTACT_URL, type AccessModule } from '../../../../components/shared/visibility/content-visibility';

/** /hoc-vien — lớp của tôi: thông tin lớp, thông báo, gợi ý học, kết quả bài thi */
@Component({
  selector: 'app-student-home',
  standalone: true,
  imports: [RouterLink, NavHeaderComponent, AppIconComponent, HskBadgeComponent, RecoveryEmailComponent, DeviceListComponent],
  templateUrl: './student-home.html',
  styleUrl: './student-home.css',
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

  protected readonly unlockUrl = UNLOCK_CONTACT_URL;

  /** Quyền Mayo+ của khách: còn hạn đến ngày nào */
  readonly paidModules = computed(() =>
    (Object.keys(ACCESS_MODULE_LABELS) as AccessModule[]).map(module => {
      const grant = this.auth.accessGrants().find(g => g.module === module);
      return { module, label: ACCESS_MODULE_LABELS[module], open: this.auth.hasAccess(module), expiresAt: grant?.expires_at ?? null };
    }),
  );
  readonly hasClosedModule = computed(() => this.paidModules().some(m => !m.open));

  readonly cls = computed(() => this.auth.student()?.class ?? null);
  private readonly courseService = inject(CourseService);
  readonly courseName = computed(() => this.courseService.nameOf(this.cls()?.course_slug));
  readonly announcements = signal<ClassAnnouncement[]>([]);
  readonly suggestions = signal<ClassSuggestion[]>([]);
  readonly attempts = signal<ExamAttempt[]>([]);
  readonly loading = signal(true);
  readonly summary = signal<LearningSummary | null>(null);
  readonly devices = signal<DeviceList | null>(null);
  readonly removingDevice = signal<string | null>(null);
  readonly deviceError = signal<string | null>(null);

  readonly examSuggestions = computed(() => this.suggestions().filter(s => s.kind === 'exam' && s.exam));
  readonly vocabSuggestions = computed(() => this.suggestions().filter(s => s.kind === 'vocab' && s.collection));
  /** exam_id → điểm cao nhất */
  readonly bestScores = computed(() => {
    const map = new Map<string, number>();
    for (const a of this.attempts()) map.set(a.exam_id, Math.max(map.get(a.exam_id) ?? 0, Number(a.score)));
    return map;
  });

  constructor() {
    void this.courseService.loadNames();
    // Quyền Mayo+ có thể vừa được cấp trong lúc đang đăng nhập
    this.auth.loadContext();
    this.load();
  }

  async load() {
    this.loading.set(true);
    const [announcements, suggestions, attempts, devices, summary] = await Promise.all([
      this.studentService.myAnnouncements(),
      this.studentService.mySuggestions(),
      this.studentService.myAttempts(),
      this.auth.myDevices(),
      this.studentService.myLearningSummary(),
    ]);
    this.summary.set(summary);
    this.devices.set(devices);
    this.announcements.set(announcements);
    this.suggestions.set(suggestions);
    this.attempts.set(attempts);
    this.loading.set(false);
  }

  async removeDevice(device: LearnerDevice) {
    if (!confirm(`Gỡ "${device.label || 'thiết bị'}"? Thiết bị đó sẽ bị đăng xuất, và 30 ngày tới bạn không tự gỡ thêm được.`)) return;
    this.removingDevice.set(device.device_id);
    this.deviceError.set(null);
    const res = await this.auth.removeMyDevice(device.device_id);
    this.removingDevice.set(null);
    if (res.error) this.deviceError.set(res.error);
    else this.devices.set(res.list ?? null);
  }

  /** "T2" … "CN" cho ngày yyyy-mm-dd */
  weekdayLabel(day: string): string {
    const d = new Date(`${day}T00:00:00`).getDay();
    return d === 0 ? 'CN' : `T${d + 1}`;
  }

  streakMessage(s: LearningSummary): string {
    if (s.studied_today) return s.current_streak > 1 ? 'Hôm nay bạn đã học. Giữ vững chuỗi nhé!' : 'Khởi đầu tốt! Mai học tiếp để nối chuỗi.';
    if (s.current_streak > 0) return `Học hôm nay để giữ chuỗi ${s.current_streak} ngày.`;
    return 'Ôn vài từ hôm nay để bắt đầu chuỗi ngày học.';
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
