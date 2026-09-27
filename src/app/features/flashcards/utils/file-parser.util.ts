import { VOCAB_COLLECTIONS, collectionLevels, vocabEntryKey, vocabHanziKey } from '../models/vocab-card.model';
import type { ExistingMeaning, ParsedImportRow, ValidatedImportRow, VocabCollection } from '../models/vocab-card.model';

/** Các từ đã có trong DB (1 bộ), dùng để kiểm tra trùng khi import */
export interface ExistingVocabKeys {
  /** vocabEntryKey — bộ + cấp + Hán tự + pinyin + nghĩa */
  entries: Set<string>;
  /** vocabHanziKey (bộ + cấp + Hán tự) → các nghĩa đã có */
  hanzi: Map<string, ExistingMeaning[]>;
}

/**
 * Parse uploaded file (CSV or XLSX) into structured rows.
 * XLSX library is dynamically imported to avoid loading in non-admin pages.
 */
export async function parseFile(file: File): Promise<ParsedImportRow[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    const text = await file.text();
    return parseCsv(text);
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer();
    return parseXlsx(buffer);
  }

  throw new Error(`Định dạng file không hỗ trợ: .${ext}. Chỉ chấp nhận .csv, .xlsx, .xls`);
}

/** Parse CSV text into rows */
export function parseCsv(text: string): ParsedImportRow[] {
  const records = parseCsvRecords(text.replace(/^\uFEFF/, ''));
  if (records.length < 2) return [];

  const headers = records[0].map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));

  const colMap = mapColumns(headers);
  if (!colMap) {
    throw new Error('File CSV thiếu cột bắt buộc. Cần có: hanzi, pinyin, meaning, hsk_level');
  }

  const rows: ParsedImportRow[] = [];
  for (const cells of records.slice(1)) {
    if (cells.every(c => !c.trim())) continue; // skip empty rows

    const cell = (idx: number | undefined) => (idx !== undefined ? cleanCell(cells[idx]) : '');
    const rawLesson = cell(colMap.lesson_number);
    const lessonNum = rawLesson ? parseInt(rawLesson, 10) : undefined;

    rows.push({
      hanzi: cell(colMap.hanzi),
      pinyin: cell(colMap.pinyin),
      meaning: cell(colMap.meaning),
      hsk_level: parseInt(cell(colMap.hsk_level) || '0', 10),
      lesson_number: isNaN(lessonNum as number) ? undefined : lessonNum,
      lesson_title: cell(colMap.lesson_title) || undefined,
      topic: cell(colMap.topic) || undefined,
      example: cell(colMap.example) || undefined,
      example_pinyin: cell(colMap.example_pinyin) || undefined,
      example_meaning: cell(colMap.example_meaning) || undefined,
    });
  }

  return rows;
}

/** Parse XLSX buffer into rows (dynamic import) */
export async function parseXlsx(buffer: ArrayBuffer): Promise<ParsedImportRow[]> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (jsonData.length === 0) return [];

  // Normalize headers
  const firstRow = jsonData[0];
  const headers = Object.keys(firstRow).map(h => h.toLowerCase().trim());
  const originalHeaders = Object.keys(firstRow);

  const headerMap: Record<string, string> = {};
  headers.forEach((h, i) => {
    headerMap[h] = originalHeaders[i];
  });

  const rows: ParsedImportRow[] = [];
  for (const row of jsonData) {
    const getValue = (key: string): string => {
      if (row[key] !== undefined) return cleanCell(String(row[key]));
      const mapped = headerMap[key.toLowerCase()];
      if (mapped && row[mapped] !== undefined) return cleanCell(String(row[mapped]));
      return '';
    };

    const hanzi = getValue('hanzi');
    if (!hanzi) continue; // skip rows without hanzi

    const rawLesson = getValue('lesson_number') || getValue('lesson') || getValue('bai');
    const lessonNum = rawLesson ? parseInt(rawLesson, 10) : undefined;

    rows.push({
      hanzi,
      pinyin: getValue('pinyin'),
      meaning: getValue('meaning'),
      hsk_level: parseInt(getValue('hsk_level') || '0', 10),
      lesson_number: isNaN(lessonNum as number) ? undefined : lessonNum,
      lesson_title: getValue('lesson_title') || getValue('ten_bai') || undefined,
      topic: getValue('topic') || getValue('chủ đề') || getValue('chu_de') || undefined,
      example: getValue('example') || undefined,
      example_pinyin: getValue('example_pinyin') || undefined,
      example_meaning: getValue('example_meaning') || undefined,
    });
  }

  return rows;
}

