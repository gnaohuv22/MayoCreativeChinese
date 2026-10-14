import { Component, ChangeDetectionStrategy } from '@angular/core';

/** Nhãn "Học viên" cho khách thấy nội dung chỉ dành cho học viên MCC đã đăng nhập */
@Component({
  selector: 'app-members-only-badge',
  standalone: true,
  templateUrl: './members-only-badge.html',
  styleUrl: './members-only-badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembersOnlyBadgeComponent {}
