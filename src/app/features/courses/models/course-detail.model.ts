/**
 * MAYO CREATIVE CHINESE — TRANG CHI TIẾT KHÓA HỌC
 * Dữ liệu sinh tự động từ brief bằng `scripts/course-brief-to-ts.py`.
 */

/** Một dòng văn bản trong ô bảng / đoạn văn, giữ định dạng đậm / nghiêng của brief */
export interface RichLine {
  text: string;
  bold?: boolean;
  italic?: boolean;
  bullet?: boolean;
}

/** Ô bảng = nhiều dòng */
export type TableCell = RichLine[];

export type CourseBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'subheading'; text: string }
  | { kind: 'paragraph'; lines: RichLine[] }
  | { kind: 'list'; title?: string; items: string[] }
  | { kind: 'table'; head: string[]; rows: TableCell[][] }
  | { kind: 'stage'; title: string; blocks: CourseBlock[] };

/** Một dòng trong cột "Thông tin khóa học" (Khối B2) */
export interface CourseInfoRow {
  label: string;
  value: string[];
}

/** Một "chặng" của khóa có nhiều lựa chọn (VD: Nhập Môn / Thông Thạo / Tinh Anh) */
export interface CourseTrack {
  id: string;
  title: string;
  sessions: string;
  summary: string;
  blocks: CourseBlock[];
  info: CourseInfoRow[];
}

export interface CourseDetail {
  slug: string;
  /** id thẻ khóa học trên trang chủ (courses.ts) */
  cardId: string | null;
  name: string;
  goal: string;
  /** Các dòng giới thiệu có nhãn: Đối tượng, Thông điệp, Mô tả, Dành cho */
  lead: { label: string; text: string }[];
  chips: string[];
  /** Dải số liệu nổi bật */
  stats: { value: string; label: string }[];
  blocks: CourseBlock[];
  info: CourseInfoRow[];
  tracks?: CourseTrack[];
  /** Tab chuyển đối tượng (VD: Trẻ em | Người lớn) — dùng chung nội dung */
  audiences?: string[];
  audienceNote?: string;
  /** Banner phụ đầu trang dẫn sang khóa khác */
  banner?: { text: string; slug: string };
}
