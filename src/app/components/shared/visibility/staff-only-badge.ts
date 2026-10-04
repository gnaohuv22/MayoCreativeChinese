import { Component, ChangeDetectionStrategy } from '@angular/core';

/** Nhãn "Nội bộ" cho nhân sự thấy nội dung mà khách đang thấy là "Sắp ra mắt" */
@Component({
  selector: 'app-staff-only-badge',
  standalone: true,
  template: `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide whitespace-nowrap bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/25">Nội bộ</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffOnlyBadgeComponent {}
