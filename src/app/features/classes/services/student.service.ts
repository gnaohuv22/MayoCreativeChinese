import { Injectable, inject } from '@angular/core';
import { getSupabase } from '../../../services/supabase.client';
import { AuthService } from '../../../services/auth.service';
import { RequestCache } from '../../../services/request-cache';
import type { ExamSubmission, UserAnswers } from '../../exams/models/exam.model';
import type { ClassAnnouncement, ClassSuggestion, ExamAttempt } from '../models/class.model';
import { ATTEMPT_COLUMNS } from './class.service';

const CACHE_TTL_MS = 5 * 60 * 1000;
const SUGGESTION_COLUMNS = 'id, class_id, kind, exam_id, collection, levels, note, created_at, exam:exams(id, title, hsk_level, hsk_version, visibility)';

/** Dữ liệu lớp của học viên đang đăng nhập (RLS chỉ trả lớp của chính họ) */
@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly supabase = getSupabase();
  private readonly auth = inject(AuthService);
  private readonly cache = new RequestCache(CACHE_TTL_MS);

  /** Gợi ý của lớp; [] nếu không phải học viên hoặc chưa có lớp */
  async mySuggestions(): Promise<ClassSuggestion[]> {
    await this.auth.ready;
    const classId = this.auth.student()?.class?.id;
    if (!classId) return [];
    return this.cache.get(`suggestions:${classId}`, async () => {
      const { data, error } = await this.supabase.from('class_suggestions').select(SUGGESTION_COLUMNS).eq('class_id', classId).order('created_at');
      if (error) console.error('Suggestions query failed:', error);
      return (data ?? []) as unknown as ClassSuggestion[];
    });
  }

  async myAnnouncements(): Promise<ClassAnnouncement[]> {
    const classId = this.auth.student()?.class?.id;
    if (!classId) return [];
    const { data, error } = await this.supabase
      .from('class_announcements')
      .select('*')
      .eq('class_id', classId)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) console.error('Announcements query failed:', error);
    return (data ?? []) as ClassAnnouncement[];
  }

  async myAttempts(limit = 20): Promise<ExamAttempt[]> {
    const { data, error } = await this.supabase
      .from('exam_attempts')
      .select(ATTEMPT_COLUMNS)
      .order('submitted_at', { ascending: false })
      .limit(limit);
    if (error) console.error('Attempts query failed:', error);
    return (data ?? []) as unknown as ExamAttempt[];
  }

  /** Lưu bài nộp lên tài khoản (chỉ học viên; nhân sự làm bài thì không lưu) */
  async submitAttempt(submission: ExamSubmission, answers: UserAnswers): Promise<{ error?: string }> {
    if (!this.auth.isStudent()) return {};
    const { error } = await this.supabase.rpc('submit_exam_attempt', {
      p_attempt: {
        exam_id: submission.examId,
        score: submission.totalScoreEarned,
        total_score: submission.totalScoreMax,
        passing_score: submission.passingScore,
        correct_count: submission.correctCount,
        question_count: submission.totalQuestions,
        section_scores: submission.sectionResults.map(s => ({
          section_type: s.sectionType,
          title: s.title,
          score: s.scoreEarned,
          max_score: s.maxScore,
        })),
        answers,
        time_spent_secs: submission.timeSpentSeconds,
      },
    });
    if (error) console.error('submit_exam_attempt failed:', error);
    return error ? { error: error.message } : {};
  }
}
