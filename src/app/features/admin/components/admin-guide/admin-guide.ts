import { Component, ChangeDetectionStrategy, input, signal, OnInit } from '@angular/core';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';

/**
 * Khung "Hướng dẫn sử dụng" đóng/mở ở đầu trang quản trị nội dung. Lần đầu mở sẵn;
 * nhớ trạng thái đóng/mở theo từng trang trong trình duyệt.
 */
@Component({
  selector: 'app-admin-guide',
  standalone: true,
  imports: [AppIconComponent],
  templateUrl: './admin-guide.html',
  styleUrl: './admin-guide.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminGuideComponent implements OnInit {
  /** Khoá lưu trạng thái, VD: 'site' → mcc_guide_site */
  readonly storageKey = input.required<string>();
  readonly open = signal(true);

  ngOnInit(): void {
    try {
      this.open.set(localStorage.getItem(this.key()) !== 'closed');
    } catch {
      // Không đọc được localStorage: để mở
    }
  }

  onToggle(event: Event): void {
    const open = (event.target as HTMLDetailsElement).open;
    this.open.set(open);
    try {
      localStorage.setItem(this.key(), open ? 'open' : 'closed');
    } catch {
      // Bỏ qua: lần sau lại mở sẵn
    }
  }

  private key(): string {
    return `mcc_guide_${this.storageKey()}`;
  }
}
