import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { StatCardComponent } from '../../../../components/shared/stat-card/stat-card';
import { ACCESS_MODULE_LABELS, type AccessModule } from '../../../../components/shared/visibility/content-visibility';
import { ToastService } from '../../../../services/toast.service';
import { getSupabase } from '../../../../services/supabase.client';
import { formatDate, formatDateTime } from '../../../classes/utils/class-display.util';

/** staff_dashboard() (migration 027) */
interface DashboardClass {
  id: string;
  code: string;
  name: string;
  status: 'planned' | 'active' | 'finished';
  hsk_level: number | null;
  hsk_version: string | null;
  students: number;
  active_7d: number;
  mastered_avg: number | null;
  attempts_30d: number;
  avg_percent_30d: number | null;
  pass_rate_30d: number | null;
}

interface InactiveStudent {
  user_id: string;
  full_name: string;
  class_code: string;
  class_id: string;
  last_day: string | null;
}

interface RecentAttempt {
  id: string;
  submitted_at: string;
  score: number;
  total_score: number;
  passing_score: number | null;
  time_spent_secs: number | null;
  full_name: string;
  account_type: 'student' | 'guest';
  class_code: string | null;
  class_id: string | null;
  exam_title: string | null;
}

interface MemberGrant {
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  module: AccessModule;
  expires_at: string;
  last_day: string | null;
}

interface Dashboard {
  can_see_all: boolean;
  classes: DashboardClass[];
  inactive_students: InactiveStudent[];
  recent_attempts: RecentAttempt[];
  membership?: {
    active: number;
    active_by_module: Partial<Record<AccessModule, number>> | null;
    active_learning_7d: number;
    expiring: MemberGrant[];
    expired: MemberGrant[];
    new_signups_7d: number;
    guests: number;
  };
}

const CLASS_STATUS: Record<DashboardClass['status'], { label: string; tone: string }> = {
  active: { label: 'Đang học', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  planned: { label: 'Sắp khai giảng', tone: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
  finished: { label: 'Đã kết thúc', tone: 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300' },
};

/** /admin/dashboard — tổng quan: lớp phụ trách, bài thi gần đây; admin thêm phần thành viên Mayo+ */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, AppIconComponent, StatCardComponent],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {
  private readonly supabase = getSupabase();
  private readonly toast = inject(ToastService);

  protected readonly classStatus = CLASS_STATUS;
  protected readonly moduleLabels = ACCESS_MODULE_LABELS;
  protected readonly formatDate = formatDate;
  protected readonly formatDateTime = formatDateTime;

  readonly data = signal<Dashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  async load() {
    this.loading.set(true);
    const { data, error } = await this.supabase.rpc('staff_dashboard');
    this.loading.set(false);
    if (error) {
      this.error.set(error.message);
      return;
    }
    this.error.set(null);
    this.data.set(data as Dashboard);
  }

  percent(a: RecentAttempt): number {
    return a.total_score > 0 ? Math.round((Number(a.score) / Number(a.total_score)) * 100) : 0;
  }

  passed(a: RecentAttempt): boolean | null {
    return a.passing_score == null ? null : Number(a.score) >= Number(a.passing_score);
  }

  minutes(secs: number | null): string {
    return secs == null ? '' : `${Math.max(1, Math.round(secs / 60))} phút`;
  }

  /** "hôm nay", "3 ngày trước", "Chưa học" */
  lastStudied(day: string | null): string {
    if (!day) return 'Chưa học';
    const days = Math.round((Date.now() - new Date(`${day}T00:00:00`).getTime()) / 86_400_000);
    return days <= 0 ? 'hôm nay' : days === 1 ? 'hôm qua' : `${days} ngày trước`;
  }

  daysLeft(at: string): number {
    return Math.max(0, Math.ceil((Date.parse(at) - Date.now()) / 86_400_000));
  }

  /** Lời nhắc gia hạn để dán vào Zalo / Messenger */
  async copyReminder(g: MemberGrant, expired: boolean) {
    const module = ACCESS_MODULE_LABELS[g.module];
    const text = expired
      ? `Chào ${g.full_name}, quyền Mayo+ (${module}) của bạn đã hết hạn ngày ${formatDate(g.expires_at)}. Bạn liên hệ MCC để gia hạn và tiếp tục học nhé!`
      : `Chào ${g.full_name}, quyền Mayo+ (${module}) của bạn sẽ hết hạn ngày ${formatDate(g.expires_at)}. Bạn liên hệ MCC để gia hạn nhé!`;
    await navigator.clipboard.writeText(text);
    this.toast.success(`Đã chép lời nhắc cho ${g.full_name}.`);
  }
}
