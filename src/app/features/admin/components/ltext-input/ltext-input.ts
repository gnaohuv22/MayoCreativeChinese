import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import type { Lang, LocalizedText } from '../../../../services/i18n.service';

let nextId = 0;

/**
 * Ô nhập chữ nhiều ngôn ngữ: sửa trực tiếp value[lang] trên bản nháp của trang cha.
 * Ngôn ngữ khác tiếng Việt để trống thì trang chủ hiện tiếng Việt (placeholder).
 */
@Component({
  selector: 'app-ltext-input',
  standalone: true,
  templateUrl: './ltext-input.html',
  styleUrl: './ltext-input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LtextInputComponent {
  readonly value = input.required<LocalizedText>();
  readonly lang = input.required<Lang>();
  readonly label = input('');
  /** Tên cho trình đọc màn hình khi ô không có nhãn hiển thị */
  readonly ariaLabel = input('');
  readonly multiline = input(false);
  readonly rows = input(3);
  readonly maxlength = input(2000);

  readonly fieldId = `ltext-${nextId++}`;

  update(event: Event): void {
    const text = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    const value = this.value();
    if (text) value[this.lang()] = text;
    else delete value[this.lang()];
  }
}
