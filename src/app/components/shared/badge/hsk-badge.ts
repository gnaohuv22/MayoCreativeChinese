import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { HskVersion } from '../../../features/exams/models/exam.model';

@Component({
  selector: 'app-hsk-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hsk-badge.html',
  styleUrl: './hsk-badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HskBadgeComponent {
  level = input.required<number>();
  version = input<HskVersion>('2.0');
  showVersion = input<boolean>(true);
}
