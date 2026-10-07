import type { ClassStatus, SchoolClass, StaffDirectoryEntry } from '../models/class.model';

export function classStatusClass(status: ClassStatus): string {
  return {
    planned: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    finished: 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300',
  }[status];
}

/** "2026-10-07" → "07/10/2026" */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Giáo viên trước, trợ giảng sau: "Lê Thị Linh, Đào Thị Mỹ Tâm" */
export function staffNames(cls: SchoolClass, directory: StaffDirectoryEntry[]): string {
  const byId = new Map(directory.map(d => [d.user_id, d.full_name || d.username]));
  return [...cls.staff]
    .sort((a, b) => (a.role === b.role ? 0 : a.role === 'teacher' ? -1 : 1))
    .map(s => byId.get(s.user_id))
    .filter(Boolean)
    .join(', ');
}
