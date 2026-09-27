/** Phiên bản chuẩn HSK */
export type HskVersion = '2.0' | '3.0';

/** Danh mục bộ sưu tập từ vựng */
export type VocabCollection = 'hsk2' | 'hsk3' | 'combined' | 'supplement';

/** Từ vựng — stored in Supabase PostgreSQL */
export interface VocabCard {
  id?: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  hsk_level: number;
  hsk_version?: HskVersion;
  lesson_number?: number;
  lesson_title?: string;
  example?: string;
  example_pinyin?: string;
  example_meaning?: string;
  created_at?: string;
  updated_at?: string;
}

/** Row shape returned from Supabase (snake_case matches DB columns) */
export type VocabCardRow = VocabCard;

/** Tiến độ user cho một thẻ — stored in IndexedDB */
export interface CardProgress {
  id?: number;
  /** vocab_cards.id — phân biệt các từ cùng Hán tự nhưng khác nghĩa (bản ghi cũ có thể chưa có) */
  cardId?: number;
  hanzi: string;
  hskLevel: number;
  hskVersion?: HskVersion;
  confidence: 0 | 1 | 2 | 3;
  reviewCount: number;
  lastReviewed?: number;
  bookmarked: boolean;
}

/** Merged view: vocab data + user progress */
export interface StudyCard {
  vocab: VocabCard;
  progress: CardProgress | null;
  flipped: boolean;
}

/** Parsed row from CSV/XLSX import */
export interface ParsedImportRow {
  hanzi: string;
  pinyin: string;
  meaning: string;
  hsk_level: number;
  hsk_version?: HskVersion;
  lesson_number?: number;
  lesson_title?: string;
  example?: string;
  example_pinyin?: string;
  example_meaning?: string;
}

/** Validated import row with status */
export interface ValidatedImportRow {
  row: ParsedImportRow;
  rowIndex: number;
  status: 'valid' | 'duplicate' | 'error';
  errors: string[];
  selected: boolean;
  /** Đã có từ cùng Hán tự (cùng cấp) nhưng khác pinyin/nghĩa — vẫn thêm, chỉ nhắc để kiểm tra lỗi gõ */
  sameHanziExists?: boolean;
}

/** Stats for a single HSK level */
export interface LevelStats {
  level: number;
  totalCards: number;
  reviewed: number;
  mastered: number;
  bookmarked: number;
  hskVersion?: HskVersion;
}

/** Thông tin về một bài học (HSK 3.0) */
export interface LessonInfo {
  lessonNumber: number;
  lessonTitle: string;
  wordCount: number;
}

/** Thông tin về một bộ sưu tập từ vựng */
export interface VocabCollectionInfo {
  key: VocabCollection;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  levels: number[];
  hskVersion?: HskVersion;
  hasLessons?: boolean;
}

/** Cấp cao cấp gộp trong bộ "Từ vựng HSK 1 - 9" (không tách 7, 8, 9) */
export const ADVANCED_LEVEL_PARAM = '7-9';
export const ADVANCED_LEVELS = [7, 8, 9];

/** Chuyển tham số route `:level` thành danh sách cấp ('7-9' → [7, 8, 9], '3' → [3]) */
export function parseLevelParam(param: string | null | undefined): number[] {
  if (param === ADVANCED_LEVEL_PARAM) return ADVANCED_LEVELS;
  const n = Number(param);
  return Number.isInteger(n) && n >= 1 && n <= 9 ? [n] : [1];
}

/** Chuẩn hoá text để so trùng: NFC, gộp khoảng trắng, bỏ khoảng trắng đầu/cuối */
function normalizeText(value: string | null | undefined): string {
  return (value ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
}

/**
 * Key xác định 1 mục từ duy nhất: chỉ coi là trùng khi Hán tự + pinyin + nghĩa (cùng cấp, cùng phiên bản) đều giống.
 * Pinyin & nghĩa so không phân biệt hoa/thường.
 */
export function vocabEntryKey(card: { hanzi: string; pinyin: string; meaning: string; hsk_level: number; hsk_version?: string | null }): string {
  return [
    normalizeText(card.hanzi),
    normalizeText(card.pinyin).toLowerCase(),
    normalizeText(card.meaning).toLowerCase(),
    card.hsk_level,
    card.hsk_version || '2.0',
  ].join('|');
}

/** Key "Hán tự + cấp + phiên bản" — dùng để nhắc khi cùng chữ nhưng khác nghĩa */
export function vocabHanziKey(card: { hanzi: string; hsk_level: number; hsk_version?: string | null }): string {
  return [normalizeText(card.hanzi), card.hsk_level, card.hsk_version || '2.0'].join('|');
}

/** Key "Hán tự + pinyin" — một mục từ theo chuẩn từ điển (dùng cho danh sách bổ sung 2.0 → 3.0) */
export function vocabWordKey(card: { hanzi: string; pinyin: string }): string {
  return `${normalizeText(card.hanzi)}|${normalizeText(card.pinyin).toLowerCase()}`;
}
