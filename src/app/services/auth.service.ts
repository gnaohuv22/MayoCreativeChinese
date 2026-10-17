import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { isGrantActive, type AccessModule, type ContentViewer } from '../components/shared/visibility/content-visibility';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from './supabase.client';
import { AdminPresence } from './admin-presence';
import { RequestCache } from './request-cache';

/** Đăng nhập bằng tên ngắn (vd "admin") → email Supabase Auth tương ứng */
const LOGIN_EMAIL_DOMAIN = 'mayocreativechinese.edu.vn';
/** Tài khoản học viên (migration 019, create_students) */
const STUDENT_EMAIL_DOMAIN = 'hocvien.mayocreativechinese.edu.vn';
/** Khách tự đăng ký bằng số điện thoại (migration 021, register_guest) */
const GUEST_EMAIL_DOMAIN = 'khach.mayocreativechinese.edu.vn';

/** "0912 345 678", "+84912345678" → "0912345678"; null nếu không phải số di động VN (khớp normalize_vn_phone) */
export function normalizeVnPhone(input: string): string | null {
  let digits = input.replace(/\D/g, '');
  if (/^84\d{9}$/.test(digits)) digits = `0${digits.slice(2)}`;
  return /^0[35789]\d{8}$/.test(digits) ? digits : null;
}

export type GuestRegisterError =
  | 'invalid_email' | 'invalid_phone' | 'missing_name' | 'weak_password' | 'no_consent'
  | 'email_taken' | 'phone_taken' | 'rate_limited' | 'captcha_required' | 'captcha_failed';

/** Lỗi đăng nhập người học có xử lý riêng trên giao diện */
export const EMAIL_NOT_CONFIRMED = 'email_not_confirmed';
export const LOGIN_RATE_LIMITED = 'login_rate_limited';

export type OauthProfileError = 'not_oauth' | 'has_profile' | 'missing_name' | 'invalid_phone' | 'phone_taken' | 'no_consent';
export type ResetPasswordError = 'not_recovery' | 'not_student' | 'weak_password';

/** Email đăng nhập nội bộ (không nhận thư) của khách cũ / học viên lớp / nhân sự */
export function isInternalEmail(email: string | null | undefined): boolean {
  const e = (email ?? '').toLowerCase();
  return e.endsWith(`@${GUEST_EMAIL_DOMAIN}`) || e.endsWith(`@${STUDENT_EMAIL_DOMAIN}`) || e.endsWith(`@${LOGIN_EMAIL_DOMAIN}`);
}

/** Đường dẫn tuyệt đối trên trang hiện tại (link trong thư / quay lại sau Google) */
function siteUrl(path: string): string {
  return new URL(path, location.origin).href;
}

/** Khớp bảng public.role_permissions (migration 013) */
export type Permission =
  | 'content.read'
  | 'content.create'
  | 'content.update'
  | 'content.delete'
  | 'staff.manage'
  | 'activity.read'
  | 'role.manage'
  | 'access.manage'
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
  /** guest = khách tự đăng ký (không thuộc lớp), student = học viên lớp */
  account_type: 'student' | 'guest';
  must_change_password: boolean;
  class: StudentClassInfo | null;
  /** Quyền Mayo+ còn hạn (migration 024); expires_at null = không thời hạn */
  access?: AccessGrant[];
}

