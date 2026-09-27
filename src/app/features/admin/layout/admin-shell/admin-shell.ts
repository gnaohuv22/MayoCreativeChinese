import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService, type Permission } from '../../../../services/auth.service';
import { AppIconComponent, type IconName } from '../../../../components/shared/icon/app-icon';
import { ThemeToggleComponent } from '../../../../components/shared/theme-toggle/theme-toggle';

interface AdminNavItem {
  label: string;
  hint: string;
  route: string;
  icon: IconName;
  /** Chỉ hiện khi vai trò có quyền này */
  permission?: Permission;
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

  private readonly manageItems: AdminNavItem[] = [
    { label: 'Nhân sự', hint: 'Tài khoản, đặt lại mật khẩu', route: '/admin/staff', icon: 'users', permission: 'staff.manage' },
    { label: 'Nhật ký hoạt động', hint: 'Ai đã làm gì, khi nào', route: '/admin/activity', icon: 'clock', permission: 'activity.read' },
  ];
  readonly visibleManageItems = computed(() => this.manageItems.filter(i => !i.permission || this.auth.can(i.permission)));

  readonly accountItem: AdminNavItem = { label: 'Hồ sơ của tôi', hint: 'Họ tên, đổi mật khẩu', route: '/admin/profile', icon: 'users' };
  readonly mobileTabs = computed<AdminNavItem[]>(() => [
    ...this.navItems,
    ...this.visibleManageItems().map(i => ({ ...i, label: i.route === '/admin/activity' ? 'Nhật ký' : i.label })),
    { ...this.accountItem, label: 'Hồ sơ' },
  ]);

  readonly initial = computed(() => (this.auth.username()[0] ?? '?').toUpperCase());

  async signOut() {
    await this.auth.signOut();
    await this.router.navigateByUrl('/admin/login');
  }
}
