import { Injectable } from '@angular/core';
import { getSupabase } from '../../flashcards/config/supabase.config';
import type {
  Exam,
  ExamFilter,
  ExamSection,
  ExamPart,
  ExamQuestion,
  ExamOption
} from '../models/exam.model';

@Injectable({ providedIn: 'root' })
export class ExamService {
  private readonly supabase = getSupabase();
  private readonly BUCKET_NAME = 'exam-assets';

  /** Lấy danh sách đề thi kèm bộ lọc (HSK level, version, published status) */
  async getExams(filter?: ExamFilter): Promise<Exam[]> {
    let query = this.supabase
      .from('exams')
      .select('*, sections:exam_sections(id, parts:exam_parts(id, questions:exam_questions(id)))')
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

    // Đếm tổng số câu hỏi từ các quan hệ lồng nhau
    return (data ?? []).map((exam: any) => {
      let qCount = 0;
      if (exam.sections && Array.isArray(exam.sections)) {
        for (const sec of exam.sections) {
          if (sec.parts && Array.isArray(sec.parts)) {
            for (const part of sec.parts) {
              if (part.questions && Array.isArray(part.questions)) {
                qCount += part.questions.length;
              }
            }
          }
        }
      }
      return {
        ...exam,
        question_count: qCount
      } as Exam;
    });
  }

