import type { ParsedImportRow, ValidatedImportRow, VocabCard, HskVersion } from '../models/vocab-card.model';

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
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));

  const colMap = mapColumns(headers);
  if (!colMap) {
    throw new Error('File CSV thiếu cột bắt buộc. Cần có: hanzi, pinyin, meaning, hsk_level');
  }

  const rows: ParsedImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    if (cells.every(c => !c.trim())) continue; // skip empty rows

    const rawVer = colMap.hsk_version !== undefined ? cells[colMap.hsk_version]?.trim() : '';
    const ver: HskVersion | undefined = rawVer === '2.0' || rawVer === '2' ? '2.0' : rawVer === '3.0' || rawVer === '3' ? '3.0' : undefined;

    const rawLesson = colMap.lesson_number !== undefined ? cells[colMap.lesson_number]?.trim() : '';
    const lessonNum = rawLesson ? parseInt(rawLesson, 10) : undefined;

    rows.push({
      hanzi: cells[colMap.hanzi]?.trim() ?? '',
      pinyin: cells[colMap.pinyin]?.trim() ?? '',
      meaning: cells[colMap.meaning]?.trim() ?? '',
      hsk_level: parseInt(cells[colMap.hsk_level]?.trim() ?? '0', 10),
      hsk_version: ver,
      lesson_number: isNaN(lessonNum as number) ? undefined : lessonNum,
      lesson_title: colMap.lesson_title !== undefined ? cells[colMap.lesson_title]?.trim() : undefined,
      example: colMap.example !== undefined ? cells[colMap.example]?.trim() : undefined,
      example_pinyin: colMap.example_pinyin !== undefined ? cells[colMap.example_pinyin]?.trim() : undefined,
      example_meaning: colMap.example_meaning !== undefined ? cells[colMap.example_meaning]?.trim() : undefined,
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
      if (row[key] !== undefined) return String(row[key]).trim();
      const mapped = headerMap[key.toLowerCase()];
      if (mapped && row[mapped] !== undefined) return String(row[mapped]).trim();
      return '';
    };

    const hanzi = getValue('hanzi');
    if (!hanzi) continue; // skip rows without hanzi

    const rawVer = getValue('hsk_version') || getValue('version');
    const ver: HskVersion | undefined = rawVer === '2.0' || rawVer === '2' ? '2.0' : rawVer === '3.0' || rawVer === '3' ? '3.0' : undefined;

    const rawLesson = getValue('lesson_number') || getValue('lesson') || getValue('bai');
    const lessonNum = rawLesson ? parseInt(rawLesson, 10) : undefined;

    rows.push({
      hanzi,
      pinyin: getValue('pinyin'),
      meaning: getValue('meaning'),
      hsk_level: parseInt(getValue('hsk_level') || '0', 10),
      hsk_version: ver,
      lesson_number: isNaN(lessonNum as number) ? undefined : lessonNum,
      lesson_title: getValue('lesson_title') || getValue('ten_bai') || undefined,
      example: getValue('example') || undefined,
      example_pinyin: getValue('example_pinyin') || undefined,
      example_meaning: getValue('example_meaning') || undefined,
    });
  }

  return rows;
}

/** Validate parsed rows against existing data */
export function validateRows(
  rows: ParsedImportRow[],
  existingKeys: Set<string>
): ValidatedImportRow[] {
  const seenInFile = new Set<string>();

  return rows.map((row, index) => {
    const errors: string[] = [];

    if (!row.hanzi) errors.push('Thiếu Hán tự');
    if (!row.pinyin) errors.push('Thiếu Pinyin');
    if (!row.meaning) errors.push('Thiếu Nghĩa');
    if (!row.hsk_level || row.hsk_level < 1 || row.hsk_level > 9) {
      errors.push('HSK level phải từ 1 đến 9');
    }

    const ver = row.hsk_version || '2.0';
    const compoundKey = `${row.hanzi.trim()}_${row.hsk_level}_${ver}`;
    const levelKey = `${row.hanzi.trim()}_${row.hsk_level}`;

    const isDuplicate =
      existingKeys.has(compoundKey) ||
      existingKeys.has(levelKey) ||
      existingKeys.has(row.hanzi.trim()) ||
      seenInFile.has(compoundKey);

    seenInFile.add(compoundKey);

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
    };
  });
}

// --- Helpers ---

interface ColumnMap {
  hanzi: number;
  pinyin: number;
  meaning: number;
  hsk_level: number;
  hsk_version?: number;
  lesson_number?: number;
  lesson_title?: number;
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

  const hsk_version = find(['hsk_version', 'version', 'phiên bản', 'phien_ban', '版本']);
  const lesson_number = find(['lesson_number', 'lesson', 'bài', 'bai', 'bài số', 'bai_so', '课', '课号']);
  const lesson_title = find(['lesson_title', 'tên bài', 'ten_bai', 'tiêu đề bài', '课题']);

  return {
    hanzi,
    pinyin,
    meaning,
    hsk_level,
    hsk_version: hsk_version !== -1 ? hsk_version : undefined,
    lesson_number: lesson_number !== -1 ? lesson_number : undefined,
    lesson_title: lesson_title !== -1 ? lesson_title : undefined,
    example: find(['example', 'ví dụ', 'vi_du', '例句']) !== -1 ? find(['example', 'ví dụ', 'vi_du', '例句']) : undefined,
    example_pinyin: find(['example_pinyin', 'pinyin ví dụ', '例句拼音']) !== -1 ? find(['example_pinyin', 'pinyin ví dụ', '例句拼音']) : undefined,
    example_meaning: find(['example_meaning', 'nghĩa ví dụ', '例句翻译']) !== -1 ? find(['example_meaning', 'nghĩa ví dụ', '例句翻译']) : undefined,
  };
}

/** Parse a single CSV line respecting quoted fields */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}
