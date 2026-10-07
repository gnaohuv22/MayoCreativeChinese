import { Injectable } from '@angular/core';
import { getSupabase, sessionError, writeErrorMessage } from '../../../services/supabase.client';
import type {
  ClassAnnouncement,
  ClassInput,
  ClassOption,
  ClassSuggestion,
  CreatedStudent,
  ExamAttempt,
  NewStudentRow,
  SchoolClass,
  StaffDirectoryEntry,
  Student,
  StudentProfileInput,
  StudentStatus,
  StudentVocabProgress,
  SuggestedExamInfo,
} from '../models/class.model';
import type { VocabCollection } from '../../flashcards/models/vocab-card.model';

const CLASS_COLUMNS =
  'id, code, name, course_slug, hsk_level, hsk_version, study_mode, start_date, end_date, schedule, max_students, notes, status, archived_at, created_at, updated_at, staff:class_staff(user_id, role), students:student_profiles(count)';
const STUDENT_COLUMNS =
  'user_id, username, full_name, birth_year, phone, email, parent_phone, notes, class_id, status, must_change_password, created_at';
const SUGGESTION_COLUMNS =
  'id, class_id, kind, exam_id, collection, levels, note, created_at, exam:exams(id, title, hsk_level, hsk_version, visibility)';
export const ATTEMPT_COLUMNS =
  'id, student_id, class_id, exam_id, score, total_score, passing_score, correct_count, question_count, section_scores, time_spent_secs, submitted_at, exam:exams(title, hsk_level, hsk_version)';

type ClassRow = Omit<SchoolClass, 'student_count'> & { students: { count: number }[] };

function toClass(row: ClassRow): SchoolClass {
  const { students, ...rest } = row;
  return { ...rest, student_count: students?.[0]?.count ?? 0 };
}

/** Lỗi từ hàm SQL (raise exception) → câu hiện cho nhân sự */
function rpcError(error: { code?: string; message: string }): string {
  return error.code === '42501' && !/[À-ỹ]/.test(error.message) ? writeErrorMessage(error) : error.message;
}

/** Quản lý lớp học & học viên (khu quản trị) — mọi thao tác ghi đi qua hàm SQL migration 019 */
@Injectable({ providedIn: 'root' })
export class ClassService {
  private readonly supabase = getSupabase();

  // ---------------------------------------------------------------------------
  // Lớp học
  // ---------------------------------------------------------------------------
  /** Lớp người đang đăng nhập quản lý được (admin: mọi lớp) — RLS lọc sẵn */
  async listClasses(): Promise<{ data: SchoolClass[]; error?: string }> {
    const { data, error } = await this.supabase.from('classes').select(CLASS_COLUMNS).order('archived_at', { nullsFirst: true }).order('code');
    if (error) return { data: [], error: error.message };
    return { data: (data as unknown as ClassRow[]).map(toClass) };
  }

