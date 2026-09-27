import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppIconComponent, type IconName } from '../../../../components/shared/icon/app-icon';
import { StatCardComponent } from '../../../../components/shared/stat-card/stat-card';
import { AdminService, type ActivityEntry, type ActivityFilter, type ActivitySummary } from '../../services/admin.service';

type Tone = 'emerald' | 'sky' | 'red' | 'amber' | 'violet' | 'zinc';

const ACTIONS: Record<string, { label: string; tone: Tone }> = {
  create: { label: 'Tạo mới', tone: 'emerald' },
  update: { label: 'Sửa', tone: 'sky' },
  delete: { label: 'Xoá', tone: 'red' },
  publish: { label: 'Xuất bản', tone: 'emerald' },
  unpublish: { label: 'Chuyển nháp', tone: 'amber' },
  login: { label: 'Đăng nhập', tone: 'zinc' },
  password_change: { label: 'Đổi mật khẩu', tone: 'violet' },
  password_reset: { label: 'Đặt lại mật khẩu', tone: 'violet' },
  password_reset_failed: { label: 'Sai mật khẩu xác nhận', tone: 'red' },
};

const ENTITIES: Record<string, { label: string; icon: IconName }> = {
  exam: { label: 'Đề thi', icon: 'academic' },
  vocab: { label: 'Từ vựng', icon: 'book-open' },
  staff: { label: 'Nhân sự', icon: 'users' },
  auth: { label: 'Tài khoản', icon: 'cog' },
};

const FIELD_LABELS: Record<string, string> = {
  title: 'tên đề', description: 'mô tả', is_published: 'trạng thái xuất bản', hsk_level: 'cấp HSK', hsk_version: 'phiên bản',
  duration_mins: 'thời gian', total_score: 'điểm tối đa', passing_score: 'điểm đạt',
  hanzi: 'Hán tự', pinyin: 'pinyin', meaning: 'nghĩa', example: 'ví dụ', example_pinyin: 'pinyin ví dụ',
  example_meaning: 'nghĩa ví dụ', lesson_number: 'bài', lesson_title: 'tên bài', topic: 'chủ đề', collection: 'bộ từ vựng',
};

const TONE_CLASSES: Record<Tone, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  zinc: 'bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200',
};

const PAGE_SIZE = 30;
const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Mốc trục Y tròn: 1, 2, 5, 10, 20, 50… */
function niceMax(value: number) {
  if (value <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find(s => s * pow >= value) ?? 10;
  return step * pow;
}

@Component({
  selector: 'app-admin-activity',
  standalone: true,
  imports: [FormsModule, AppIconComponent, StatCardComponent],
  templateUrl: './admin-activity.html',
  styleUrl: './admin-activity.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminActivityComponent {
  private readonly admin = inject(AdminService);

  readonly actionOptions = Object.entries(ACTIONS).map(([value, meta]) => ({ value, label: meta.label }));
  readonly entityOptions = Object.entries(ENTITIES).map(([value, meta]) => ({ value, label: meta.label }));

  // Tổng quan
  readonly days = signal<7 | 30>(7);
  readonly summary = signal<ActivitySummary | null>(null);
  readonly actorOptions = computed(() => (this.summary()?.by_actor ?? []).map(a => a.username));

  readonly chart = computed(() => {
    const byDay = this.summary()?.by_day ?? [];
    const max = niceMax(Math.max(0, ...byDay.map(d => d.count)));
    const peak = Math.max(0, ...byDay.map(d => d.count));
    const labelEvery = byDay.length > 10 ? 5 : 1;
    return {
      max,
      ticks: [max, max / 2, 0],
      bars: byDay.map((d, i) => {
        const date = new Date(`${d.day}T00:00:00`);
        const dm = `${date.getDate()}/${date.getMonth() + 1}`;
        return {
          ...d,
          height: max ? (d.count / max) * 100 : 0,
          axisLabel: i % labelEvery === 0 || i === byDay.length - 1 ? dm : '',
          fullLabel: `${WEEKDAYS[date.getDay()]} ${dm}`,
          isPeak: d.count > 0 && d.count === peak,
        };
      }),
    };
  });

  readonly topActors = computed(() => {
    const list = (this.summary()?.by_actor ?? []).slice(0, 6);
    const max = Math.max(1, ...list.map(a => a.count));
    return list.map(a => ({ ...a, width: (a.count / max) * 100 }));
  });

  // Nhật ký
  filter: ActivityFilter = {};
  readonly page = signal(1);
  readonly entries = signal<ActivityEntry[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly expanded = signal<Set<number>>(new Set());
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / PAGE_SIZE)));

  readonly groups = computed(() => {
    const today = dayKey(new Date().toISOString());
    const yesterday = dayKey(new Date(Date.now() - 86_400_000).toISOString());
    const groups: { key: string; label: string; entries: ActivityEntry[] }[] = [];
    for (const entry of this.entries()) {
      const key = dayKey(entry.created_at);
      let group = groups.at(-1);
      if (!group || group.key !== key) {
        const d = new Date(entry.created_at);
        const label = key === today ? 'Hôm nay' : key === yesterday ? 'Hôm qua'
          : `${WEEKDAYS[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        group = { key, label, entries: [] };
        groups.push(group);
      }
      group.entries.push(entry);
    }
    return groups;
  });

  private searchTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.loadSummary();
    this.loadEntries();
  }

  async loadSummary() {
    this.summary.set(await this.admin.activitySummary(this.days()));
  }

  setDays(days: 7 | 30) {
    this.days.set(days);
    this.loadSummary();
  }

  async loadEntries() {
    this.loading.set(true);
    const res = await this.admin.listActivity(this.filter, this.page(), PAGE_SIZE);
    this.entries.set(res.data);
    this.total.set(res.total);
    this.error.set(res.error ?? null);
    this.loading.set(false);
  }

  applyFilter() {
    this.page.set(1);
    this.expanded.set(new Set());
    this.loadEntries();
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.applyFilter(), 300);
  }

  resetFilter() {
    this.filter = {};
    this.applyFilter();
  }

  refresh() {
    this.loadSummary();
    this.loadEntries();
  }

  goToPage(page: number) {
    this.page.set(Math.min(Math.max(1, page), this.totalPages()));
    this.expanded.set(new Set());
    this.loadEntries();
  }

  toggle(id: number) {
    const next = new Set(this.expanded());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.expanded.set(next);
  }

  actionLabel(action: string) {
    return ACTIONS[action]?.label ?? action;
  }

  actionClass(action: string) {
    return TONE_CLASSES[ACTIONS[action]?.tone ?? 'zinc'];
  }

  entity(type: string) {
    return ENTITIES[type] ?? { label: type, icon: 'document-text' as IconName };
  }

  time(iso: string) {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  hasItems(entry: ActivityEntry) {
    return (entry.details.items?.length ?? 0) > 0;
  }

  itemLabel(item: Record<string, unknown>) {
    if (item['title']) return String(item['title']);
    if (item['hanzi']) {
      const meta = [item['collection'], item['hsk_level'] != null ? `cấp ${item['hsk_level']}` : null].filter(Boolean).join(' ');
      return `${item['hanzi']} — ${item['meaning'] ?? ''}${meta ? ` (${meta})` : ''}`;
    }
    return String(item['id'] ?? '');
  }

  itemChanges(item: Record<string, unknown>) {
    const changed = item['changed'];
    if (!Array.isArray(changed) || changed.length === 0) return '';
    return changed.map(c => FIELD_LABELS[c] ?? c).join(', ');
  }

  initial(username: string | null) {
    return (username?.[0] ?? '•').toUpperCase();
  }
}