export interface AccessGrant {
  module: AccessModule;
  expires_at: string | null;
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
  readonly roleId = computed(() => this.context()?.role ?? '');
  readonly roleLabel = computed(() => this.context()?.role_label ?? '');
  readonly roleDescription = computed(() => this.context()?.role_description ?? '');
  /** Có hồ sơ nhân sự = được vào khu quản trị */
  readonly isStaff = computed(() => this.context() !== null);
  /** Người học đã đăng nhập (học viên lớp hoặc khách): lưu tiến độ, bài thi */
  readonly isLearner = computed(() => this.studentContext() !== null);
  /** Học viên lớp: mở nội dung "Học viên" */
  readonly isStudent = computed(() => this.studentContext()?.account_type === 'student');
  readonly isGuest = computed(() => this.studentContext()?.account_type === 'guest');
  /** Quyền Mayo+ được cấp còn hạn */
  readonly accessGrants = computed<AccessGrant[]>(() => this.studentContext()?.access ?? []);
  readonly student = this.studentContext.asReadonly();
  readonly userId = computed(() => this.session()?.user.id ?? null);
  /** Email đăng nhập; email nội bộ của khách cũ / học viên lớp không nhận được thư */
  readonly email = computed(() => this.session()?.user.email ?? null);
  /** Đăng nhập Google nhưng chưa điền hồ sơ khách (complete_oauth_profile) */
  readonly needsOauthProfile = computed(() => {
    const user = this.session()?.user;
    const provider = user?.app_metadata?.['provider'];
    return !!user && !!provider && provider !== 'email' && !this.context() && !this.studentContext();
  });
  /** Đăng nhập bằng mật khẩu (không phải Google) — mới đổi mật khẩu được */
  readonly hasPassword = computed(() => (this.session()?.user.app_metadata?.['provider'] ?? 'email') === 'email');
  /** Khách chưa có email nhận thư (đăng ký trước 022) — cần thêm email để khôi phục mật khẩu */
  readonly needsRecoveryEmail = computed(() => this.isGuest() && this.hasPassword() && isInternalEmail(this.email()));
  /** Tên Google trả về, để điền sẵn khi hoàn tất hồ sơ */
  readonly oauthName = computed(() => {
    const meta = this.session()?.user.user_metadata ?? {};
    return String(meta['full_name'] ?? meta['name'] ?? '');
  });

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
    effect(() => presence.guest.set(this.isGuest()));
    // Dữ liệu đã cache theo quyền cũ (khách / nhân sự / học viên) không còn đúng
    let lastViewer = 'visitor';
    effect(() => {
      const viewer = this.isStaff() ? 'staff' : this.studentContext() ? `student:${this.studentContext()!.username}` : 'visitor';
      if (viewer !== lastViewer) RequestCache.clearAll();
      lastViewer = viewer;
    });
  }

  /** Mở được nội dung Mayo+ của module: nhân sự xem nội dung, học viên lớp, hoặc được cấp quyền còn hạn */
  hasAccess(module: AccessModule): boolean {
    if (this.can('content.read') || this.isStudent()) return true;
    return this.accessGrants().some(g => g.module === module && isGrantActive(g));
  }

  /** Người đang xem trang học viên, cho module đang xem */
  viewer(module: AccessModule): ContentViewer {
    return {
      staff: this.can('content.read'),
      student: this.isStudent(),
      learner: this.isLearner(),
      paid: this.hasAccess(module),
    };
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
    if (error) {
      if (error.code === 'user_banned') return { error: 'Tài khoản đã bị khoá. Vui lòng liên hệ quản trị viên.' };
      return { error: error.message };
    }
    this.sessionLost.set(false);
    if (!(await this.loadContext())) {
      await this.supabase.auth.signOut();
      return { error: 'Tài khoản này không có quyền quản trị.' };
    }
    await this.supabase.rpc('log_self_event', { p_action: 'login' });
    return {};
  }

  /**
   * Đăng nhập người học (trang /dang-nhap): email hoặc số điện thoại của khách, tên đăng nhập học viên lớp.
   * Số điện thoại → email đăng nhập tra bằng learner_login_email (chỉ trả khi mật khẩu đúng).
   * Trả `email` khi lỗi EMAIL_NOT_CONFIRMED để trang gửi lại thư xác nhận.
   */
  async signInStudent(username: string, password: string): Promise<{ error?: string; email?: string }> {
    const login = username.trim().toLowerCase();
    if (!login) return { error: 'Invalid login credentials' };
    const phone = /^[+\d][\d\s.-]*$/.test(login) ? normalizeVnPhone(login) : null;
    let email = login.includes('@') ? login : `${login}@${STUDENT_EMAIL_DOMAIN}`;
    if (phone) {
      const { data, error } = await this.supabase.rpc('learner_login_email', { p_phone: phone, p_password: password });
      if (error) return { error: error.message };
      const result = data as { email?: string; error?: 'invalid' | 'rate_limited' };
      if (result.error === 'rate_limited') return { error: LOGIN_RATE_LIMITED };
      if (!result.email) return { error: 'Invalid login credentials' };
      email = result.email;
    }
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.code === 'user_banned') return { error: 'Tài khoản đã bị khoá. Vui lòng liên hệ giáo viên của lớp.' };
      if (error.code === 'email_not_confirmed') return { error: EMAIL_NOT_CONFIRMED, email };
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

  /** Khách tự đăng ký; đăng nhập được sau khi bấm link trong thư xác nhận. Trả email đã chuẩn hoá. */
  async registerGuest(input: { email: string; phone: string; password: string; fullName: string; consent: boolean; turnstileToken: string | null }): Promise<{ error?: GuestRegisterError | string; email?: string }> {
    const phone = normalizeVnPhone(input.phone);
    if (!phone) return { error: 'invalid_phone' };
    const call = this.supabase.rpc('register_guest', {
      p_email: input.email.trim(),
      p_phone: phone,
      p_password: input.password,
      p_full_name: input.fullName.trim(),
      p_consent: input.consent,
    });
    // Proxy (api/rest.mjs) kiểm tra token Turnstile trước khi chuyển tới DB
    const { data, error } = await (input.turnstileToken ? call.setHeader('x-turnstile-token', input.turnstileToken) : call);
    if (error) return { error: error.message };
    const result = data as { ok: boolean; email?: string; error?: GuestRegisterError };
    if (!result.ok || !result.email) return { error: result.error ?? 'unknown' };
    // Tài khoản tạo bằng SQL nên Supabase chưa gửi thư — yêu cầu gửi thư xác nhận
    const sent = await this.resendConfirmation(result.email);
    if (sent.error) console.error('Gửi thư xác nhận thất bại:', sent.error);
    return { email: result.email };
  }

  /** Gửi (lại) thư xác nhận email; link trong thư đăng nhập luôn rồi quay về /dang-nhap */
  async resendConfirmation(email: string): Promise<{ error?: string }> {
    const { error } = await this.supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: siteUrl('/dang-nhap') },
    });
    return error ? { error: error.code === 'over_email_send_rate_limit' ? 'rate_limited' : error.message } : {};
  }

  /** Thư khôi phục mật khẩu (luôn báo đã gửi, để không dò được email nào có tài khoản) */
  async requestPasswordReset(email: string): Promise<{ error?: string }> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: siteUrl('/dat-lai-mat-khau'),
    });
    if (error?.code === 'over_email_send_rate_limit') return { error: 'rate_limited' };
    if (error) console.error('Gửi thư khôi phục thất bại:', error);
    return {};
  }

  /** Đặt mật khẩu mới trong phiên mở từ link khôi phục */
  async resetLearnerPassword(newPassword: string): Promise<{ error?: ResetPasswordError | string }> {
    if (!STUDENT_PASSWORD_RULES.every(rule => rule.test(newPassword))) return { error: 'weak_password' };
    const { data, error } = await this.supabase.rpc('learner_reset_password', { p_new: newPassword });
    if (error) return { error: error.message };
    const result = data as { ok: boolean; error?: ResetPasswordError };
    if (!result.ok) return { error: result.error ?? 'unknown' };
    this.studentContext.update(ctx => (ctx ? { ...ctx, must_change_password: false } : ctx));
    return {};
  }

  /** Chuyển sang Google; quay lại /dang-nhap (giữ returnUrl) với phiên đã đăng nhập */
  async signInWithGoogle(returnUrl?: string): Promise<{ error?: string }> {
    const back = returnUrl ? `/dang-nhap?returnUrl=${encodeURIComponent(returnUrl)}` : '/dang-nhap';
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: siteUrl(back) },
    });
    return error ? { error: error.message } : {};
  }

  /** Lần đầu đăng nhập Google: tạo hồ sơ khách */
  async completeOauthProfile(input: { fullName: string; phone: string; consent: boolean }): Promise<{ error?: OauthProfileError | string }> {
    const { data, error } = await this.supabase.rpc('complete_oauth_profile', {
      p_full_name: input.fullName.trim(),
      p_phone: input.phone.trim(),
      p_consent: input.consent,
    });
    if (error) return { error: error.message };
    const result = data as { ok: boolean; error?: OauthProfileError };
    if (!result.ok) return { error: result.error ?? 'unknown' };
    await this.loadContext();
    return {};
  }

  /** Khách cũ (email nội bộ) thêm email thật — Supabase gửi thư xác nhận tới email mới */
  async addRecoveryEmail(email: string): Promise<{ error?: string }> {
    const { error } = await this.supabase.auth.updateUser(
      { email: email.trim().toLowerCase() },
      { emailRedirectTo: siteUrl('/hoc-vien') },
    );
    if (!error) return {};
    if (error.code === 'email_exists') return { error: 'email_taken' };
    if (error.code === 'over_email_send_rate_limit') return { error: 'rate_limited' };
    if (error.code === 'email_address_invalid' || error.code === 'validation_failed') return { error: 'invalid_email' };
    return { error: error.message };
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