/**
 * Validate parsed rows against existing data of 1 collection.
 * - Trùng hoàn toàn (Hán tự + pinyin + nghĩa, cùng bộ & cấp) → bỏ qua.
 * - Cùng Hán tự nhưng khác pinyin/nghĩa với từ đã có trong DB → hợp lệ, kèm `sameHanziMatches` để hỏi xác nhận.
 */
export function validateRows(
  rows: ParsedImportRow[],
  existing: ExistingVocabKeys,
  collection: VocabCollection
): ValidatedImportRow[] {
  const seenEntries = new Set<string>();
  const allowedLevels = collectionLevels(collection);
  const config = VOCAB_COLLECTIONS[collection];

  return rows.map((row, index) => {
    const errors: string[] = [];

    if (!row.hanzi) errors.push('Thiếu Hán tự');
    if (!row.pinyin) errors.push('Thiếu Pinyin');
    if (!row.meaning) errors.push('Thiếu Nghĩa');
    if (!allowedLevels.includes(row.hsk_level)) {
      errors.push(`${config.shortLabel} chỉ có cấp ${allowedLevels[0]}–${allowedLevels[allowedLevels.length - 1]}`);
    }

    const card = { ...row, collection };
    const entryKey = vocabEntryKey(card);
    const isDuplicate = existing.entries.has(entryKey) || seenEntries.has(entryKey);
    seenEntries.add(entryKey);

    const matches = isDuplicate ? [] : existing.hanzi.get(vocabHanziKey(card)) ?? [];

    let status: 'valid' | 'duplicate' | 'error';
    if (errors.length > 0) {
      status = 'error';
    } else if (isDuplicate) {
      status = 'duplicate';
    } else {
      status = 'valid';
    }

    return {
      row,
      rowIndex: index + 1,
      status,
      errors,
      selected: status === 'valid',
      sameHanziMatches: matches.length > 0 ? matches : undefined,
    };
  });
}

// --- Helpers ---

interface ColumnMap {
  hanzi: number;
  pinyin: number;
  meaning: number;
  hsk_level: number;
  lesson_number?: number;
  lesson_title?: number;
  topic?: number;
  example?: number;
  example_pinyin?: number;
  example_meaning?: number;
}

function mapColumns(headers: string[]): ColumnMap | null {
  const find = (names: string[]): number => {
    return headers.findIndex(h => names.includes(h));
  };

  const hanzi = find(['hanzi', 'hán tự', 'han_tu', '汉字', '漢字']);
  const pinyin = find(['pinyin', 'phiên âm', 'phien_am', '拼音']);
  const meaning = find(['meaning', 'nghĩa', 'nghia', 'ý nghĩa', '意思', '释义']);
  const hsk_level = find(['hsk_level', 'hsk', 'level', 'cấp', 'cap', '级别', '等级']);

  if (hanzi === -1 || pinyin === -1 || meaning === -1 || hsk_level === -1) {
    return null;
  }

  const lesson_number = find(['lesson_number', 'lesson', 'bài', 'bai', 'bài số', 'bai_so', '课', '课号']);
  const lesson_title = find(['lesson_title', 'tên bài', 'ten_bai', 'tiêu đề bài', '课题']);
  const topic = find(['topic', 'chủ đề', 'chu_de', 'chude', '主题', '话题']);

  return {
    hanzi,
    pinyin,
    meaning,
    hsk_level,
    lesson_number: lesson_number !== -1 ? lesson_number : undefined,
    lesson_title: lesson_title !== -1 ? lesson_title : undefined,
    topic: topic !== -1 ? topic : undefined,
    example: find(['example', 'ví dụ', 'vi_du', '例句']) !== -1 ? find(['example', 'ví dụ', 'vi_du', '例句']) : undefined,
    example_pinyin: find(['example_pinyin', 'pinyin ví dụ', '例句拼音']) !== -1 ? find(['example_pinyin', 'pinyin ví dụ', '例句拼音']) : undefined,
    example_meaning: find(['example_meaning', 'nghĩa ví dụ', '例句翻译']) !== -1 ? find(['example_meaning', 'nghĩa ví dụ', '例句翻译']) : undefined,
  };
}

/** Bỏ khoảng trắng thừa nhưng giữ xuống dòng (nhiều ví dụ trong 1 ô) */
function cleanCell(value: string | undefined): string {
  return (value ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .join('\n')
    .trim();
}

/** Parse toàn bộ CSV, tôn trọng ô trong ngoặc kép (có thể chứa dấu phẩy và xuống dòng) */
function parseCsvRecords(text: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(current);
      current = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(current);
      records.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }
  if (current || row.length > 0) {
    row.push(current);
    records.push(row);
  }
  return records;
}
