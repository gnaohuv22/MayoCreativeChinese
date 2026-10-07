import { Injectable, computed, effect, inject, signal } from '@angular/core';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from './supabase.client';
import { AdminPresence } from './admin-presence';
import { RequestCache } from './request-cache';

/** Đăng nhập bằng tên ngắn (vd "admin") → email Supabase Auth tương ứng */
const LOGIN_EMAIL_DOMAIN = 'mayocreativechinese.edu.vn';
/** Tài khoản học viên (migration 019, create_students) */
const STUDENT_EMAIL_DOMAIN = 'hocvien.mayocreativechinese.edu.vn';

/** Khớp bảng public.role_permissions (migration 013) */
export type Permission =
  | 'content.read'
  | 'content.create'
  | 'content.update'
  | 'content.delete'
  | 'staff.manage'
  | 'activity.read'
  | 'class.manage'
  | 'class.all'
  | 'class.delete'
  | 'student.manage'
  | 'student.delete';

/** Kết quả public.my_staff_context() */
export interface StaffContext {
  username: string;
  full_name: string;
  role: string;
  role_label: string;
  role_description: string;
  permissions: Permission[];
}

/** Kết quả public.my_student_context() (migration 019) */
export interface StudentContext {
  username: string;
  full_name: string;
  must_change_password: boolean;
  class: StudentClassInfo | null;
}

export interface StudentClassInfo {
  id: string;
  code: string;
  name: string;
  course_slug: string | null;
  hsk_level: number | null;
  hsk_version: '2.0' | '3.0' | null;
  study_mode: 'online' | 'offline' | null;
  start_date: string | null;
  end_date: string | null;
  schedule: string;
  status: 'planned' | 'active' | 'finished';
  archived: boolean;
  staff: { full_name: string; role: 'teacher' | 'assistant' }[];
}

/** Chính sách mật khẩu học viên (DB kiểm tra lại trong student_password_ok) */
export const STUDENT_PASSWORD_RULES: { label: string; test: (pw: string) => boolean }[] = [
  { label: 'Ít nhất 8 ký tự', test: pw => pw.length >= 8 },
  { label: 'Có chữ cái', test: pw => /[A-Za-z]/.test(pw) },
  { label: 'Có chữ số', test: pw => /\d/.test(pw) },
];

/** Mật khẩu học viên 10 ký tự, dễ đọc / dễ gõ: chữ thường + số, bỏ ký tự dễ nhầm */
export function generateStudentPassword(): string {
  const letters = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const random = (max: number) => crypto.getRandomValues(new Uint32Array(1))[0] % max;
  const pick = (set: string) => set[random(set.length)];
  // 6 chữ + 4 số, vd "kmtpra4827"
  return Array.from({ length: 6 }, () => pick(letters)).join('') + Array.from({ length: 4 }, () => pick(digits)).join('');
}

export type StudentPasswordError = 'not_student' | 'wrong_password' | 'weak_password' | 'same_password';

/** Chính sách mật khẩu nhân sự (phía DB kiểm tra lại trong admin_reset_staff_password) */
export const PASSWORD_RULES: { label: string; test: (pw: string) => boolean }[] = [
  { label: 'Ít nhất 15 ký tự', test: pw => pw.length >= 15 },
  { label: 'Có chữ thường (a–z)', test: pw => /[a-z]/.test(pw) },
  { label: 'Có chữ hoa (A–Z)', test: pw => /[A-Z]/.test(pw) },
  { label: 'Có chữ số (0–9)', test: pw => /\d/.test(pw) },
  { label: 'Có ký tự đặc biệt (vd ! @ # $ % & *)', test: pw => /[^A-Za-z0-9\s]/.test(pw) },
];

