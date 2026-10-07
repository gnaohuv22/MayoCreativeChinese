import { Component, ChangeDetectionStrategy } from '@angular/core';

/** Nhãn "Học viên" cho khách thấy nội dung chỉ dành cho học viên MCC đã đăng nhập */
@Component({
  selector: 'app-members-only-badge',
  standalone: true,
  template: `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide whitespace-nowrap bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/25">Học viên</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembersOnlyBadgeComponent {}
