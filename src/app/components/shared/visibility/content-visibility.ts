/** Mức hiển thị nội dung (đề thi, cấp từ vựng) — khớp cột visibility (migration 017) */
export type ContentVisibility = 'private' | 'staff' | 'public';

export const VISIBILITY_OPTIONS: { value: ContentVisibility; label: string }[] = [
  { value: 'private', label: 'Bản nháp' },
  { value: 'staff', label: 'Nội bộ' },
  { value: 'public', label: 'Công khai' },
];

export const VISIBILITY_LABELS: Record<ContentVisibility, string> = {
  private: 'Bản nháp',
  staff: 'Nội bộ',
  public: 'Công khai',
};

/**
 * Người xem trang học viên thấy nội dung thế nào:
 * open = học/thi bình thường, staff = như open nhưng đánh dấu "Nội bộ", locked = "Sắp ra mắt".
 * Bản nháp luôn khoá ở trang học viên, kể cả với nhân sự (xem trong khu quản trị).
 */
export type ContentAccess = 'open' | 'staff' | 'locked';

export function contentAccess(visibility: ContentVisibility, isStaff: boolean): ContentAccess {
  if (visibility === 'public') return 'open';
  if (visibility === 'staff' && isStaff) return 'staff';
  return 'locked';
}

/** Mức chặt nhất trong nhiều mức (VD cấp gộp 7-9) */
export function strictestVisibility(list: ContentVisibility[]): ContentVisibility {
  if (list.includes('private')) return 'private';
  if (list.includes('staff')) return 'staff';
  return 'public';
}
