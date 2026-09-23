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
    label: 'Nối cặp tương ứng',
    icon: 'link',
    description: 'Nối câu hỏi với câu trả lời hoặc hình ảnh thích hợp'
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
