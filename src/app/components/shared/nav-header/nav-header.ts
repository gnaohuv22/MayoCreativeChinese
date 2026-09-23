import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppIconComponent } from '../icon/app-icon';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-nav-header',
  standalone: true,
  imports: [CommonModule, RouterLink, AppIconComponent, ThemeToggleComponent],
  templateUrl: './nav-header.html',
  styleUrl: './nav-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavHeaderComponent {
  activeModule = input<'exams' | 'flashcards' | 'ops' | ''>('');
  pageTitle = input<string>('');
  backLink = input<string>('');
  backLabel = input<string>('');
  showBack = input<boolean>(false);
  showNavLinks = input<boolean>(true);
  showDevBadge = input<boolean>(false);
}
