import { Injectable } from '@angular/core';
import { getSupabase } from '../../../services/supabase.client';
import type {
  HskVersion,
  Exam,
  ExamFilter,
  ExamSection,
  ExamPart,
  ExamQuestion,
  ExamOption,
  UserAnswers,
  ExamSubmission,
  SectionScoreResult,
  QuestionGradeResult
} from '../models/exam.model';
import { renumberQuestions } from '../models/exam.model';
import { orderingAnswerMatches, parseOrderingTokens } from '../models/exam-ordering';
import { compressImage } from '../utils/image-compress.util';
import { RequestCache } from '../../../services/request-cache';

const EXAM_COLUMNS = 'id, title, hsk_level, hsk_version, duration_mins, total_score, passing_score, description, is_published, created_at, updated_at';
const SECTION_COLUMNS = 'id, exam_id, section_type, title, sort_order, max_score, instructions, audio_url';
const PART_COLUMNS = 'id, section_id, title, question_type, instructions, sort_order, example_text, stimulus_text, stimulus_image_url, stimulus_audio_url, option_labels';
/** Cột học viên (anon) được đọc — đáp án lấy riêng qua get_exam_answers (migration 011) */
const QUESTION_PUBLIC_COLUMNS = 'id, part_id, question_num, content, audio_url, image_url, score, sort_order';
const QUESTION_COLUMNS = `${QUESTION_PUBLIC_COLUMNS}, correct_answer, explanation`;
const OPTION_COLUMNS = 'id, question_id, label, content, image_url, sort_order';

/** Cache phía học viên (đề đã xuất bản, không kèm đáp án); ghi bất kỳ → xoá cache */
const CACHE_TTL_MS = 10 * 60 * 1000;

/** RLS chặn ghi thì Supabase không báo lỗi mà chỉ trả về 0 dòng */
const NO_ROW_ERROR = 'Không tìm thấy đề thi hoặc bạn không có quyền thực hiện thao tác này';

@Injectable({ providedIn: 'root' })
export class ExamService {
  private readonly supabase = getSupabase();
  private readonly BUCKET_NAME = 'exam-assets';
  private readonly cache = new RequestCache(CACHE_TTL_MS);

  /** Lấy danh sách đề thi kèm bộ lọc (HSK level, version, published status) */
  async getExams(filter?: ExamFilter): Promise<Exam[]> {
    // Chỉ cache danh sách học viên xem; trang quản trị luôn lấy mới
    if (filter?.is_published !== true) return this.loadExams(filter);
    const list = await this.cache.get(`list:${JSON.stringify(filter)}`, () => this.loadExams(filter), l => l.length > 0);
    return structuredClone(list);
  }

  private async loadExams(filter?: ExamFilter): Promise<Exam[]> {
    let query = this.supabase
      .from('exams')
      .select(`${EXAM_COLUMNS}, sections:exam_sections(section_type, sort_order, parts:exam_parts(questions:exam_questions(id)))`)
      .order('hsk_level', { ascending: true })
      .order('created_at', { ascending: false });

    if (filter?.hsk_level && filter.hsk_level !== 'all') {
      query = query.eq('hsk_level', filter.hsk_level);
    }
    if (filter?.hsk_version && filter.hsk_version !== 'all') {
      query = query.eq('hsk_version', filter.hsk_version);
    }
    if (filter?.is_published !== undefined && filter.is_published !== 'all') {
      query = query.eq('is_published', filter.is_published);
    }
    if (filter?.searchQuery && filter.searchQuery.trim()) {
      const search = filter.searchQuery.trim();
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Lỗi khi tải danh sách đề thi:', error);
      return [];
    }

    // Đếm số câu từ dữ liệu thật (tổng + từng phần) — người soạn không cần ghi số câu vào mô tả
    return (data ?? []).map(({ sections, ...exam }: any) => {
      const section_counts = [...(sections ?? [])]
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((sec: any) => ({
          section_type: sec.section_type,
          count: (sec.parts ?? []).reduce((sum: number, part: any) => sum + (part.questions?.length ?? 0), 0),
        }));
      return {
        ...exam,
        question_count: section_counts.reduce((sum, s) => sum + s.count, 0),
        section_counts,
      } as Exam;
    });
  }

