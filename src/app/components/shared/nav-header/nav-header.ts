import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppIconComponent } from '../icon/app-icon';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle';
import { AdminPresence } from '../../../services/admin-presence';

@Component({
  selector: 'app-nav-header',
  standalone: true,
  imports: [CommonModule, RouterLink, AppIconComponent, ThemeToggleComponent],
  templateUrl: './nav-header.html',
  styleUrl: './nav-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavHeaderComponent {
  activeModule = input<'exams' | 'flashcards' | ''>('');
  pageTitle = input<string>('');
  backLink = input<string>('');
  backLabel = input<string>('');
  showBack = input<boolean>(false);
  showNavLinks = input<boolean>(true);
  showDevBadge = input<boolean>(false);

  /** Học viên / nhân sự đang đăng nhập (cờ nhẹ, không kéo supabase-js vào bundle) */
  protected readonly presence = inject(AdminPresence);
}
