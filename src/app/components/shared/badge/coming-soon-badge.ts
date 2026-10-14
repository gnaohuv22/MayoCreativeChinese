import { Component, ChangeDetectionStrategy } from '@angular/core';

/** Nhãn "Sắp ra mắt" cho cấp độ / bộ chưa có nội dung (từ vựng, đề thi) */
@Component({
  selector: 'app-coming-soon-badge',
  standalone: true,
  templateUrl: './coming-soon-badge.html',
  styleUrl: './coming-soon-badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComingSoonBadgeComponent {}
