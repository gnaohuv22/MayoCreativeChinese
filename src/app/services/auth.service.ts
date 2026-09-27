import { Injectable, computed, effect, inject, signal } from '@angular/core';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from './supabase.client';
import { AdminPresence } from './admin-presence';

/** Đăng nhập bằng tên ngắn (vd "admin") → email Supabase Auth tương ứng */
const LOGIN_EMAIL_DOMAIN = 'mayocreativechinese.edu.vn';

/** Khớp public.staff_role() phía DB (migration 012) */
export type StaffRole = 'owner' | 'editor';

export const STAFF_ROLE_LABELS: Record<StaffRole, { label: string; description: string }> = {
  owner: { label: 'Quản trị viên', description: 'Toàn quyền: xem, thêm, sửa và xoá nội dung.' },
  editor: { label: 'Biên tập viên', description: 'Xem, thêm và sửa nội dung; không được xoá.' },
};

/** Chính sách mật khẩu nhân sự */
export const PASSWORD_RULES: { label: string; test: (pw: string) => boolean }[] = [
  { label: 'Ít nhất 15 ký tự', test: pw => pw.length >= 15 },
  { label: 'Có chữ thường (a–z)', test: pw => /[a-z]/.test(pw) },
  { label: 'Có chữ hoa (A–Z)', test: pw => /[A-Z]/.test(pw) },
  { label: 'Có chữ số (0–9)', test: pw => /\d/.test(pw) },
  { label: 'Có ký tự đặc biệt (vd ! @ # $ % & *)', test: pw => /[^A-Za-z0-9\s]/.test(pw) },
];

function toStaffRole(value: unknown): StaffRole | null {
  return value === 'owner' || value === 'editor' ? value : null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = getSupabase();
  private readonly session = signal<Session | null>(null);

  readonly username = computed(() => {
    const user = this.session()?.user;
    return (user?.user_metadata?.['username'] as string | undefined) ?? user?.email?.split('@')[0] ?? '';
  });
  readonly displayName = computed(() =>
    (this.session()?.user.user_metadata?.['full_name'] as string | undefined) || this.username());
  readonly role = computed(() => toStaffRole(this.session()?.user.app_metadata?.['role']));
  readonly isStaff = computed(() => this.role() !== null);
  readonly isOwner = computed(() => this.role() === 'owner');

  /** Resolve khi đã khôi phục session từ localStorage */
  readonly ready: Promise<void>;

  constructor() {
    this.ready = this.supabase.auth.getSession().then(({ data }) => this.session.set(data.session));
    this.supabase.auth.onAuthStateChange((_event, session) => this.session.set(session));
    const presence = inject(AdminPresence);
    effect(() => presence.active.set(this.isStaff()));
  }

  async signIn(username: string, password: string): Promise<{ error?: string }> {
    const login = username.trim().toLowerCase();
    const email = login.includes('@') ? login : `${login}@${LOGIN_EMAIL_DOMAIN}`;
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (!toStaffRole(data.user?.app_metadata?.['role'])) {
      await this.supabase.auth.signOut();
      return { error: 'Tài khoản này không có quyền quản trị.' };
    }
    return {};
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  async updateFullName(fullName: string): Promise<{ error?: string }> {
    const { error } = await this.supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
    return error ? { error: error.message } : {};
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
    return {};
  }
}
