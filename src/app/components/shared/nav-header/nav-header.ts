import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
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

  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  async signOut() {
    await this.auth.signOut();
    await this.router.navigateByUrl('/admin/login');
  }
}