  /** Lấy chi tiết 1 đề thi bao gồm toàn bộ Sections -> Parts -> Questions -> Options */
  async getExamWithDetails(examId: string): Promise<Exam | null> {
    const { data, error } = await this.supabase
      .from('exams')
      .select(`
        *,
        sections:exam_sections(
          *,
          parts:exam_parts(
            *,
            questions:exam_questions(
              *,
              options:exam_options(*)
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

  /** Tạo một đề thi mới */
  async createExam(exam: Omit<Exam, 'id' | 'created_at' | 'updated_at' | 'sections' | 'question_count'>): Promise<{ id?: string; error?: string }> {
    const { data, error } = await this.supabase
      .from('exams')
      .insert(exam)
      .select('id')
      .single();

    if (error) {
      console.error('Lỗi khi tạo đề thi:', error);
      return { error: error.message };
    }
    return { id: data.id };
  }

  /** Cập nhật thông tin chung của đề thi */
  async updateExam(id: string, changes: Partial<Exam>): Promise<{ error?: string }> {
    const { error } = await this.supabase
      .from('exams')
      .update(changes)
      .eq('id', id);

    if (error) {
      console.error(`Lỗi khi cập nhật đề thi [${id}]:`, error);
      return { error: error.message };
    }
    return {};
  }

  /** Xoá một đề thi (sẽ tự động cascade xoá toàn bộ sections, parts, questions, options) */
  async deleteExam(id: string): Promise<{ error?: string }> {
    const { error } = await this.supabase
      .from('exams')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Lỗi khi xoá đề thi [${id}]:`, error);
      return { error: error.message };
    }
    return {};
  }

  /** Bật/tắt trạng thái xuất bản đề thi */
  async togglePublish(id: string, isPublished: boolean): Promise<{ error?: string }> {
    return this.updateExam(id, { is_published: isPublished });
  }

  /** Lưu toàn bộ cấu trúc đề thi (Exam + Sections + Parts + Questions + Options) */
  async saveFullExam(exam: Exam): Promise<{ id?: string; error?: string }> {
    try {
      let examId = exam.id;

      // 1. Tạo hoặc Cập nhật bảng `exams`
      const examPayload = {
        title: exam.title,
        hsk_level: exam.hsk_level,
        hsk_version: exam.hsk_version,
        duration_mins: exam.duration_mins,
        total_score: exam.total_score,
        passing_score: exam.passing_score,
        description: exam.description || null,
        is_published: exam.is_published,
      };

      if (!examId) {
        const createRes = await this.createExam(examPayload);
        if (createRes.error || !createRes.id) {
          return { error: createRes.error || 'Không thể tạo đề thi' };
        }
        examId = createRes.id;
      } else {
        const updateRes = await this.updateExam(examId, examPayload);
        if (updateRes.error) {
          return { error: updateRes.error };
        }
        // Xoá các sections cũ để ghi đè cấu trúc mới sạch sẽ
        await this.supabase.from('exam_sections').delete().eq('exam_id', examId);
      }

      // 2. Lưu từng Section -> Part -> Question -> Option
      if (exam.sections && exam.sections.length > 0) {
        for (let sIdx = 0; sIdx < exam.sections.length; sIdx++) {
          const sec = exam.sections[sIdx];
          const { data: secData, error: secErr } = await this.supabase
            .from('exam_sections')
            .insert({
              exam_id: examId,
              section_type: sec.section_type,
              title: sec.title,
              sort_order: sIdx + 1,
              max_score: sec.max_score || 100,
              instructions: sec.instructions || null,
              audio_url: sec.audio_url || null,
            })
            .select('id')
            .single();

          if (secErr || !secData) {
            console.error('Lỗi khi lưu phần thi:', secErr);
            continue;
          }

          const sectionId = secData.id;

          if (sec.parts && sec.parts.length > 0) {
            for (let pIdx = 0; pIdx < sec.parts.length; pIdx++) {
              const part = sec.parts[pIdx];
              const { data: partData, error: partErr } = await this.supabase
                .from('exam_parts')
                .insert({
                  section_id: sectionId,
                  title: part.title,
                  question_type: part.question_type,
                  instructions: part.instructions || null,
                  sort_order: pIdx + 1,
                })
                .select('id')
                .single();

              if (partErr || !partData) {
                console.error('Lỗi khi lưu Part:', partErr);
                continue;
              }

              const partId = partData.id;

              if (part.questions && part.questions.length > 0) {
                for (let qIdx = 0; qIdx < part.questions.length; qIdx++) {
                  const q = part.questions[qIdx];
                  const { data: qData, error: qErr } = await this.supabase
                    .from('exam_questions')
                    .insert({
                      part_id: partId,
                      question_num: q.question_num || (qIdx + 1),
                      content: q.content || null,
                      audio_url: q.audio_url || null,
                      image_url: q.image_url || null,
                      correct_answer: q.correct_answer || '',
                      explanation: q.explanation || null,
                      score: q.score || 2.5,
                      sort_order: qIdx + 1,
                    })
                    .select('id')
                    .single();

                  if (qErr || !qData) {
                    console.error('Lỗi khi lưu câu hỏi:', qErr);
                    continue;
                  }

                  const questionId = qData.id;

                  if (q.options && q.options.length > 0) {
                    const optionsPayload = q.options.map((opt, oIdx) => ({
                      question_id: questionId,
                      label: opt.label,
                      content: opt.content,
                      image_url: opt.image_url || null,
                      sort_order: oIdx + 1,
                    }));

                    const { error: optErr } = await this.supabase
                      .from('exam_options')
                      .insert(optionsPayload);

                    if (optErr) {
                      console.error('Lỗi khi lưu lựa chọn câu hỏi:', optErr);
                    }
                  }
                }
              }
            }
          }
        }
      }

      return { id: examId };
    } catch (err: any) {
      console.error('Lỗi ngoại lệ khi lưu đề thi:', err);
      return { error: err.message || 'Lỗi không xác định khi lưu đề thi' };
    }
  }

  /** Tải lên file Audio hoặc Image lên Supabase Storage bucket `exam-assets` */
  async uploadAsset(file: File, folder: 'audio' | 'images'): Promise<{ url?: string; error?: string }> {
    try {
      const ext = file.name.split('.').pop() || '';
      const cleanFileName = file.name
        .substring(0, file.name.lastIndexOf('.'))
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const filePath = `${folder}/${Date.now()}_${cleanFileName}.${ext}`;

      const { error: uploadError } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
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
}
