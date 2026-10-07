/** Mức hiển thị nội dung (đề thi, cấp từ vựng) — khớp cột visibility (migration 017, 019) */
export type ContentVisibility = 'private' | 'staff' | 'students' | 'public';

export const VISIBILITY_OPTIONS: { value: ContentVisibility; label: string }[] = [
  { value: 'private', label: 'Bản nháp' },
  { value: 'staff', label: 'Nội bộ' },
  { value: 'students', label: 'Học viên' },
  { value: 'public', label: 'Công khai' },
];

export const VISIBILITY_LABELS: Record<ContentVisibility, string> = {
  private: 'Bản nháp',
  staff: 'Nội bộ',
  students: 'Học viên',
  public: 'Công khai',
};

/** Người đang xem trang học viên */
export interface ContentViewer {
  staff: boolean;
  student: boolean;
}

/**
 * Người xem trang học viên thấy nội dung thế nào:
 * open = học/thi bình thường, staff = như open nhưng đánh dấu "Nội bộ",
 * members = khách xem nội dung dành cho học viên, locked = "Sắp ra mắt".
 * Nội dung "Nội bộ" được gợi ý cho lớp thì học viên lớp đó mở được (`suggested`).
 * Bản nháp luôn khoá ở trang học viên, kể cả với nhân sự (xem trong khu quản trị).
 */
export type ContentAccess = 'open' | 'staff' | 'members' | 'locked';

export function contentAccess(visibility: ContentVisibility, viewer: ContentViewer, suggested = false): ContentAccess {
  if (visibility === 'public') return 'open';
  if (visibility === 'students') return viewer.staff || viewer.student ? 'open' : 'members';
  if (visibility === 'staff') {
    if (viewer.staff) return 'staff';
    if (viewer.student && suggested) return 'open';
  }
  return 'locked';
}

/** Khoá với người đang xem (khách gặp nội dung học viên cũng tính là khoá) */
export function isLockedAccess(access: ContentAccess): boolean {
  return access === 'locked' || access === 'members';
}

/** Mức chặt nhất trong nhiều mức (VD cấp gộp 7-9) */
export function strictestVisibility(list: ContentVisibility[]): ContentVisibility {
  if (list.includes('private')) return 'private';
  if (list.includes('staff')) return 'staff';
  if (list.includes('students')) return 'students';
  return 'public';
}
