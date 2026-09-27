/** Phiên bản chuẩn HSK */
export type HskVersion = '2.0' | '3.0';

/**
 * 4 bộ từ vựng độc lập — mỗi từ trong DB thuộc đúng 1 bộ (cột `collection`),
 * các bộ không dùng chung / suy ra dữ liệu của nhau.
 */
export type VocabCollection = 'hsk2' | 'hsk3' | 'combined' | 'supplement';

/** Cách chia nhỏ từ vựng trong 1 cấp */
export type VocabGrouping = 'lesson' | 'topic' | null;

export interface VocabCollectionConfig {
  key: VocabCollection;
  /** Tên đầy đủ, VD "Từ Vựng HSK 2.0" */
  title: string;
  /** Nhãn ngắn cho breadcrumb / select, VD "HSK 2.0" */
  shortLabel: string;
  /** Các tham số `:level` hợp lệ ('7-9' = gộp cao cấp) */
  levelParams: string[];
  /** Tiền tố tên cấp, VD "NEW HSK" */
  levelPrefix: string;
  version: HskVersion;
  grouping: VocabGrouping;
}

/** Cấp cao cấp gộp trong bộ "Từ vựng HSK 1 - 9" (không tách 7, 8, 9) */
export const ADVANCED_LEVEL_PARAM = '7-9';
export const ADVANCED_LEVELS = [7, 8, 9];

export const VOCAB_COLLECTIONS: Record<VocabCollection, VocabCollectionConfig> = {
  hsk2: {
    key: 'hsk2',
    title: 'Từ Vựng HSK 2.0',
    shortLabel: 'HSK 2.0',
    levelParams: ['1', '2', '3', '4', '5', '6'],
    levelPrefix: 'HSK',
    version: '2.0',
    grouping: null,
  },
  hsk3: {
    key: 'hsk3',
    title: 'Từ Vựng HSK 3.0',
    shortLabel: 'HSK 3.0',
    levelParams: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    levelPrefix: 'NEW HSK',
    version: '3.0',
    grouping: 'lesson',
  },
  combined: {
    key: 'combined',
    title: 'Từ Vựng HSK 1 - 9',
    shortLabel: 'HSK 1-9',
    levelParams: ['1', '2', '3', '4', '5', '6', ADVANCED_LEVEL_PARAM],
    levelPrefix: 'HSK',
    version: '3.0',
    grouping: null,
  },
  supplement: {
    key: 'supplement',
    title: 'Từ Vựng Bổ Sung HSK 2.0 → 3.0',
    shortLabel: 'Bổ sung 2.0 → 3.0',
    levelParams: ['3', '4', '5', '6'],
    levelPrefix: 'HSK',
    version: '3.0',
    grouping: 'topic',
  },
};

export const VOCAB_COLLECTION_KEYS = Object.keys(VOCAB_COLLECTIONS) as VocabCollection[];

/** Các cấp có thể lưu cho 1 bộ (bộ HSK 1-9 lưu 7, 8, 9 riêng dù hiển thị gộp) */
export function collectionLevels(collection: VocabCollection): number[] {
  return VOCAB_COLLECTIONS[collection].levelParams.flatMap(p => parseLevelParam(p));
}

