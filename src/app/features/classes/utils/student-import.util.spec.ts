import { describe, expect, it } from 'vitest';
import { buildDrafts, mapHeaderRow, parsePastedText, rowsToProfiles, usernameBase } from './student-import.util';

describe('usernameBase', () => {
  it('follows the staff pattern: given name + initials of family/middle names', () => {
    expect(usernameBase('Lưu Ngọc Mai')).toBe('MaiLN');
    expect(usernameBase('Nguyễn Thị Thuý Mai')).toBe('MaiNTT');
    expect(usernameBase('Đào Thị Mỹ Tâm')).toBe('TamDTM');
    expect(usernameBase('  trần   văn   đức ')).toBe('DucTV');
  });

  it('handles single names and strips non-letters', () => {
    expect(usernameBase('Na')).toBe('Na');
    expect(usernameBase('Anh-Thư Lê')).toBe('LeA');
    expect(usernameBase('123')).toBe('');
    expect(usernameBase('')).toBe('');
  });
});

describe('mapHeaderRow', () => {
  it('recognises Vietnamese and English headers', () => {
    expect(mapHeaderRow(['STT', 'Họ và tên', 'Năm sinh', 'SĐT', 'Email', 'SĐT phụ huynh'])).toEqual({
      full_name: 1, birth_year: 2, phone: 3, email: 4, parent_phone: 5,
    });
    expect(mapHeaderRow(['full_name', 'phone'])).toEqual({ full_name: 0, phone: 1 });
  });

  it('returns null when there is no name column', () => {
    expect(mapHeaderRow(['Nguyễn Văn An', '2008'])).toBeNull();
  });
});

describe('rowsToProfiles / parsePastedText', () => {
  it('uses the header row when present and skips empty rows', () => {
    const rows = rowsToProfiles([
      ['Email', 'Họ tên', 'Năm sinh'],
      ['an@x.vn', 'Nguyễn Văn An', '2008'],
      ['', '', ''],
      ['', 'Trần Thị Bình', ''],
    ]);
    expect(rows).toEqual([
      { full_name: 'Nguyễn Văn An', birth_year: 2008, phone: '', email: 'an@x.vn', parent_phone: '', notes: '' },
      { full_name: 'Trần Thị Bình', birth_year: null, phone: '', email: '', parent_phone: '', notes: '' },
    ]);
  });

  it('falls back to the template column order without a header', () => {
    const rows = parsePastedText('Nguyễn Văn An\t2008\t0901234567\nTrần Thị Bình');
    expect(rows.map(r => [r.full_name, r.birth_year, r.phone])).toEqual([
      ['Nguyễn Văn An', 2008, '0901234567'],
      ['Trần Thị Bình', null, ''],
    ]);
  });
});

describe('buildDrafts', () => {
  it('flags errors and duplicate names, and generates username bases and passwords', () => {
    let n = 0;
    const drafts = buildDrafts(
      [
        { full_name: 'Nguyễn Văn An', birth_year: 2008, phone: '', email: '', parent_phone: '', notes: '' },
        { full_name: 'Nguyen Van An', birth_year: 1800, phone: '', email: 'bad', parent_phone: '', notes: '' },
        { full_name: '', birth_year: null, phone: '090', email: '', parent_phone: '', notes: '' },
      ],
      () => `pw${++n}abcdef`,
      2026,
    );
    expect(drafts[0]).toMatchObject({ username_base: 'AnNV', password: 'pw1abcdef', errors: [], warnings: ['Trùng họ tên trong danh sách'] });
    expect(drafts[1].errors).toEqual(['Năm sinh không hợp lệ', 'Email không hợp lệ']);
    expect(drafts[2].errors).toEqual(['Thiếu họ tên']);
  });
});