/** Mật khẩu ngẫu nhiên 16 ký tự đáp ứng PASSWORD_RULES (bỏ ký tự dễ nhầm như l/1/O/0) */
export function generateStrongPassword(): string {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '!@#$%&*?'];
  const all = sets.join('');
  const random = (max: number) => crypto.getRandomValues(new Uint32Array(1))[0] % max;
  const chars = sets.map(set => set[random(set.length)]);
  while (chars.length < 16) chars.push(all[random(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = getSupabase();
  private readonly session = signal<Session | null>(null);
  private readonly context = signal<StaffContext | null>(null);
  private readonly studentContext = signal<StudentContext | null>(null);

  readonly username = computed(() => this.context()?.username ?? this.studentContext()?.username ?? '');
  readonly displayName = computed(() => this.context()?.full_name || this.studentContext()?.full_name || this.username());
  readonly roleLabel = computed(() => this.context()?.role_label ?? '');
  readonly roleDescription = computed(() => this.context()?.role_description ?? '');
  /** Có hồ sơ nhân sự = được vào khu quản trị */
  readonly isStaff = computed(() => this.context() !== null);
  /** Có hồ sơ học viên đang hoạt động */
  readonly isStudent = computed(() => this.studentContext() !== null);
  readonly student = this.studentContext.asReadonly();
  readonly userId = computed(() => this.session()?.user.id ?? null);

  /** Phiên bị mất mà không phải do bấm Đăng xuất (hết hạn, gia hạn lỗi, đăng xuất ở tab khác) */
  readonly sessionLost = signal(false);
  private signingOut = false;

  /** Resolve khi đã khôi phục session + quyền */
  readonly ready: Promise<void>;

  constructor() {
    this.ready = this.supabase.auth.getSession().then(async ({ data }) => {
      this.session.set(data.session);
      if (data.session) await this.loadContext();
    });
    this.supabase.auth.onAuthStateChange((event, session) => {
      const hadSession = this.session() !== null;
      this.session.set(session);
      if (!session) {
        if (hadSession && !this.signingOut) {
          console.warn(`[auth] Mất phiên đăng nhập (${event}) lúc ${new Date().toLocaleString('vi-VN')}`);
          this.sessionLost.set(true);
        }
        this.context.set(null);
        this.studentContext.set(null);
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Không gọi Supabase trực tiếp trong callback (supabase-js có thể treo) — đẩy sang tick sau
        setTimeout(() => this.loadContext());
      }
    });
    const presence = inject(AdminPresence);
    effect(() => presence.active.set(this.isStaff()));
    effect(() => presence.student.set(this.studentContext()?.full_name ?? null));
    // Dữ liệu đã cache theo quyền cũ (khách / nhân sự / học viên) không còn đúng
    let lastViewer = 'visitor';
    effect(() => {
      const viewer = this.isStaff() ? 'staff' : this.studentContext() ? `student:${this.studentContext()!.username}` : 'visitor';
      if (viewer !== lastViewer) RequestCache.clearAll();
      lastViewer = viewer;
    });
  }

  can(permission: Permission): boolean {
    return this.context()?.permissions.includes(permission) ?? false;
  }

  async loadContext(): Promise<StaffContext | null> {
    const [staff, student] = await Promise.all([
      this.supabase.rpc('my_staff_context'),
      this.supabase.rpc('my_student_context'),
    ]);
    const ctx = staff.error ? null : (staff.data as StaffContext | null);
    this.context.set(ctx);
    this.studentContext.set(student.error ? null : (student.data as StudentContext | null));
    return ctx;
  }

  async signIn(username: string, password: string): Promise<{ error?: string }> {
    const login = username.trim().toLowerCase();
    const email = login.includes('@') ? login : `${login}@${LOGIN_EMAIL_DOMAIN}`;
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    this.sessionLost.set(false);
    if (!(await this.loadContext())) {
      await this.supabase.auth.signOut();
      return { error: 'Tài khoản này không có quyền quản trị.' };
    }
    await this.supabase.rpc('log_self_event', { p_action: 'login' });
    return {};
  }

  /** Đăng nhập học viên (trang /dang-nhap) — tài khoản do nhân sự tạo theo lớp */
  async signInStudent(username: string, password: string): Promise<{ error?: string }> {
    const login = username.trim().toLowerCase();
    if (!login || login.includes('@')) return { error: 'Invalid login credentials' };
    const { error } = await this.supabase.auth.signInWithPassword({ email: `${login}@${STUDENT_EMAIL_DOMAIN}`, password });
    if (error) {
      if (error.code === 'user_banned') return { error: 'Tài khoản đã bị khoá. Vui lòng liên hệ giáo viên của lớp.' };
      return { error: error.message };
    }
    this.sessionLost.set(false);
    await this.loadContext();
    if (!this.studentContext()) {
      await this.signOut();
      return { error: 'Tài khoản này không phải tài khoản học viên.' };
    }
    return {};
  }

  /** Học viên tự đổi mật khẩu (chính sách nhẹ hơn nhân sự, đổi qua RPC) */
  async changeStudentPassword(currentPassword: string, newPassword: string): Promise<{ error?: StudentPasswordError | string }> {
    if (!STUDENT_PASSWORD_RULES.every(rule => rule.test(newPassword))) return { error: 'weak_password' };
    const { data, error } = await this.supabase.rpc('student_change_password', { p_current: currentPassword, p_new: newPassword });
    if (error) return { error: error.message };
    const result = data as { ok: boolean; error?: StudentPasswordError };
    if (!result.ok) return { error: result.error ?? 'unknown' };
    this.studentContext.update(ctx => (ctx ? { ...ctx, must_change_password: false } : ctx));
    return {};
  }

  async signOut(): Promise<void> {
    this.signingOut = true;
    try {
      await this.supabase.auth.signOut();
    } finally {
      this.signingOut = false;
    }
    this.context.set(null);
    this.studentContext.set(null);
  }

  async updateFullName(fullName: string): Promise<{ error?: string }> {
    const userId = this.session()?.user.id;
    if (!userId) return { error: 'Phiên đăng nhập đã hết, vui lòng đăng nhập lại.' };
    const { data, error } = await this.supabase
      .from('staff_profiles')
      .update({ full_name: fullName.trim() })
      .eq('user_id', userId)
      .select('user_id');
    if (error) return { error: error.message };
    if (!data?.length) return { error: 'Không cập nhật được hồ sơ.' };
    await this.loadContext();
    return {};
  }

  /** Xác nhận mật khẩu hiện tại trước khi đổi, để người khác dùng máy đang đăng nhập không đổi được */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ error?: string }> {
    const email = this.session()?.user.email;
    if (!email) return { error: 'Phiên đăng nhập đã hết, vui lòng đăng nhập lại.' };
    if (!PASSWORD_RULES.every(rule => rule.test(newPassword))) {
      return { error: 'Mật khẩu mới chưa đáp ứng đủ yêu cầu.' };
    }

    const check = await this.supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (check.error) return { error: 'Mật khẩu hiện tại không đúng.' };

    const { error } = await this.supabase.auth.updateUser({ password: newPassword });
    if (error) {
      if (error.code === 'same_password') return { error: 'Mật khẩu mới phải khác mật khẩu hiện tại.' };
      if (error.code === 'weak_password') return { error: 'Mật khẩu mới quá yếu, hãy chọn mật khẩu khác.' };
      return { error: error.message };
    }
    await this.supabase.rpc('log_self_event', { p_action: 'password_change' });
    return {};
  }
}