/** Từ vựng — stored in Supabase PostgreSQL */
export interface VocabCard {
  id?: number;
  collection?: VocabCollection;
  hanzi: string;
  pinyin: string;
  meaning: string;
  hsk_level: number;
  hsk_version?: HskVersion;
  lesson_number?: number | null;
  lesson_title?: string | null;
  /** Chủ đề (bộ Bổ sung) */
  topic?: string | null;
  /** Nhiều ví dụ ngăn cách bằng xuống dòng — dòng thứ N của 3 cột ví dụ là 1 ví dụ */
  example?: string | null;
  example_pinyin?: string | null;
  example_meaning?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Row shape returned from Supabase (snake_case matches DB columns) */
export type VocabCardRow = VocabCard;

/** Phạm vi từ vựng đang học: 1 bộ + cấp (+ bài / chủ đề) */
export interface VocabScope {
  collection: VocabCollection;
  /** Tham số route `:level` ('1'…'9' hoặc '7-9') */
  levelParam: string;
  /** Số bài (bộ HSK 3.0). 0 = chưa phân bài */
  lesson?: number | null;
  /** Tên chủ đề (bộ Bổ sung). '' = chưa phân chủ đề */
  topic?: string | null;
}

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

/** Parsed row from CSV/XLSX import (bộ từ vựng chọn trên giao diện, không lấy từ file) */
export interface ParsedImportRow {
  hanzi: string;
  pinyin: string;
  meaning: string;
  hsk_level: number;
  lesson_number?: number;
  lesson_title?: string;
  topic?: string;
  example?: string;
  example_pinyin?: string;
  example_meaning?: string;
}

/** Một nghĩa đã có trong DB của cùng Hán tự */
export interface ExistingMeaning {
  pinyin: string;
  meaning: string;
}

/** Validated import row with status */
export interface ValidatedImportRow {
  row: ParsedImportRow;
  rowIndex: number;
  status: 'valid' | 'duplicate' | 'error';
  errors: string[];
  selected: boolean;
  /**
   * Các nghĩa đã có trong DB của cùng Hán tự (cùng bộ, cùng cấp) nhưng khác pinyin/nghĩa.
   * Vẫn được thêm, nhưng phải xác nhận trước.
   */
  sameHanziMatches?: ExistingMeaning[];
}

/** Stats for a single HSK level */
export interface LevelStats {
  totalCards: number;
  reviewed: number;
  mastered: number;
  bookmarked: number;
}

/** Một nhóm từ trong 1 cấp: bài học (HSK 3.0) hoặc chủ đề (Bổ sung) */
export interface VocabGroupInfo {
  /** Tham số route: số bài ('0' = chưa phân bài) hoặc tên chủ đề ('' = chưa phân chủ đề) */
  key: string;
  /** Số bài (chỉ với bài học) */
  lessonNumber?: number;
  title: string;
  wordCount: number;
}

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

type KeyCard = { collection?: VocabCollection | null; hanzi: string; hsk_level: number };

/**
 * Key xác định 1 mục từ duy nhất: chỉ coi là trùng khi Hán tự + pinyin + nghĩa (cùng bộ, cùng cấp) đều giống.
 * Pinyin & nghĩa so không phân biệt hoa/thường.
 */
export function vocabEntryKey(card: KeyCard & { pinyin: string; meaning: string }): string {
  return [
    card.collection || 'hsk2',
    card.hsk_level,
    normalizeText(card.hanzi),
    normalizeText(card.pinyin).toLowerCase(),
    normalizeText(card.meaning).toLowerCase(),
  ].join('|');
}

/** Key "bộ + cấp + Hán tự" — dùng để hỏi xác nhận khi cùng chữ nhưng khác nghĩa */
export function vocabHanziKey(card: KeyCard): string {
  return [card.collection || 'hsk2', card.hsk_level, normalizeText(card.hanzi)].join('|');
}

/** Một ví dụ đã tách dòng (hội thoại A/B giữ nhiều dòng trong 1 ví dụ) */
export interface VocabExample {
  text: string;
  pinyin: string;
  meaning: string;
  /** Câu tiếng Trung để đọc to (bỏ nhãn người nói "A:", "B:") */
  speakText: string;
}

/** Nhãn người nói trong hội thoại: "A:", "B：", "甲:", "乙:" */
const SPEAKER_LABEL = /^\s*[A-Z甲乙]\s*[:：]\s*/;
/** Số thứ tự ví dụ do người nhập tự gõ: "VD1:", "VD 2.", "1/", "2)" — giao diện đã tự đánh số */
const EXAMPLE_NUMBER = /^\s*(?:VD\s*\d+\s*[:.)/]?|\d+\s*[/.)])\s*/i;

function lines(value: string | null | undefined): string[] {
  return (value ?? '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
}

/**
 * Tách các ví dụ theo xuống dòng: dòng thứ N của câu ví dụ / pinyin / nghĩa là 1 ví dụ.
 * - Nếu mọi dòng của câu ví dụ là lượt thoại ("A: …", "B: …") thì cả đoạn là 1 ví dụ hội thoại.
 * - Số thứ tự tự gõ ("VD1:", "1/") được bỏ vì giao diện tự đánh số.
 * - Số dòng giữa các cột lệch nhau thì các dòng thừa vẫn được giữ.
 */
export function splitExamples(card: Pick<VocabCard, 'example' | 'example_pinyin' | 'example_meaning'>): VocabExample[] {
  const texts = lines(card.example);
  const pinyins = lines(card.example_pinyin);
  const meanings = lines(card.example_meaning);

  if (texts.length > 1 && texts.every(t => SPEAKER_LABEL.test(t))) {
    return [{
      text: texts.join('\n'),
      pinyin: pinyins.join('\n'),
      meaning: meanings.join('\n'),
      speakText: texts.map(t => t.replace(SPEAKER_LABEL, '')).join('\n'),
    }];
  }

  const strip = (v: string | undefined) => (v ?? '').replace(EXAMPLE_NUMBER, '');
  const count = Math.max(texts.length, pinyins.length, meanings.length);
  const result: VocabExample[] = [];
  for (let i = 0; i < count; i++) {
    const text = strip(texts[i]);
    const ex = { text, pinyin: strip(pinyins[i]), meaning: strip(meanings[i]), speakText: text };
    if (ex.text || ex.pinyin || ex.meaning) result.push(ex);
  }
  return result;
}
