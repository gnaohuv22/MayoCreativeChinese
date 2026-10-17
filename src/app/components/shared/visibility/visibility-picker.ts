import { Component, ChangeDetectionStrategy, ElementRef, input, output, viewChildren } from '@angular/core';
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
  private readonly optionButtons = viewChildren<ElementRef<HTMLButtonElement>>('option');

  /** Mũi tên chỉ di chuyển (mỗi lựa chọn lưu ngay), Enter / Space để chọn */
  protected onKeydown(event: KeyboardEvent, index: number) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const buttons = this.optionButtons();
    buttons[(index + step + buttons.length) % buttons.length].nativeElement.focus();
  }
  protected readonly activeClass: Record<ContentVisibility, string> = {
    private: 'bg-white dark:bg-white/20 text-zinc-700 dark:text-white shadow-xs',
    staff: 'bg-sky-700 text-white shadow-xs',
    students: 'bg-violet-600 text-white shadow-xs',
    paid: 'bg-amber-700 text-white shadow-xs',
    members: 'bg-teal-700 text-white shadow-xs',
    public: 'bg-emerald-700 text-white shadow-xs',
  };
}
