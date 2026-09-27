/**
/**
 * MAYO CREATIVE CHINESE — HSK EXAM MODELS
 * Các kiểu dữ liệu TypeScript biểu diễn Đề thi HSK, các phần thi, dạng bài và câu hỏi.
 */

export type HskVersion = '2.0' | '3.0';

export type SectionType = 'listening' | 'reading' | 'writing' | 'speaking';

export type QuestionType =
  | 'single_choice'
  | 'true_false'
  | 'fill_blank'
  | 'ordering'
  | 'matching'
  | 'short_answer'
  | 'essay';

/** Thông tin lựa chọn cho câu hỏi trắc nghiệm hoặc nối cặp */
export interface ExamOption {
  id?: string;
  question_id?: string;
  label: string;      // 'A', 'B', 'C', 'D', 'E', 'F'
  content: string;    // Nội dung đáp án
  image_url?: string | null; // Ảnh kèm theo (nếu đáp án là ảnh)
  sort_order: number;
}

/** Câu hỏi chi tiết */
export interface ExamQuestion {
  id?: string;
  part_id?: string;
  question_num: number;     // Số thứ tự hiển thị trong đề thi (1, 2, 3...)
  content?: string | null;         // Đoạn văn / ngữ cảnh / đề bài
  audio_url?: string | null;       // File âm thanh riêng của câu (phần nghe)
  image_url?: string | null;       // Hình ảnh kèm theo câu hỏi
  correct_answer: string;   // Đáp án đúng (vd: 'A', 'true', 'false', từ điền...)
  explanation?: string | null;     // Lời giải thích / dịch nghĩa
  score: number;            // Điểm số cho câu hỏi này
  sort_order: number;
  options?: ExamOption[];   // Danh sách lựa chọn (nếu có)
}

/** Từng Part/Dạng bài trong một Phần thi */
export interface ExamPart {
  id?: string;
  section_id?: string;
  title: string;                 // VD: "Phần I: Chọn hình ảnh phù hợp"
  question_type: QuestionType;   // single_choice, true_false, fill_blank...
  instructions?: string | null;         // Hướng dẫn làm bài
  sort_order: number;
  // "Ví dụ / Đề bài chung" — dùng chung cho mọi câu hỏi trong Part
  example_text?: string | null;         // Ví dụ mẫu (例如), audio cũng đọc phần này
  stimulus_text?: string | null;        // Ngân hàng từ / đoạn văn chung (A 因为 B 远 ...)
  stimulus_image_url?: string | null;   // Tranh chung (ngân hàng tranh A–F)
  stimulus_audio_url?: string | null;   // Audio chung của Part (tuỳ chọn)
  option_labels?: string | null;        // Nhãn đáp án dạng 'matching', VD 'A,B,C,D,E,F'
  questions?: ExamQuestion[];
}

/** Phần thi lớn trong đề thi (Nghe, Đọc, Viết, Nói) */
export interface ExamSection {
  id?: string;
  exam_id?: string;
  section_type: SectionType; // 'listening' | 'reading' | 'writing' | 'speaking'
  title: string;             // VD: "Phần 1: Nghe hiểu (听力)"
  sort_order: number;
  max_score: number;         // Thường là 100 điểm
  instructions?: string | null;
  audio_url?: string | null;        // Audio tổng của cả phần thi (nếu có)
  parts?: ExamPart[];
}

/** Đề thi HSK hoàn chỉnh */
export interface Exam {
  id?: string;
  title: string;             // VD: "HSK 3 — Đề thi thử số 01"
  hsk_level: number;         // 1 - 9
  hsk_version: HskVersion;   // '2.0' | '3.0'
  duration_mins: number;     // Phút
  total_score: number;       // Thường là 300
  passing_score: number;     // Thường là 180
  description?: string | null;
  is_published: boolean;     // Công khai cho học viên xem/thi
  created_at?: string;
  updated_at?: string;
  sections?: ExamSection[];  // Cấu trúc lồng nhau khi fetch full đề
  question_count?: number;   // Số lượng câu hỏi tính toán được
}

/** Bộ lọc danh sách đề thi */
export interface ExamFilter {
  hsk_level?: number | 'all';
  hsk_version?: HskVersion | 'all';
  is_published?: boolean | 'all';
  searchQuery?: string;
}

import type { IconName } from '../../../components/shared/icon/app-icon';

