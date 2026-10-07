import type { StudentProfileInput } from '../models/class.model';

/** 1 dòng học viên đọc từ file / dán từ Excel, trước khi tạo tài khoản */
export interface StudentDraft extends StudentProfileInput {
  username_base: string;
  password: string;
  /** Lỗi chặn tạo (thiếu họ tên…) */
  errors: string[];
  /** Cảnh báo không chặn (trùng tên trong danh sách…) */
  warnings: string[];
}

type DraftField = keyof StudentProfileInput;

/** Tiêu đề cột (viết thường, bỏ dấu) → trường. Cột không nhận ra bị bỏ qua. */
const HEADER_ALIASES: Record<string, DraftField> = {
  'ho ten': 'full_name', 'ho va ten': 'full_name', 'ten': 'full_name', 'hoc vien': 'full_name', 'ten hoc vien': 'full_name',
  'full_name': 'full_name', 'full name': 'full_name', 'name': 'full_name',
  'nam sinh': 'birth_year', 'birth_year': 'birth_year', 'birth year': 'birth_year',
  'so dien thoai': 'phone', 'dien thoai': 'phone', 'sdt': 'phone', 'phone': 'phone',
  'email': 'email', 'e-mail': 'email', 'gmail': 'email',
  'sdt phu huynh': 'parent_phone', 'so dien thoai phu huynh': 'parent_phone', 'phu huynh': 'parent_phone',
  'dien thoai phu huynh': 'parent_phone', 'parent_phone': 'parent_phone', 'parent phone': 'parent_phone',
  'ghi chu': 'notes', 'notes': 'notes', 'note': 'notes',
};

/** Thứ tự cột khi dán dữ liệu không có dòng tiêu đề (khớp file mẫu) */
const DEFAULT_ORDER: DraftField[] = ['full_name', 'birth_year', 'phone', 'email', 'parent_phone', 'notes'];

export const TEMPLATE_HEADERS = ['Họ tên', 'Năm sinh', 'Số điện thoại', 'Email', 'SĐT phụ huynh', 'Ghi chú'];

/** Bỏ dấu tiếng Việt: "Lưu Ngọc Mai" → "Luu Ngoc Mai" */
export function stripVietnamese(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

/**
 * Phần chữ của tên đăng nhập, theo quy tắc nhân sự: tên + chữ cái đầu của họ và tên đệm.
 * "Lưu Ngọc Mai" → "MaiLN". DB thêm 4 số ngẫu nhiên phía sau (MaiLN4821).
 */
export function usernameBase(fullName: string): string {
  const words = stripVietnamese(fullName)
    .split(/\s+/)
    .map(w => w.replace(/[^A-Za-z]/g, ''))
    .filter(Boolean);
  if (words.length === 0) return '';
  const given = words[words.length - 1];
  const initials = words.slice(0, -1).map(w => w[0].toUpperCase()).join('');
  return (given[0].toUpperCase() + given.slice(1).toLowerCase() + initials).slice(0, 30);
}

function normalizeHeader(cell: string): string {
  return stripVietnamese(cell).toLowerCase().replace(/[.:*]/g, '').replace(/\s+/g, ' ').trim();
}

/** Dòng đầu có phải tiêu đề không (có ít nhất cột họ tên) → vị trí từng trường */
export function mapHeaderRow(cells: string[]): Partial<Record<DraftField, number>> | null {
  const map: Partial<Record<DraftField, number>> = {};
  cells.forEach((cell, i) => {
    const field = HEADER_ALIASES[normalizeHeader(cell)];
    if (field && map[field] === undefined) map[field] = i;
  });
  return map.full_name !== undefined ? map : null;
}

function cellText(value: unknown): string {
  return value == null ? '' : String(value).replace(/\s+/g, ' ').trim();
}

/** Bảng ô (dòng × cột) → dữ liệu học viên chưa kiểm tra. Có tiêu đề thì theo tiêu đề, không thì theo thứ tự mẫu. */
export function rowsToProfiles(table: unknown[][]): StudentProfileInput[] {
  const rows = table.map(r => r.map(cellText)).filter(r => r.some(Boolean));
  if (rows.length === 0) return [];

  const header = mapHeaderRow(rows[0]);
  const columns: Partial<Record<DraftField, number>> =
    header ?? Object.fromEntries(DEFAULT_ORDER.map((field, i) => [field, i]));
  const body = header ? rows.slice(1) : rows;

  return body
    .map(cells => {
      const get = (field: DraftField) => (columns[field] !== undefined ? cells[columns[field]!] ?? '' : '');
      const year = parseInt(get('birth_year'), 10);
      return {
        full_name: get('full_name'),
        birth_year: Number.isFinite(year) ? year : null,
        phone: get('phone'),
        email: get('email'),
        parent_phone: get('parent_phone'),
        notes: get('notes'),
      };
    })
    .filter(p => Object.values(p).some(v => v !== '' && v !== null));
}

/** Dán từ Excel / Google Sheets (cột cách nhau bằng tab) hoặc mỗi dòng một họ tên */
export function parsePastedText(text: string): StudentProfileInput[] {
  const table = text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map(line => line.split('\t'));
  return rowsToProfiles(table);
}

/** Đọc file Excel / CSV (thư viện xlsx nạp động, chỉ khi cần) */
export async function parseStudentFile(file: File): Promise<StudentProfileInput[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
    throw new Error(`Định dạng file không hỗ trợ: .${ext}. Chỉ nhận .xlsx, .xls, .csv`);
  }
  const XLSX = await import('xlsx');
  const wb = ext === 'csv'
    ? XLSX.read((await file.text()).replace(/^﻿/, ''), { type: 'string' })
    : XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  return rowsToProfiles(XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '' }));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Kiểm tra danh sách + tạo phần chữ của tên đăng nhập và mật khẩu cho từng dòng */