  /**
   * Lấy chi tiết 1 đề thi bao gồm toàn bộ Sections -> Parts -> Questions -> Options.
   * withAnswers chỉ dùng cho admin (anon không có quyền đọc cột đáp án).
   */
  async getExamWithDetails(examId: string, options: { withAnswers?: boolean } = {}): Promise<Exam | null> {
    if (options.withAnswers) return this.loadExamWithDetails(examId, true);
    // Bản sao: attachAnswers ghi đáp án thẳng vào object, không để lọt vào cache
    const exam = await this.cache.get(`exam:${examId}`, () => this.loadExamWithDetails(examId, false), e => e !== null);
    return exam && structuredClone(exam);
  }

  private async loadExamWithDetails(examId: string, withAnswers: boolean): Promise<Exam | null> {
    const questionColumns = withAnswers ? QUESTION_COLUMNS : QUESTION_PUBLIC_COLUMNS;
    const { data, error } = await this.supabase
      .from('exams')
      .select(`
        ${EXAM_COLUMNS},
        sections:exam_sections(
          ${SECTION_COLUMNS},
          parts:exam_parts(
            ${PART_COLUMNS},
            questions:exam_questions(
              ${questionColumns},
              options:exam_options(${OPTION_COLUMNS})
            )
          )
        )
      `)
      .eq('id', examId)
      .single();

    if (error || !data) {
      console.error(`Lỗi khi lấy chi tiết đề thi [${examId}]:`, error);
      return null;
    }

    // Sắp xếp lại các cấp theo sort_order / question_num
    const exam = data as Exam;
    if (exam.sections) {
      exam.sections.sort((a, b) => a.sort_order - b.sort_order);
      for (const sec of exam.sections) {
        if (sec.parts) {
          sec.parts.sort((a, b) => a.sort_order - b.sort_order);
          for (const part of sec.parts) {
            if (part.questions) {
              part.questions.sort((a, b) => (a.question_num || a.sort_order) - (b.question_num || b.sort_order));
              for (const q of part.questions) {
                if (q.options) {
                  q.options.sort((a, b) => a.sort_order - b.sort_order);
                }
              }
            }
          }
        }
      }
    }

    return exam;
  }

  /** Nạp đáp án + giải thích vào đề (gọi khi học viên nộp bài / hết giờ) */
  async attachAnswers(exam: Exam): Promise<{ error?: string }> {
    const { data, error } = await this.supabase.rpc('get_exam_answers', { p_exam_id: exam.id });
    if (error) {
      console.error('Lỗi khi tải đáp án:', error);
      return { error: error.message };
    }
    const byId = new Map((data as { question_id: string; correct_answer: string; explanation: string | null }[])
      .map(a => [a.question_id, a]));
    for (const sec of exam.sections ?? []) {
      for (const part of sec.parts ?? []) {
        for (const q of part.questions ?? []) {
          const a = q.id ? byId.get(q.id) : undefined;
          q.correct_answer = a?.correct_answer ?? '';
          q.explanation = a?.explanation ?? null;
        }
      }
    }
    return {};
  }

  /** Cập nhật thông tin chung của đề thi */
  async updateExam(id: string, changes: Partial<Exam>): Promise<{ error?: string }> {
    this.cache.clear();
    const { data, error } = await this.supabase
      .from('exams')
      .update(changes)
      .eq('id', id)
      .select('id');

    if (error) {
      console.error(`Lỗi khi cập nhật đề thi [${id}]:`, error);
      return { error: error.message };
    }
    if (!data?.length) return { error: NO_ROW_ERROR };
    return {};
  }