/** Thông tin nhãn hiển thị cho loại câu hỏi */
export const QUESTION_TYPE_LABELS: Record<QuestionType, { label: string; icon: IconName; description: string }> = {
  single_choice: {
    label: 'Trắc nghiệm 1 đáp án',
    icon: 'check',
    description: 'Chọn 1 phương án đúng trong các lựa chọn A, B, C, D'
  },
  true_false: {
    label: 'Phán đoán Đúng / Sai',
    icon: 'scale',
    description: 'Xác định nhận định là Đúng (对) hay Sai (错)'
  },
  fill_blank: {
    label: 'Điền vào chỗ trống',
    icon: 'pencil',
    description: 'Điền từ / chữ Hán còn thiếu vào khoảng trống'
  },
  ordering: {
    label: 'Sắp xếp câu',
    icon: 'arrows-right-left',
    description: 'Sắp xếp các từ ngữ theo đúng trật tự ngữ pháp'
  },
  matching: {
    label: 'Chọn từ ngân hàng chung (tranh / từ A–F)',
    icon: 'link',
    description: 'Mọi câu trong Part chọn đáp án từ cùng 1 ngân hàng tranh hoặc từ (A, B, C, D, E, F)'
  },
  short_answer: {
    label: 'Viết ngắn / Điền chữ Hán',
    icon: 'document-text',
    description: 'Nhìn phiên âm Pinyin hoặc hình ảnh để viết chữ Hán'
  },
  essay: {
    label: 'Viết đoạn văn',
    icon: 'chat-bubble',
    description: 'Viết một đoạn văn ngắn dựa theo các từ khóa / hình ảnh'
  }
};

export const DEFAULT_OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Nhãn đáp án dùng chung của 1 Part dạng 'matching' ('A,B,C' → ['A','B','C']) */
export function partOptionLabels(part: Pick<ExamPart, 'option_labels'>): string[] {
  const labels = (part.option_labels ?? '')
    .split(/[\s,;]+/)
    .map(l => l.trim().toUpperCase())
    .filter(Boolean);
  return labels.length > 0 ? [...new Set(labels)] : DEFAULT_OPTION_LABELS;
}

/** Part có khối "Ví dụ / Đề bài chung" hay không */
export function hasPartStimulus(part: ExamPart): boolean {
  return !!(part.example_text?.trim() || part.stimulus_text?.trim() || part.stimulus_image_url || part.stimulus_audio_url);
}

/**
 * Đánh số lại toàn bộ câu hỏi theo đúng thứ tự hiển thị: Phần thi → Part → Câu (1, 2, 3...).
 * Đồng thời chuẩn hoá sort_order của phần thi, Part và câu hỏi.
 */
export function renumberQuestions(exam: Pick<Exam, 'sections'>): void {
  let num = 1;
  (exam.sections ?? []).forEach((sec, sIdx) => {
    sec.sort_order = sIdx + 1;
    (sec.parts ?? []).forEach((part, pIdx) => {
      part.sort_order = pIdx + 1;
      (part.questions ?? []).forEach((q, qIdx) => {
        q.sort_order = qIdx + 1;
        q.question_num = num++;
      });
    });
  });
}

/** Gợi ý tên đề thi theo quy ước "HSK 3 - ĐỀ THI THỬ 01" */
export function suggestExamTitle(level: number, version: HskVersion, index: number): string {
  const prefix = version === '3.0' ? 'NEW HSK' : 'HSK';
  return `${prefix} ${level} - ĐỀ THI THỬ ${String(index).padStart(2, '0')}`;
}

/** Tên tiếng Việt của các phần thi */
export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  listening: 'Nghe hiểu',
  reading: 'Đọc hiểu',
  writing: 'Viết',
  speaking: 'Nói',
};

/** Hiển thị đáp án cho người đọc (VD: 'true' → 'Đúng (对)') */
export function formatAnswer(value: string | null | undefined, questionType: QuestionType): string {
  if (!value) return '';
  if (questionType === 'true_false') {
    if (value === 'true') return 'Đúng (对)';
    if (value === 'false') return 'Sai (错)';
  }
  return value;
}

/** Danh sách câu trả lời của thí sinh: key là question_id, value là chuỗi đáp án */
export type UserAnswers = Record<string, string>;

/** Kết quả chấm chi tiết từng câu hỏi */
export interface QuestionGradeResult {
  questionId: string;
  questionNum: number;
  sectionType: SectionType;
  questionType: QuestionType;
  content?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
  options?: ExamOption[];
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  scoreEarned: number;
  maxScore: number;
  explanation?: string | null;
}

/** Kết quả điểm số từng Phần thi (Nghe, Đọc, Viết) */
export interface SectionScoreResult {
  sectionType: SectionType;
  title: string;
  scoreEarned: number;
  maxScore: number;
  totalQuestions: number;
  correctQuestions: number;
  percentage: number;
}

/** Toàn bộ bài nộp và kết quả bài thi */
export interface ExamSubmission {
  id: string;
  examId: string;
  examTitle: string;
  hskLevel: number;
  hskVersion: HskVersion;
  submittedAt: string;
  durationMins: number;
  timeSpentSeconds: number;
  totalScoreEarned: number;
  totalScoreMax: number;
  passingScore: number;
  isPassed: boolean;
  accuracyPercentage: number;
  totalQuestions: number;
  correctCount: number;
  sectionResults: SectionScoreResult[];
  questionResults: QuestionGradeResult[];
}
