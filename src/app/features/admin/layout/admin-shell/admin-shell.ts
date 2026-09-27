import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService, STAFF_ROLE_LABELS } from '../../../../services/auth.service';
import { AppIconComponent, type IconName } from '../../../../components/shared/icon/app-icon';
import { ThemeToggleComponent } from '../../../../components/shared/theme-toggle/theme-toggle';

interface AdminNavItem {
  label: string;
  hint: string;
  route: string;
  icon: IconName;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AppIconComponent, ThemeToggleComponent],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly navItems: AdminNavItem[] = [
    { label: 'Đề thi HSK', hint: 'Soạn, xuất bản, nhân bản đề', route: '/admin/exams', icon: 'academic' },
    { label: 'Từ vựng', hint: 'Thêm, nhập Excel, chỉnh sửa', route: '/admin/vocab', icon: 'book-open' },
  ];

  readonly accountItem: AdminNavItem = { label: 'Hồ sơ của tôi', hint: 'Họ tên, đổi mật khẩu', route: '/admin/profile', icon: 'users' };
  readonly mobileTabs: AdminNavItem[] = [...this.navItems, { ...this.accountItem, label: 'Hồ sơ' }];

  readonly initial = computed(() => (this.auth.username()[0] ?? '?').toUpperCase());
  readonly roleLabel = computed(() => {
    const role = this.auth.role();
    return role ? STAFF_ROLE_LABELS[role].label : '';
  });

  async signOut() {
    await this.auth.signOut();
    await this.router.navigateByUrl('/admin/login');
  }
}
