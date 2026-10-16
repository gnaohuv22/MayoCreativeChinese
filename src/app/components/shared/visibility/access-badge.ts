import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';

/** Nhãn nội dung khoá theo tài khoản: "Học viên" (lớp MCC), "Thành viên" (cần đăng nhập), "Trả phí" (cần cấp quyền) */
@Component({
  selector: 'app-access-badge',
  standalone: true,
  templateUrl: './access-badge.html',
  styleUrl: './access-badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessBadgeComponent {
  kind = input<'members' | 'login' | 'paid'>('members');

  protected readonly meta = computed(() => ({
    members: { label: 'Học viên', tone: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25' },
    login: { label: 'Thành viên', tone: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25' },
    paid: { label: 'Trả phí', tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25' },
  })[this.kind()]);
}
