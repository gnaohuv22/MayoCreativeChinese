import { Injectable } from '@angular/core';
import { getSupabase } from '../../../services/supabase.client';

export interface StaffMember {
  user_id: string;
  username: string;
  full_name: string;
  role_id: string;
  role: { label: string } | null;
  /** Vai trò có quyền staff.manage (không được đặt lại mật khẩu cho nhau) */
  is_admin: boolean;
}

export interface ActivityEntry {
  id: number;
  created_at: string;
  actor_id: string | null;
  actor_username: string | null;
  action: string;
  entity_type: string;
  entity_count: number;
  summary: string;
  details: { items?: Record<string, unknown>[]; username?: string } & Record<string, unknown>;
}

export interface ActivityFilter {
  actor?: string;
  entityType?: string;
  action?: string;
  search?: string;
}

export interface ActivitySummary {
  since: string;
  total: number;
  today: number;
  active_staff: number;
  by_action: { action: string; count: number }[];
  by_actor: { username: string; full_name: string | null; count: number }[];
  by_day: { day: string; count: number }[];
}

export type ResetPasswordError =
  | 'forbidden'
  | 'too_many_attempts'
  | 'not_found'
  | 'self'
  | 'target_is_admin'
  | 'wrong_admin_password'
  | 'weak_password';

const ACTIVITY_COLUMNS = 'id, created_at, actor_id, actor_username, action, entity_type, entity_count, summary, details';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly supabase = getSupabase();

  async listStaff(): Promise<{ data: StaffMember[]; error?: string }> {
    const [staff, adminRoles] = await Promise.all([
      this.supabase
        .from('staff_profiles')
        .select('user_id, username, full_name, role_id, role:roles(label, sort_order)')
        .order('username'),
      this.supabase.from('role_permissions').select('role_id').eq('permission', 'staff.manage'),
    ]);
    if (staff.error) return { data: [], error: staff.error.message };
    const admins = new Set((adminRoles.data ?? []).map(r => r.role_id));
    const data = (staff.data as unknown as (Omit<StaffMember, 'is_admin'> & { role: { label: string; sort_order: number } | null })[])
      .map(s => ({ ...s, is_admin: admins.has(s.role_id) }))
      .sort((a, b) => (a.role?.sort_order ?? 99) - (b.role?.sort_order ?? 99) || a.username.localeCompare(b.username));
    return { data };
  }

  async resetStaffPassword(targetUserId: string, adminPassword: string, newPassword: string): Promise<{ error?: ResetPasswordError | string }> {
    const { data, error } = await this.supabase.rpc('admin_reset_staff_password', {
      p_target: targetUserId,
      p_admin_password: adminPassword,
      p_new_password: newPassword,
    });
    if (error) return { error: error.message };
    const result = data as { ok: boolean; error?: ResetPasswordError };
    return result.ok ? {} : { error: result.error ?? 'unknown' };
  }

  async listActivity(filter: ActivityFilter, page: number, pageSize: number): Promise<{ data: ActivityEntry[]; total: number; error?: string }> {
    let q = this.supabase.from('activity_log').select(ACTIVITY_COLUMNS, { count: 'exact' });
    if (filter.actor) q = filter.actor === '__system' ? q.is('actor_username', null) : q.eq('actor_username', filter.actor);
    if (filter.entityType) q = q.eq('entity_type', filter.entityType);
    if (filter.action) q = q.eq('action', filter.action);
    if (filter.search?.trim()) q = q.ilike('summary', `%${filter.search.trim().replace(/[%_]/g, '\\$&')}%`);

    const from = (page - 1) * pageSize;
    const { data, count, error } = await q.order('created_at', { ascending: false }).order('id', { ascending: false }).range(from, from + pageSize - 1);
    if (error) return { data: [], total: 0, error: error.message };
    return { data: (data ?? []) as ActivityEntry[], total: count ?? 0 };
  }

  async activitySummary(days: number): Promise<ActivitySummary | null> {
    const { data, error } = await this.supabase.rpc('activity_summary', { p_days: days });
    if (error) {
      console.error('activity_summary failed:', error);
      return null;
    }
    return data as ActivitySummary;
  }
}
