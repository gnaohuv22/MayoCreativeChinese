import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { VISIBILITY_OPTIONS, type ContentVisibility } from './content-visibility';

/** Chọn 1 trong 6 mức hiển thị: Bản nháp · Nội bộ · Học viên · Trả phí · Thành viên · Công khai */
@Component({
  selector: 'app-visibility-picker',
  standalone: true,
  templateUrl: './visibility-picker.html',
  styleUrl: './visibility-picker.css',
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
    students: 'bg-violet-500 text-white shadow-xs',
    paid: 'bg-amber-500 text-white shadow-xs',
    members: 'bg-teal-600 text-white shadow-xs',
    public: 'bg-emerald-500 text-white shadow-xs',
  };
}