  /** Xoá một đề thi (sẽ tự động cascade xoá toàn bộ sections, parts, questions, options) */
  async deleteExam(id: string): Promise<{ error?: string }> {
    this.cache.clear();
    const { data, error } = await this.supabase
      .from('exams')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) {
      console.error(`Lỗi khi xoá đề thi [${id}]:`, error);
      return { error: error.message };
    }
    if (!data?.length) return { error: NO_ROW_ERROR };
    return {};
  }

  /** Bật/tắt trạng thái xuất bản đề thi */
  async togglePublish(id: string, isPublished: boolean): Promise<{ error?: string }> {
    return this.updateExam(id, { is_published: isPublished });
  }

  /**
   * Lưu toàn bộ cấu trúc đề thi (Exam + Sections + Parts + Questions + Options)
   * qua RPC save_full_exam — một transaction, lỗi ở bất kỳ cấp nào sẽ rollback toàn bộ.
   */
  async saveFullExam(exam: Exam): Promise<{ id?: string; error?: string }> {
    this.cache.clear();
    renumberQuestions(exam);
    const { data, error } = await this.supabase.rpc('save_full_exam', { p_exam: exam });
    if (error) {
      console.error('Lỗi khi lưu đề thi:', error);
      return { error: error.message };
    }
    return { id: data as string };
  }

  /**
   * Nhân bản 1 đề thi (toàn bộ Phần → Part → Câu hỏi → Lựa chọn).
   * Bản sao luôn ở trạng thái nháp; file ảnh/audio dùng chung URL với đề gốc.
   */
  async duplicateExam(examId: string): Promise<{ id?: string; error?: string }> {
    const source = await this.getExamWithDetails(examId, { withAnswers: true });
    if (!source) return { error: 'Không tìm thấy đề thi gốc' };

    const copy: Exam = {
      ...source,
      id: undefined,
      created_at: undefined,
      updated_at: undefined,
      title: `${source.title} (bản sao)`,
      is_published: false,
    };
    return this.saveFullExam(copy);
  }

  /** Đếm số đề đã có theo cấp & phiên bản (để gợi ý số thứ tự đề tiếp theo) */
  async countExams(level: number, version: HskVersion): Promise<number> {
    const { count, error } = await this.supabase
      .from('exams')
      .select('id', { count: 'exact', head: true })
      .eq('hsk_level', level)
      .eq('hsk_version', version);
    return error ? 0 : count ?? 0;
  }

  /** Tải lên file Audio hoặc Image lên Supabase Storage bucket `exam-assets` */
  async uploadAsset(file: File, folder: 'audio' | 'images'): Promise<{ url?: string; error?: string }> {
    try {
      if (folder === 'images') file = await compressImage(file);
      const ext = file.name.split('.').pop() || '';
      const cleanFileName = file.name
        .substring(0, file.name.lastIndexOf('.'))
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const filePath = `${folder}/${Date.now()}_${cleanFileName}.${ext}`;

      const { error: uploadError } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          // Tên file luôn mới (timestamp) nên nội dung không bao giờ đổi → cache 1 năm
          cacheControl: '31536000',
          upsert: true,
        });

      if (uploadError) {
        console.error('Lỗi upload storage:', uploadError);
        return { error: uploadError.message };
      }

      const { data } = this.supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return { url: data.publicUrl };
    } catch (err: any) {
      console.error('Lỗi khi upload asset:', err);
      return { error: err.message || 'Lỗi khi upload file' };
    }
  }

  /** Chấm điểm bài thi và sinh kết quả chi tiết */
  gradeExam(exam: Exam, answers: UserAnswers, timeSpentSeconds: number): ExamSubmission {
    const questionResults: QuestionGradeResult[] = [];
    const sectionResults: SectionScoreResult[] = [];

    let totalRawEarned = 0;
    let totalRawPossible = 0;
    let totalQuestions = 0;
    let correctCount = 0;

    for (const sec of exam.sections || []) {
      let secRawEarned = 0;
      let secRawPossible = 0;
      let secTotalQ = 0;
      let secCorrectQ = 0;

      for (const part of sec.parts || []) {
        for (const q of part.questions || []) {
          totalQuestions++;
          secTotalQ++;
          const qMaxScore = Number(q.score) || 2.5;
          secRawPossible += qMaxScore;
          totalRawPossible += qMaxScore;

          const qId = q.id || '';
          const userAns = (answers[qId] || '').trim();
          const correctAns = (q.correct_answer || '').trim();

          const isCorrect = this.checkAnswerCorrectness(userAns, correctAns, part.question_type, q.content);
          const earned = isCorrect ? qMaxScore : 0;

          if (isCorrect) {
            correctCount++;
            secCorrectQ++;
            secRawEarned += earned;
            totalRawEarned += earned;
          }

          questionResults.push({
            questionId: qId,
            questionNum: q.question_num,
            sectionType: sec.section_type,
            questionType: part.question_type,
            content: q.content,
            audioUrl: q.audio_url,
            imageUrl: q.image_url,
            options: q.options,
            userAnswer: userAns,
            correctAnswer: correctAns,
            isCorrect,
            scoreEarned: earned,
            maxScore: qMaxScore,
            explanation: q.explanation,
          });
        }
      }

      // Điểm chuẩn hoá theo max_score của Section (thường là 100 điểm)
      const secMax = sec.max_score || 100;
      const secNormalizedScore = secRawPossible > 0
        ? Math.round((secRawEarned / secRawPossible) * secMax * 10) / 10
        : 0;
      const secPercent = secRawPossible > 0 ? Math.round((secRawEarned / secRawPossible) * 100) : 0;

      sectionResults.push({
        sectionType: sec.section_type,
        title: sec.title,
        scoreEarned: secNormalizedScore,
        maxScore: secMax,
        totalQuestions: secTotalQ,
        correctQuestions: secCorrectQ,
        percentage: secPercent,
      });
    }

    // Tổng điểm chuẩn hoá theo exam.total_score (thường là 300 điểm)
    const examTotalMax = exam.total_score || 300;
    const totalScoreEarned = totalRawPossible > 0
      ? Math.round((totalRawEarned / totalRawPossible) * examTotalMax * 10) / 10
      : 0;

    const passingScore = exam.passing_score || 180;
    const isPassed = totalScoreEarned >= passingScore;
    const accuracyPercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const submission: ExamSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      examId: exam.id || '',
      examTitle: exam.title,
      hskLevel: exam.hsk_level,
      hskVersion: exam.hsk_version,
      submittedAt: new Date().toISOString(),
      durationMins: exam.duration_mins,
      timeSpentSeconds,
      totalScoreEarned,
      totalScoreMax: examTotalMax,
      passingScore,
      isPassed,
      accuracyPercentage,
      totalQuestions,
      correctCount,
      sectionResults,
      questionResults,
    };

    this.saveSubmission(submission);
    return submission;
  }

  /** So khớp đáp án người học với đáp án đúng theo từng dạng câu hỏi */
  private checkAnswerCorrectness(userAns: string, correctAns: string, questionType: string, content?: string | null): boolean {
    if (!userAns) return false;

    // Sắp xếp câu: đáp án đúng có thể viết "①④②③", "1423" hoặc cả câu — đổi hết về số khoanh tròn rồi so
    if (questionType === 'ordering') {
      return orderingAnswerMatches(userAns, correctAns, parseOrderingTokens(content));
    }

    const normUser = userAns.trim().toLowerCase();
    const normCorrect = correctAns.trim().toLowerCase();

    if (questionType === 'true_false') {
      const isUserTrue = ['true', 't', '1', 'đúng', 'dung', '对', 'dui'].includes(normUser);
      const isUserFalse = ['false', 'f', '0', 'sai', '错', 'cuo'].includes(normUser);
      const isCorrectTrue = ['true', 't', '1', 'đúng', 'dung', '对', 'dui'].includes(normCorrect);
      const isCorrectFalse = ['false', 'f', '0', 'sai', '错', 'cuo'].includes(normCorrect);

      if (isCorrectTrue) return isUserTrue;
      if (isCorrectFalse) return isUserFalse;
    }

    // Nếu đáp án có nhiều cách viết chấp nhận được (ngăn cách bởi '/', '|', hoặc 'hoặc')
    const splitOptions = normCorrect.split(/[/|,]|hoặc/).map(s => s.trim().replace(/\s+/g, ''));
    const cleanUser = normUser.replace(/\s+/g, '');

    if (splitOptions.includes(cleanUser)) {
      return true;
    }

    return cleanUser === normCorrect.replace(/\s+/g, '');
  }

  /** Lưu bài nộp vào localStorage */
  saveSubmission(submission: ExamSubmission): void {
    try {
      const KEY = 'mayo_exam_submissions';
      const existingStr = localStorage.getItem(KEY);
      const existing: ExamSubmission[] = existingStr ? JSON.parse(existingStr) : [];
      // Thêm mới lên đầu danh sách, giữ tối đa 50 bài nộp gần nhất
      const updated = [submission, ...existing.filter(s => s.id !== submission.id)].slice(0, 50);
      localStorage.setItem(KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Không thể lưu submission vào localStorage:', e);
    }
  }

  /** Lấy kết quả bài nộp theo ID */
  getSubmission(submissionId: string): ExamSubmission | null {
    try {
      const KEY = 'mayo_exam_submissions';
      const existingStr = localStorage.getItem(KEY);
      if (!existingStr) return null;
      const list: ExamSubmission[] = JSON.parse(existingStr);
      return list.find(s => s.id === submissionId) || null;
    } catch (e) {
      console.error('Lỗi khi đọc submission từ localStorage:', e);
      return null;
    }
  }

  /** Lấy danh sách bài nộp của 1 đề thi cụ thể */
  getSubmissionsByExam(examId: string): ExamSubmission[] {
    try {
      const KEY = 'mayo_exam_submissions';
      const existingStr = localStorage.getItem(KEY);
      if (!existingStr) return [];
      const list: ExamSubmission[] = JSON.parse(existingStr);
      return list.filter(s => s.examId === examId);
    } catch {
      return [];
    }
  }
}

