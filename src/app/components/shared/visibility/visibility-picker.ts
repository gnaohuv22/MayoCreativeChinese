import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { VISIBILITY_OPTIONS, type ContentVisibility } from './content-visibility';

/** Chọn 1 trong 3 mức hiển thị: Bản nháp · Nội bộ · Công khai */
@Component({
  selector: 'app-visibility-picker',
  standalone: true,
  template: `
    <div class="inline-flex p-0.5 rounded-full bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/10"
         role="radiogroup" [attr.aria-label]="label()">
      @for (opt of options; track opt.value) {
        <button type="button" role="radio"
                [attr.aria-checked]="value() === opt.value"
                [disabled]="disabled()"
                (click)="value() !== opt.value && changed.emit(opt.value)"
                class="px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-60"
                [class]="value() === opt.value ? activeClass[opt.value] : 'text-zinc-600 dark:text-zinc-300 hover:text-brand-navy dark:hover:text-white'">
          {{ opt.label }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisibilityPickerComponent {
  value = input.required<ContentVisibility>();
  disabled = input<boolean>(false);
  label = input<string>('Trạng thái hiển thị');
  changed = output<ContentVisibility>();

  protected readonly options = VISIBILITY_OPTIONS;
  protected readonly activeClass: Record<ContentVisibility, string> = {
    private: 'bg-white dark:bg-white/20 text-zinc-700 dark:text-white shadow-xs',
    staff: 'bg-sky-500 text-white shadow-xs',
    public: 'bg-emerald-500 text-white shadow-xs',
  };
}
