import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import type { LearnerDevice } from '../../../../services/auth.service';
import { formatDateTime } from '../../utils/class-display.util';

/** Danh sách thiết bị đăng nhập của 1 học viên, có nút gỡ (trang /thiet-bi, /hoc-vien, khu quản trị) */
@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [AppIconComponent],
  templateUrl: './device-list.html',
  styleUrl: './device-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceListComponent {
  devices = input.required<LearnerDevice[]>();
  /** false = ẩn / khoá nút gỡ (hết lượt tự gỡ trong 30 ngày) */
  canRemove = input(true);
  /** Thiết bị đang được gỡ */
  removing = input<string | null>(null);
  remove = output<LearnerDevice>();

  protected readonly formatDateTime = formatDateTime;
}
