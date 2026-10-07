import type { ContentVisibility } from '../../../components/shared/visibility/content-visibility';
import type { HskVersion, VocabCollection } from '../../flashcards/models/vocab-card.model';

/** Bảng public.classes (migration 019) */
export type ClassStatus = 'planned' | 'active' | 'finished';
export type StudyMode = 'online' | 'offline';
export type ClassStaffRole = 'teacher' | 'assistant';

export const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  planned: 'Sắp khai giảng',
  active: 'Đang học',
  finished: 'Đã kết thúc',
};

export const STUDY_MODE_LABELS: Record<StudyMode, string> = {
  online: 'Online',
  offline: 'Offline',
};

export const STAFF_ROLE_LABELS: Record<ClassStaffRole, string> = {
  teacher: 'Giáo viên',
  assistant: 'Trợ giảng',
};

export interface ClassStaffMember {
  user_id: string;
  role: ClassStaffRole;
}

export interface SchoolClass {
  id: string;
  code: string;
  name: string;
  course_slug: string | null;
  hsk_level: number | null;
  hsk_version: HskVersion | null;
  study_mode: StudyMode | null;
  start_date: string | null;
  end_date: string | null;
  schedule: string;
  max_students: number | null;
  notes: string;
  status: ClassStatus;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  staff: ClassStaffMember[];
  /** Số học viên (mọi trạng thái) */
  student_count: number;
}

/** Dữ liệu gửi save_class */
export interface ClassInput {
  id?: string;
  code: string;
  name: string;
  course_slug: string | null;
  hsk_level: number | null;
  hsk_version: HskVersion | null;
  study_mode: StudyMode | null;
  start_date: string | null;
  end_date: string | null;
  schedule: string;
  max_students: number | null;
  notes: string;
  status: ClassStatus;
  staff: ClassStaffMember[];
}

/** list_staff_directory() */
export interface StaffDirectoryEntry {
  user_id: string;
  username: string;
  full_name: string;
}

/** list_class_options() — lớp đích khi chuyển lớp */
export interface ClassOption {
  id: string;
  code: string;
  name: string;
}

/** Bảng public.student_profiles */
export type StudentStatus = 'active' | 'locked' | 'archived';

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  active: 'Đang hoạt động',
  locked: 'Đã khoá',
  archived: 'Đã lưu trữ',
};

export interface Student {
  user_id: string;
  username: string;
  full_name: string;
  birth_year: number | null;
  phone: string;
  email: string;
  parent_phone: string;
  notes: string;
  class_id: string | null;
  status: StudentStatus;
  must_change_password: boolean;
  created_at: string;
}

/** Thông tin hồ sơ học viên sửa được (update_student) */
export type StudentProfileInput = Pick<Student, 'full_name' | 'birth_year' | 'phone' | 'email' | 'parent_phone' | 'notes'>;

/** 1 dòng gửi create_students */
export interface NewStudentRow extends StudentProfileInput {
  username_base: string;
  password: string;
}

/** Kết quả create_students */
export interface CreatedStudent {
  row: number;
  user_id: string;
  username: string;
  full_name: string;
}

export interface ClassAnnouncement {
  id: string;
  class_id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SuggestedExamInfo {
  id: string;
  title: string;
  hsk_level: number;
  hsk_version: HskVersion;
  visibility: ContentVisibility;
}

export interface ClassSuggestion {
  id: string;
  class_id: string;
  kind: 'exam' | 'vocab';
  exam_id: string | null;
  collection: VocabCollection | null;
  levels: number[] | null;
  note: string;
  created_at: string;
  exam?: SuggestedExamInfo | null;
}

export interface SectionScore {
  section_type: string;
  title: string;
  score: number;
  max_score: number;
}

export interface ExamAttempt {
  id: string;
  student_id: string;
  class_id: string | null;
  exam_id: string;
  score: number;
  total_score: number;
  passing_score: number | null;
  correct_count: number;
  question_count: number;
  section_scores: SectionScore[];
  time_spent_secs: number | null;
  submitted_at: string;
  exam?: { title: string; hsk_level: number; hsk_version: HskVersion } | null;
}

/** class_vocab_progress() */
export interface StudentVocabProgress {
  student_id: string;
  reviewed: number;
  mastered: number;
  bookmarked: number;
  last_reviewed: string | null;
}
