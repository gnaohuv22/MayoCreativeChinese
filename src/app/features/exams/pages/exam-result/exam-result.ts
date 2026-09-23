import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import type { ExamSubmission, QuestionGradeResult } from '../../models/exam.model';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { HskBadgeComponent } from '../../../../components/shared/badge/hsk-badge';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';

type FilterType = 'all' | 'correct' | 'incorrect' | 'unanswered';

@Component({
  selector: 'app-exam-result',
  standalone: true,
  imports: [CommonModule, RouterLink, AppIconComponent, HskBadgeComponent, NavHeaderComponent],
  templateUrl: './exam-result.html',
  styleUrl: './exam-result.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamResultComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly examService = inject(ExamService);
  private readonly cdr = inject(ChangeDetectorRef);

  submission = signal<ExamSubmission | null>(null);
  isLoading = signal<boolean>(true);
  currentFilter = signal<FilterType>('all');

  // Computed: Lọc câu hỏi theo trạng thái
  filteredQuestions = computed(() => {
    const sub = this.submission();
    if (!sub?.questionResults) return [];

    const f = this.currentFilter();
    return sub.questionResults.filter(q => {
      const isUnanswered = !q.userAnswer || q.userAnswer.trim().length === 0;
      if (f === 'correct') return q.isCorrect;
      if (f === 'incorrect') return !q.isCorrect && !isUnanswered;
      if (f === 'unanswered') return isUnanswered;
      return true;
    });
  });

  // Computed: Đếm số lượng theo filter
  counts = computed(() => {
    const sub = this.submission();
    if (!sub?.questionResults) return { all: 0, correct: 0, incorrect: 0, unanswered: 0 };

    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    for (const q of sub.questionResults) {
      const isUnanswered = !q.userAnswer || q.userAnswer.trim().length === 0;
      if (q.isCorrect) correct++;
      else if (isUnanswered) unanswered++;
      else incorrect++;
    }

    return {
      all: sub.questionResults.length,
      correct,
      incorrect,
      unanswered,
    };
  });

  // Định dạng thời gian hoàn thành (MM phút SS giây)
  timeSpentFormatted = computed(() => {
    const sub = this.submission();
    if (!sub) return '0 phút';
    const totalSec = sub.timeSpentSeconds || 0;
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins === 0) return `${secs} giây`;
    return `${mins} phút ${secs > 0 ? secs + ' giây' : ''}`.trim();
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const subId = params['submissionId'];
      const examId = this.route.snapshot.paramMap.get('id');

      if (subId) {
        const sub = this.examService.getSubmission(subId);
        if (sub) {
          this.submission.set(sub);
          this.isLoading.set(false);
          this.cdr.markForCheck();
          return;
        }
      }

      // Nếu không có subId, tìm bài nộp gần nhất của examId này hoặc tạo bài mẫu nếu xem preview
      if (examId) {
        const list = this.examService.getSubmissionsByExam(examId);
        if (list.length > 0 && params['preview'] !== '1') {
          this.submission.set(list[0]);
          this.isLoading.set(false);
          this.cdr.markForCheck();
          return;
        }

        // Tự động nạp mẫu kết quả chuẩn từ cấu trúc đề để preview
        this.examService.getExamWithDetails(examId).then(ex => {
          if (ex) {
            const answers: Record<string, string> = {};
            ex.sections?.forEach(sec => {
              sec.parts?.forEach(part => {
                part.questions?.forEach((q, idx) => {
                  if (idx % 3 === 0) {
                    answers[q.id || ''] = q.correct_answer;
                  } else if (idx % 3 === 1) {
                    answers[q.id || ''] = q.correct_answer;
                  } else {
                    answers[q.id || ''] = 'A'; // phương án thử nghiệm
                  }
                });
              });
            });
            const sub = this.examService.gradeExam(ex, answers, 1480);
            this.submission.set(sub);
          }
          this.isLoading.set(false);
          this.cdr.markForCheck();
        });
        return;
      }

      this.isLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  setFilter(f: FilterType) {
    this.currentFilter.set(f);
    this.cdr.markForCheck();
  }

  retakeExam() {
    const sub = this.submission();
    if (sub?.examId) {
      this.router.navigate(['/exams', sub.examId, 'take']);
    }
  }
}
