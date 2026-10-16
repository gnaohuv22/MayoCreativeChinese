/** Mức hiển thị nội dung (đề thi, cấp từ vựng) — khớp cột visibility (migration 017, 019, 024) */
export type ContentVisibility = 'private' | 'staff' | 'students' | 'paid' | 'members' | 'public';

/** Từ chặt tới mở */
export const VISIBILITY_OPTIONS: { value: ContentVisibility; label: string }[] = [
  { value: 'private', label: 'Bản nháp' },
  { value: 'staff', label: 'Nội bộ' },
  { value: 'students', label: 'Học viên' },
  { value: 'paid', label: 'Trả phí' },
  { value: 'members', label: 'Thành viên' },
  { value: 'public', label: 'Công khai' },
];

export const VISIBILITY_LABELS: Record<ContentVisibility, string> = {
  private: 'Bản nháp',
  staff: 'Nội bộ',
  students: 'Học viên',
  paid: 'Trả phí',
  members: 'Thành viên',
  public: 'Công khai',
};

/** Module cấp quyền Trả phí (access_grants.module) */
export type AccessModule = 'flashcards' | 'exams';

export const ACCESS_MODULE_LABELS: Record<AccessModule, string> = {
  flashcards: 'Flashcards',
  exams: 'Đề thi HSK',
};

/** Nơi liên hệ để mở khoá nội dung Trả phí */
export const UNLOCK_CONTACT_URL = 'https://www.facebook.com/mayocreativechinese';

/** Người đang xem trang học viên */
export interface ContentViewer {
  staff: boolean;
  /** Học viên lớp đang hoạt động */
  student: boolean;
  /** Đã đăng nhập tài khoản học viên (khách tự đăng ký hoặc học viên lớp) */
  learner?: boolean;
  /** Mở được nội dung Trả phí của module đang xem (học viên lớp hoặc được cấp quyền còn hạn) */
  paid?: boolean;
}

/**
 * Người xem trang học viên thấy nội dung thế nào:
 * open = học/thi bình thường, staff = như open nhưng đánh dấu "Nội bộ",
 * members = cần tài khoản học viên lớp ("Học viên"), login = cần đăng nhập ("Thành viên"),
 * paid = cần được cấp quyền ("Trả phí"), locked = "Sắp ra mắt".
 * Nội dung "Nội bộ" được gợi ý cho lớp thì học viên lớp đó mở được (`suggested`).
 * Bản nháp luôn khoá ở trang học viên, kể cả với nhân sự (xem trong khu quản trị).
 */
export type ContentAccess = 'open' | 'staff' | 'members' | 'login' | 'paid' | 'locked';

export function contentAccess(visibility: ContentVisibility, viewer: ContentViewer, suggested = false): ContentAccess {
  switch (visibility) {
    case 'public':
      return 'open';
    case 'members':
      return viewer.staff || viewer.student || viewer.learner ? 'open' : 'login';
    case 'paid':
      return viewer.staff || viewer.student || viewer.paid ? 'open' : 'paid';
    case 'students':
      return viewer.staff || viewer.student ? 'open' : 'members';
    case 'staff':
      if (viewer.staff) return 'staff';
      if (viewer.student && suggested) return 'open';
      return 'locked';
    default:
      return 'locked';
  }
}

/** Khoá với người đang xem (cần đăng nhập / cần quyền cũng tính là khoá) */
export function isLockedAccess(access: ContentAccess): boolean {
  return access !== 'open' && access !== 'staff';
}

/** Mức chặt nhất trong nhiều mức (VD cấp gộp 7-9) */
export function strictestVisibility(list: ContentVisibility[]): ContentVisibility {
  return VISIBILITY_OPTIONS.find(o => list.includes(o.value))?.value ?? 'public';
}
