import { Component, ChangeDetectionStrategy } from '@angular/core';

/** Nhãn "Sắp ra mắt" cho cấp độ / bộ chưa có nội dung (từ vựng, đề thi) */
@Component({
  selector: 'app-coming-soon-badge',
  standalone: true,
  template: `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide whitespace-nowrap bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25">Sắp ra mắt</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComingSoonBadgeComponent {}
