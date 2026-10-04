import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  ChangeDetectorRef,
  ElementRef,
  viewChild,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { ThemeService } from '../../../../services/theme.service';
import { AuthService } from '../../../../services/auth.service';
import { hasPartStimulus, partOptionLabels } from '../../models/exam.model';
import { parseOrderingTokens, type OrderingToken } from '../../models/exam-ordering';
import { OrderingAnswerComponent } from '../../components/ordering-answer/ordering-answer';
import type { Exam, ExamSection, ExamQuestion, UserAnswers } from '../../models/exam.model';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { HskBadgeComponent } from '../../../../components/shared/badge/hsk-badge';
import { ThemeToggleComponent } from '../../../../components/shared/theme-toggle/theme-toggle';

@Component({
  selector: 'app-exam-take',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppIconComponent, HskBadgeComponent, ThemeToggleComponent, OrderingAnswerComponent],
  templateUrl: './exam-take.html',
  styleUrl: './exam-take.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamTakeComponent implements OnInit, OnDestroy {
  readonly hasPartStimulus = hasPartStimulus;
  readonly partOptionLabels = partOptionLabels;

  /** Câu trắc nghiệm có phương án dạng ảnh (hiển thị lưới 3 cột) */
  hasOptionImages(q: ExamQuestion): boolean {
    return (q.options ?? []).some(o => !!o.image_url);
  }

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly examService = inject(ExamService);
  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly theme = inject(ThemeService);

  examId = signal<string>('');
  exam = signal<Exam | null>(null);
  isLoading = signal<boolean>(true);
  /** Đề nội bộ mở bằng link khi chưa đăng nhập */
  comingSoon = signal<boolean>(false);

  // Trạng thái phiên thi
  isExamStarted = signal<boolean>(false);
  timeRemainingSeconds = signal<number>(0);
  initialDurationSeconds = signal<number>(0);
  private timerInterval: any = null;

  // Câu trả lời & Đánh dấu xem lại
  answers = signal<UserAnswers>({});
  flaggedQuestionIds = signal<Set<string>>(new Set());

  // Điều hướng phần thi & câu hỏi
  activeSectionIndex = signal<number>(0);
  activeQuestionId = signal<string>('');

  // Trạng thái Modal nộp bài
  isSubmitModalOpen = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  // Audio Player State cho phần Nghe
  audioRef = viewChild<ElementRef<HTMLAudioElement>>('audioPlayer');
  isAudioPlaying = signal<boolean>(false);
  audioCurrentTime = signal<number>(0);
  audioDuration = signal<number>(0);

  // Computed: Danh sách tất cả câu hỏi theo thứ tự tuần tự
  allQuestions = computed(() => {
    const ex = this.exam();
    if (!ex?.sections) return [];
    const list: { q: ExamQuestion; sectionIndex: number; partIndex: number }[] = [];
    ex.sections.forEach((sec, sIdx) => {
      sec.parts?.forEach((part, pIdx) => {
        part.questions?.forEach(q => {
          list.push({ q, sectionIndex: sIdx, partIndex: pIdx });
        });
      });
    });
    return list;
  });

  /** Từ cần sắp xếp của mỗi câu dạng 'ordering' (theo question id) — tách 1 lần khi tải đề */
  orderingTokens = computed(() => {
    const map = new Map<string, OrderingToken[]>();
    for (const sec of this.exam()?.sections ?? []) {
      for (const part of sec.parts ?? []) {
        if (part.question_type !== 'ordering') continue;
        for (const q of part.questions ?? []) {
          if (q.id) map.set(q.id, parseOrderingTokens(q.content));
        }
      }
    }
    return map;
  });

  // Computed: Thống kê số câu đã làm
  answeredCount = computed(() => {
    const ans = this.answers();
    return Object.values(ans).filter(v => v !== undefined && v.trim().length > 0).length;
  });

  totalQuestionCount = computed(() => this.allQuestions().length);

  progressPercent = computed(() => {
    const total = this.totalQuestionCount();
    if (total === 0) return 0;
    return Math.round((this.answeredCount() / total) * 100);
  });

  // Computed: Định dạng thời gian đếm ngược MM:SS
  formattedTime = computed(() => {
    const s = this.timeRemainingSeconds();
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    const mStr = mins < 10 ? `0${mins}` : `${mins}`;
    const sStr = secs < 10 ? `0${secs}` : `${secs}`;
    return `${mStr}:${sStr}`;
  });

  // Computed: Cảnh báo thời gian sắp hết (< 5 phút)
  isTimeWarning = computed(() => this.timeRemainingSeconds() <= 300 && this.timeRemainingSeconds() > 60);
  isTimeCritical = computed(() => this.timeRemainingSeconds() <= 60 && this.timeRemainingSeconds() > 0);

  // Computed: Section hiện tại
  currentSection = computed<ExamSection | null>(() => {
    const ex = this.exam();
    if (!ex?.sections || ex.sections.length === 0) return null;
    return ex.sections[this.activeSectionIndex()] || ex.sections[0];
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.examId.set(id);
      this.loadExam(id);
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  async loadExam(id: string) {
    this.isLoading.set(true);
    let data = await this.examService.getExamWithDetails(id);
    // Đề nội bộ: khách đọc được tên đề nhưng không có câu hỏi → coi như sắp ra mắt
    if (data && data.visibility !== 'public') {
      await this.auth.ready;
      if (!this.auth.can('content.read')) {
        data = null;
        this.comingSoon.set(true);
      }
    }
    this.exam.set(data);
    if (data) {
      const durSecs = (data.duration_mins || 90) * 60;
      this.initialDurationSeconds.set(durSecs);
      this.timeRemainingSeconds.set(durSecs);

      // Thử khôi phục bài làm dở dang nếu có trong session
      this.restoreDraft(id);

      // Kiểm thử: ?autostart=1 vào làm bài ngay và điền sẵn vài đáp án (?modal=1 mở luôn hộp nộp bài).
      // Chỉ chạy khi nhân sự đã đăng nhập; học viên mở link này vẫn thấy màn hình chuẩn bị bình thường.
      if (this.route.snapshot.queryParamMap.get('autostart') === '1' && (await this.isStaffViewer())) {
        this.startExam();
        const sec1 = data.sections?.[0];
        if (sec1?.parts?.[0]?.questions?.[0]?.id) {
          const q1 = sec1.parts[0].questions[0].id;
          this.selectAnswer(q1, 'B');
        }
        if (sec1?.parts?.[0]?.questions?.[1]?.id) {
          const q2 = sec1.parts[0].questions[1].id;
          this.selectAnswer(q2, 'A');
        }
        if (sec1?.parts?.[1]?.questions?.[0]?.id) {
          const q3 = sec1.parts[1].questions[0].id;
          this.selectAnswer(q3, 'true');
          this.toggleFlag(q3);
        }

        if (this.route.snapshot.queryParamMap.get('modal') === '1') {
          this.openSubmitModal();
        }
      }
    }
    this.isLoading.set(false);
    this.cdr.markForCheck();
  }

  private targetEndTimeMs = 0;

  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    if (document.visibilityState === 'visible' && this.isExamStarted() && this.timerInterval) {
      this.syncTimer();
    }
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.isSubmitModalOpen() && !this.isSubmitting()) {
      this.closeSubmitModal();
    }
  }

  private async isStaffViewer(): Promise<boolean> {
    await this.auth.ready;
    return this.auth.can('content.read');
  }

  startExam() {
    this.isExamStarted.set(true);
    this.targetEndTimeMs = Date.now() + this.timeRemainingSeconds() * 1000;
    this.startTimer();
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.cdr.markForCheck();
  }

  private startTimer() {
    this.stopTimer();
    if (!this.targetEndTimeMs || this.targetEndTimeMs <= Date.now()) {
      this.targetEndTimeMs = Date.now() + this.timeRemainingSeconds() * 1000;
    }
    this.timerInterval = setInterval(() => {
      this.syncTimer();
    }, 1000);
  }

  private syncTimer() {
    if (!this.isExamStarted() || !this.targetEndTimeMs) return;
    const remaining = Math.max(0, Math.ceil((this.targetEndTimeMs - Date.now()) / 1000));
    this.timeRemainingSeconds.set(remaining);
    if (remaining <= 0) {
      this.stopTimer();
      this.handleTimeUp();
    } else if (remaining % 10 === 0) {
      this.saveDraft();
    }
    this.cdr.markForCheck();
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private handleTimeUp() {
    alert('Thời gian làm bài đã hết! Hệ thống đang tự động nộp bài của bạn.');
    this.submitExam(true);
  }

  // Chọn đáp án cho câu hỏi
  selectAnswer(questionId: string, answer: string) {
    const current = { ...this.answers() };
    current[questionId] = answer;
    this.answers.set(current);
    this.saveDraft();
    this.cdr.markForCheck();
  }

  // Đánh dấu cờ (Flag) câu hỏi để xem lại sau
  toggleFlag(questionId: string) {
    const set = new Set(this.flaggedQuestionIds());
    if (set.has(questionId)) {
      set.delete(questionId);
    } else {
      set.add(questionId);
    }
    this.flaggedQuestionIds.set(set);
    this.saveDraft();
    this.cdr.markForCheck();
  }

  isFlagged(questionId: string): boolean {
    return this.flaggedQuestionIds().has(questionId);
  }

  isAnswered(questionId: string): boolean {
    const ans = this.answers()[questionId];
    return ans !== undefined && ans.trim().length > 0;
  }

  // Chuyển phần thi (Listening / Reading / Writing)
  hasPrevSection = computed(() => this.activeSectionIndex() > 0);
  hasNextSection = computed(() => {
    const ex = this.exam();
    return ex?.sections ? this.activeSectionIndex() < ex.sections.length - 1 : false;
  });

  /** Mọi cách chuyển phần (chọn phần, trước / sau) đều đưa về đầu phần thi */
  setSection(index: number) {
    this.leaveSectionAudio(index);
    this.activeSectionIndex.set(index);
    this.cdr.markForCheck();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prevSection() {
    if (this.hasPrevSection()) this.setSection(this.activeSectionIndex() - 1);
  }

  nextSection() {
    if (this.hasNextSection()) this.setSection(this.activeSectionIndex() + 1);
  }

  // Nhảy tới câu hỏi cụ thể trong trang
  scrollToQuestion(questionId: string, sectionIdx: number) {
    this.leaveSectionAudio(sectionIdx);
    this.activeSectionIndex.set(sectionIdx);
    this.activeQuestionId.set(questionId);
    this.cdr.markForCheck();

    setTimeout(() => {
      const el = document.getElementById(`q-${questionId}`);
      if (!el) return;
      // Đặt câu hỏi ngay dưới phần đang ghim (header, thanh audio, "Đề bài chung" của Part đó)
      // thay vì căn giữa — trên điện thoại phần ghim che mất nửa trên màn hình
      const barsBottom = Math.max(0, ...Array.from(document.querySelectorAll('[data-exam-topbar]'), b => b.getBoundingClientRect().bottom));
      let stimulus: HTMLElement | null = null;
      for (let node = el.parentElement; node && !stimulus; node = node.parentElement) {
        stimulus = node.querySelector<HTMLElement>(':scope > .part-stimulus--sticky');
      }
      // Khối "Đề bài chung" ghim ở vị trí `top` của nó (dưới header + thanh audio)
      const covered = (stimulus ? parseFloat(getComputedStyle(stimulus).top) + stimulus.offsetHeight : barsBottom) + 12;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - covered, behavior: 'smooth' });
    }, 100);
  }

  /** Rời phần Nghe thì thẻ audio bị huỷ (tiếng dừng) — cập nhật nút phát ngay, không chờ sự kiện pause */
  private leaveSectionAudio(nextIndex: number) {
    if (nextIndex !== this.activeSectionIndex()) this.isAudioPlaying.set(false);
  }

  // Audio Player Controls
  /**
   * Thanh phát chỉ tồn tại khi đang ở phần Nghe: rời phần thì thẻ <audio> bị huỷ (tiếng dừng).
   * Trạng thái phát lấy từ sự kiện play/pause của chính thẻ audio; vị trí nghe được nhớ theo file
   * để quay lại phần Nghe thì tiếp tục từ chỗ cũ.
   */
  private readonly audioPositions = new Map<string, number>();

  toggleAudio() {
    const audio = this.audioRef()?.nativeElement;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch(e => console.error('Audio play error:', e));
    } else {
      audio.pause();
    }
  }

  onAudioLoaded() {
    const audio = this.audioRef()?.nativeElement;
    if (!audio) return;
    const saved = this.audioPositions.get(audio.currentSrc || audio.src) ?? 0;
    if (saved > 0 && saved < audio.duration) audio.currentTime = saved;
    this.isAudioPlaying.set(!audio.paused);
    this.audioCurrentTime.set(audio.currentTime);
    this.audioDuration.set(audio.duration || 0);
  }

  onAudioTimeUpdate() {
    const audio = this.audioRef()?.nativeElement;
    if (audio) {
      this.audioCurrentTime.set(audio.currentTime);
      this.audioDuration.set(audio.duration || 0);
      this.audioPositions.set(audio.currentSrc || audio.src, audio.currentTime);
    }
  }

  onAudioSeek(event: Event) {
    const input = event.target as HTMLInputElement;
    const audio = this.audioRef()?.nativeElement;
    if (audio) {
      audio.currentTime = Number(input.value);
    }
  }

  onAudioEnded() {
    this.isAudioPlaying.set(false);
  }

  formatAudioTime(sec: number): string {
    if (!sec || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  }

  // Modal Nộp bài
  openSubmitModal() {
    this.isSubmitModalOpen.set(true);
  }

  closeSubmitModal() {
    this.isSubmitModalOpen.set(false);
  }

  // Nộp bài thi
  async submitExam(force = false) {
    const ex = this.exam();
    if (!ex || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.stopTimer();

    // Đáp án không được tải khi làm bài — chỉ lấy lúc nộp
    const res = await this.examService.attachAnswers(ex);
    if (res.error) {
      this.isSubmitting.set(false);
      this.saveDraft();
      if (!force) this.startTimer();
      alert('Không nộp được bài do lỗi kết nối. Bài làm đã được lưu, vui lòng bấm Nộp bài lại.');
      this.cdr.markForCheck();
      return;
    }

    const timeSpent = this.initialDurationSeconds() - this.timeRemainingSeconds();
    const submission = this.examService.gradeExam(ex, this.answers(), Math.max(0, timeSpent));

    // Xoá nháp sau khi nộp
    this.clearDraft(ex.id || '');

    // Điều hướng sang trang kết quả
    this.router.navigate(['/exams', ex.id, 'result'], {
      queryParams: { submissionId: submission.id }
    });
  }

  // Quản lý bản nháp (Draft) chống mất bài khi reload
  private getDraftKey(id: string) {
    return `mayo_exam_draft_${id}`;
  }

  private saveDraft() {
    const ex = this.exam();
    if (!ex?.id) return;
    try {
      const draft = {
        answers: this.answers(),
        flagged: Array.from(this.flaggedQuestionIds()),
        timeRemaining: this.timeRemainingSeconds(),
        targetEndTime: this.targetEndTimeMs,
        isStarted: this.isExamStarted(),
      };
      sessionStorage.setItem(this.getDraftKey(ex.id), JSON.stringify(draft));
    } catch {}
  }

  private restoreDraft(id: string) {
    try {
      const str = sessionStorage.getItem(this.getDraftKey(id));
      if (!str) return;
      const draft = JSON.parse(str);
      if (draft.answers) this.answers.set(draft.answers);
      if (draft.flagged) this.flaggedQuestionIds.set(new Set(draft.flagged));

      let remaining = this.initialDurationSeconds();
      if (draft.targetEndTime) {
        remaining = Math.max(0, Math.ceil((draft.targetEndTime - Date.now()) / 1000));
        this.targetEndTimeMs = draft.targetEndTime;
      } else if (draft.timeRemaining !== undefined) {
        remaining = Math.max(0, Number(draft.timeRemaining));
        this.targetEndTimeMs = Date.now() + remaining * 1000;
      }
      this.timeRemainingSeconds.set(remaining);

      if (draft.isStarted) {
        this.isExamStarted.set(true);
        window.scrollTo({ top: 0, behavior: 'instant' });
        if (remaining <= 0) {
          this.stopTimer();
          this.handleTimeUp();
        } else {
          this.startTimer();
        }
      }
    } catch {}
  }

  private clearDraft(id: string) {
    try {
      sessionStorage.removeItem(this.getDraftKey(id));
    } catch {}
  }
}