  async getClass(id: string): Promise<{ data: SchoolClass | null; error?: string }> {
    const { data, error } = await this.supabase.from('classes').select(CLASS_COLUMNS).eq('id', id).maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data: data ? toClass(data as unknown as ClassRow) : null };
  }

  async saveClass(input: ClassInput): Promise<{ id?: string; error?: string }> {
    const expired = await sessionError();
    if (expired) return { error: expired };
    const { data, error } = await this.supabase.rpc('save_class', { p_class: input });
    return error ? { error: rpcError(error) } : { id: data as string };
  }

  async setArchived(id: string, archived: boolean): Promise<{ error?: string }> {
    const { error } = await this.supabase.rpc('set_class_archived', { p_class_id: id, p_archived: archived });
    return error ? { error: rpcError(error) } : {};
  }

  async deleteClass(id: string): Promise<{ error?: string }> {
    const { error } = await this.supabase.rpc('delete_class', { p_class_id: id });
    return error ? { error: rpcError(error) } : {};
  }

  async staffDirectory(): Promise<StaffDirectoryEntry[]> {
    const { data, error } = await this.supabase.rpc('list_staff_directory');
    if (error) console.error('list_staff_directory failed:', error);
    return (data ?? []) as StaffDirectoryEntry[];
  }

  async classOptions(): Promise<ClassOption[]> {
    const { data, error } = await this.supabase.rpc('list_class_options');
    if (error) console.error('list_class_options failed:', error);
    return (data ?? []) as ClassOption[];
  }

  // ---------------------------------------------------------------------------
  // Học viên
  // ---------------------------------------------------------------------------
  /** classId = null → mọi học viên người đang đăng nhập quản lý được */
  async listStudents(classId: string | null): Promise<{ data: Student[]; error?: string }> {
    let q = this.supabase.from('student_profiles').select(STUDENT_COLUMNS);
    if (classId) q = q.eq('class_id', classId);
    const { data, error } = await q.order('full_name');
    if (error) return { data: [], error: error.message };
    return { data: (data ?? []) as Student[] };
  }

  async createStudents(classId: string, rows: NewStudentRow[]): Promise<{ data: CreatedStudent[]; error?: string }> {
    const expired = await sessionError();
    if (expired) return { data: [], error: expired };
    const { data, error } = await this.supabase.rpc('create_students', { p_class_id: classId, p_rows: rows });
    if (error) return { data: [], error: rpcError(error) };
    return { data: (data ?? []) as CreatedStudent[] };
  }

  async updateStudent(userId: string, input: StudentProfileInput): Promise<{ error?: string }> {
    const { error } = await this.supabase.rpc('update_student', { p_student: userId, p_data: input });
    return error ? { error: rpcError(error) } : {};
  }

  async moveStudents(userIds: string[], classId: string): Promise<{ error?: string }> {
    const { error } = await this.supabase.rpc('move_students', { p_students: userIds, p_class_id: classId });
    return error ? { error: rpcError(error) } : {};
  }

  async setStudentsStatus(userIds: string[], status: StudentStatus): Promise<{ error?: string }> {
    const { error } = await this.supabase.rpc('set_students_status', { p_students: userIds, p_status: status });
    return error ? { error: rpcError(error) } : {};
  }

  async resetStudentPassword(userId: string, password: string): Promise<{ error?: string }> {
    const { error } = await this.supabase.rpc('reset_student_password', { p_student: userId, p_new_password: password });
    return error ? { error: rpcError(error) } : {};
  }

  async deleteStudents(userIds: string[]): Promise<{ error?: string }> {
    const { error } = await this.supabase.rpc('delete_students', { p_students: userIds });
    return error ? { error: rpcError(error) } : {};
  }

  // ---------------------------------------------------------------------------
  // Thông báo & gợi ý
  // ---------------------------------------------------------------------------
  async listAnnouncements(classId: string): Promise<ClassAnnouncement[]> {
    const { data, error } = await this.supabase
      .from('class_announcements')
      .select('*')
      .eq('class_id', classId)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) console.error('Announcements query failed:', error);
    return (data ?? []) as ClassAnnouncement[];
  }

  async saveAnnouncement(item: Pick<ClassAnnouncement, 'class_id' | 'title' | 'body' | 'pinned'> & { id?: string }): Promise<{ error?: string }> {
    const expired = await sessionError();
    if (expired) return { error: expired };
    const payload = { class_id: item.class_id, title: item.title.trim(), body: item.body.trim(), pinned: item.pinned };
    const { error } = item.id
      ? await this.supabase.from('class_announcements').update(payload).eq('id', item.id)
      : await this.supabase.from('class_announcements').insert(payload);
    return error ? { error: writeErrorMessage(error) } : {};
  }

  async deleteAnnouncement(id: string): Promise<{ error?: string }> {
    const { error } = await this.supabase.from('class_announcements').delete().eq('id', id);
    return error ? { error: writeErrorMessage(error) } : {};
  }

  async listSuggestions(classId: string): Promise<ClassSuggestion[]> {
    const { data, error } = await this.supabase
      .from('class_suggestions')
      .select(SUGGESTION_COLUMNS)
      .eq('class_id', classId)
      .order('created_at');
    if (error) console.error('Suggestions query failed:', error);
    return (data ?? []) as unknown as ClassSuggestion[];
  }

  /** Đề gợi ý được cho lớp: mọi đề trừ bản nháp */
  async suggestableExams(): Promise<SuggestedExamInfo[]> {
    const { data, error } = await this.supabase
      .from('exams')
      .select('id, title, hsk_level, hsk_version, visibility')
      .neq('visibility', 'private')
      .order('hsk_version')
      .order('hsk_level')
      .order('title');
    if (error) console.error('Exams query failed:', error);
    return (data ?? []) as SuggestedExamInfo[];
  }

  async suggestExam(classId: string, examId: string, note = ''): Promise<{ error?: string }> {
    const { error } = await this.supabase.from('class_suggestions').insert({ class_id: classId, kind: 'exam', exam_id: examId, note });
    return error ? { error: error.code === '23505' ? 'Đề này đã được gợi ý cho lớp.' : writeErrorMessage(error) } : {};
  }

  async suggestVocab(classId: string, collection: VocabCollection, levels: number[], note = ''): Promise<{ error?: string }> {
    const { error } = await this.supabase
      .from('class_suggestions')
      .insert({ class_id: classId, kind: 'vocab', collection, levels, note });
    return error ? { error: error.code === '23505' ? 'Bộ từ vựng này đã được gợi ý cho lớp.' : writeErrorMessage(error) } : {};
  }

  async deleteSuggestion(id: string): Promise<{ error?: string }> {
    const { error } = await this.supabase.from('class_suggestions').delete().eq('id', id);
    return error ? { error: writeErrorMessage(error) } : {};
  }

  // ---------------------------------------------------------------------------
  // Kết quả
  // ---------------------------------------------------------------------------
  async listAttempts(classId: string): Promise<ExamAttempt[]> {
    const { data, error } = await this.supabase
      .from('exam_attempts')
      .select(ATTEMPT_COLUMNS)
      .eq('class_id', classId)
      .order('submitted_at', { ascending: false });
    if (error) console.error('Attempts query failed:', error);
    return (data ?? []) as unknown as ExamAttempt[];
  }

  async vocabProgress(classId: string): Promise<StudentVocabProgress[]> {
    const { data, error } = await this.supabase.rpc('class_vocab_progress', { p_class_id: classId });
    if (error) console.error('class_vocab_progress failed:', error);
    return (data ?? []) as StudentVocabProgress[];
  }
}
