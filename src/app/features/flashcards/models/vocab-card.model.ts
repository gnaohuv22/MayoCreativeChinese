/** Từ vựng — stored in Supabase PostgreSQL */
export interface VocabCard {
  id?: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  hsk_level: number;
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
  hanzi: string;
  hskLevel: number;
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
}

/** Stats for a single HSK level */
export interface LevelStats {
  level: number;
  totalCards: number;
  reviewed: number;
  mastered: number;
  bookmarked: number;
}
