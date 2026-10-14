import { Injectable } from '@angular/core';
import { getSupabase } from '../../../services/supabase.client';
import type { Permission } from '../../../services/auth.service';

export interface StaffMember {
  user_id: string;
  username: string;
  full_name: string;
  role_id: string;
  role: { label: string } | null;
  status: 'active' | 'locked';
  /** Vai trò có quyền staff.manage (không được đặt lại mật khẩu cho nhau) */
  is_admin: boolean;
}

/** Danh mục quyền (bảng public.permissions, migration 020) */
export interface PermissionInfo {
  id: Permission;
  label: string;
  description: string;
  grp: string;
}

export interface RoleInfo {
  id: string;
  label: string;
  description: string;
  sort_order: number;
  permissions: Permission[];
  staff_count: number;
}

export interface RoleInput {
  id: string;
  label: string;
  description: string;
  permissions: Permission[];
  create: boolean;
}

export interface NewStaffInput {
  username: string;
  full_name: string;
  role_id: string;
  password: string;
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
        .select('user_id, username, full_name, role_id, status, role:roles(label, sort_order)')
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

  async listRoles(): Promise<{ roles: RoleInfo[]; permissions: PermissionInfo[]; error?: string }> {
    const [roles, perms, staff] = await Promise.all([
      this.supabase.from('roles').select('id, label, description, sort_order, role_permissions(permission)').order('sort_order'),
      this.supabase.from('permissions').select('id, label, description, grp').order('sort_order'),
      this.supabase.from('staff_profiles').select('role_id'),
    ]);
    const error = roles.error ?? perms.error ?? staff.error;
    if (error) return { roles: [], permissions: [], error: error.message };
    const counts = new Map<string, number>();
    for (const s of staff.data ?? []) counts.set(s.role_id, (counts.get(s.role_id) ?? 0) + 1);
    const data = (roles.data as unknown as (Omit<RoleInfo, 'permissions' | 'staff_count'> & { role_permissions: { permission: Permission }[] })[])
      .map(({ role_permissions, ...r }) => ({
        ...r,
        permissions: role_permissions.map(p => p.permission),
        staff_count: counts.get(r.id) ?? 0,
      }));
    return { roles: data, permissions: (perms.data ?? []) as PermissionInfo[] };
  }

  async saveRole(input: RoleInput): Promise<{ error?: string }> {
    const { error } = await this.supabase.rpc('save_role', { p_role: input });
    return error ? { error: error.message } : {};
  }

  async deleteRole(id: string): Promise<{ error?: string }> {
    const { error } = await this.supabase.rpc('delete_role', { p_id: id });
    return error ? { error: error.message } : {};
  }

  async setStaffRole(userId: string, roleId: string): Promise<{ error?: string }> {
    const { error } = await this.supabase.rpc('set_staff_role', { p_user: userId, p_role: roleId });
    return error ? { error: error.message } : {};
  }

  async setStaffStatus(userId: string, status: 'active' | 'locked'): Promise<{ error?: string }> {
    const { error } = await this.supabase.rpc('set_staff_status', { p_user: userId, p_status: status });
    return error ? { error: error.message } : {};
  }

  async createStaff(input: NewStaffInput): Promise<{ error?: string }> {
    const { error } = await this.supabase.rpc('create_staff', { p_data: input });
    return error ? { error: error.message } : {};
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