export function buildDrafts(
  profiles: StudentProfileInput[],
  makePassword: () => string,
  currentYear = new Date().getFullYear(),
): StudentDraft[] {
  const nameCount = new Map<string, number>();
  for (const p of profiles) {
    const key = stripVietnamese(p.full_name).toLowerCase();
    if (key) nameCount.set(key, (nameCount.get(key) ?? 0) + 1);
  }

  return profiles.map(p => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const base = usernameBase(p.full_name);
    if (!p.full_name.trim()) errors.push('Thiếu họ tên');
    else if (!base) errors.push('Họ tên không có chữ cái');
    if (p.birth_year !== null && (p.birth_year < 1900 || p.birth_year > currentYear)) errors.push('Năm sinh không hợp lệ');
    if (p.email && !EMAIL_RE.test(p.email)) errors.push('Email không hợp lệ');
    if ((nameCount.get(stripVietnamese(p.full_name).toLowerCase()) ?? 0) > 1) warnings.push('Trùng họ tên trong danh sách');
    return { ...p, username_base: base, password: makePassword(), errors, warnings };
  });
}

/** File mẫu Excel cho giáo viên điền */
export async function downloadStudentTemplate(): Promise<void> {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet([
    TEMPLATE_HEADERS,
    ['Nguyễn Văn An', 2008, '0901234567', 'an@example.com', '0912345678', ''],
  ]);
  ws['!cols'] = [{ wch: 26 }, { wch: 10 }, { wch: 16 }, { wch: 26 }, { wch: 16 }, { wch: 24 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Học viên');
  XLSX.writeFile(wb, 'mau-danh-sach-hoc-vien.xlsx');
}

export interface IssuedCredential {
  full_name: string;
  username: string;
  password: string;
}

/** Danh sách tài khoản vừa cấp (để in / gửi riêng cho học viên) — mật khẩu không lưu ở đâu khác */
export async function downloadCredentials(classCode: string, items: IssuedCredential[], loginUrl: string): Promise<void> {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet([
    ['Họ tên', 'Tên đăng nhập', 'Mật khẩu', 'Trang đăng nhập'],
    ...items.map(i => [i.full_name, i.username, i.password, loginUrl]),
  ]);
  ws['!cols'] = [{ wch: 26 }, { wch: 18 }, { wch: 14 }, { wch: 44 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tài khoản');
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `tai-khoan-${classCode.toLowerCase()}-${stamp}.xlsx`);
}
