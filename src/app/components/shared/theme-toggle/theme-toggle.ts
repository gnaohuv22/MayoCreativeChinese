import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../services/theme.service';
import { AppIconComponent } from '../icon/app-icon';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
  customClass = input<string>('');
}
