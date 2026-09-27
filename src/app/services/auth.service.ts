import { Injectable, computed, signal } from '@angular/core';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from './supabase.client';

/** Đăng nhập bằng tên ngắn (vd "admin") → email Supabase Auth tương ứng */
const LOGIN_EMAIL_DOMAIN = 'mayocreativechinese.edu.vn';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = getSupabase();
  private readonly session = signal<Session | null>(null);

  readonly email = computed(() => this.session()?.user.email ?? null);
  /** Khớp với public.is_admin() phía DB (migration 008) */
  readonly isAdmin = computed(() => this.session()?.user.app_metadata?.['role'] === 'admin');

  /** Resolve khi đã khôi phục session từ localStorage */
  readonly ready: Promise<void>;

  constructor() {
    this.ready = this.supabase.auth.getSession().then(({ data }) => this.session.set(data.session));
    this.supabase.auth.onAuthStateChange((_event, session) => this.session.set(session));
  }

  async signIn(username: string, password: string): Promise<{ error?: string }> {
    const login = username.trim().toLowerCase();
    const email = login.includes('@') ? login : `${login}@${LOGIN_EMAIL_DOMAIN}`;
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user?.app_metadata?.['role'] !== 'admin') {
      await this.supabase.auth.signOut();
      return { error: 'Tài khoản này không có quyền quản trị.' };
    }
    return {};
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }
}
