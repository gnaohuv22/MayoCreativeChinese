import { Component, ChangeDetectionStrategy } from '@angular/core';

/** Nhãn "Nội bộ" cho nhân sự thấy nội dung mà khách đang thấy là "Sắp ra mắt" */
@Component({
  selector: 'app-staff-only-badge',
  standalone: true,
  templateUrl: './staff-only-badge.html',
  styleUrl: './staff-only-badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffOnlyBadgeComponent {}
