import { Component, ChangeDetectionStrategy, computed, effect, inject } from '@angular/core';
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
    { label: 'Tổng quan', hint: 'Lớp học, bài thi, Mayo+', route: '/admin/dashboard', icon: 'home' },
    { label: 'Đề thi HSK', hint: 'Soạn, xuất bản, nhân bản đề', route: '/admin/exams', icon: 'academic' },
    { label: 'Từ vựng', hint: 'Thêm, nhập Excel, chỉnh sửa', route: '/admin/vocab', icon: 'book-open' },
  ];

  private readonly siteItem: AdminNavItem = { label: 'Trang chủ', hint: 'Giáo viên, khóa học, ảnh', route: '/admin/site', icon: 'sparkles', permission: 'site.manage' };
  private readonly storiesItem: AdminNavItem = { label: 'Câu chuyện', hint: 'Bài viết học viên', route: '/admin/stories', icon: 'document-text', permission: 'site.manage' };
  readonly visibleNavItems = computed(() => [...this.navItems, ...(this.auth.can('site.manage') ? [this.siteItem, this.storiesItem] : [])]);

  private readonly classItems: AdminNavItem[] = [
    { label: 'Lớp học', hint: 'Thông báo, gợi ý, kết quả', route: '/admin/classes', icon: 'calendar', permission: 'class.manage' },
    { label: 'Học viên', hint: 'Tài khoản, chuyển lớp', route: '/admin/students', icon: 'users', permission: 'student.manage' },
  ];
  readonly visibleClassItems = computed(() => this.classItems.filter(i => !i.permission || this.auth.can(i.permission)));

  private readonly manageItems: AdminNavItem[] = [
    { label: 'Nhân sự', hint: 'Tài khoản, đặt lại mật khẩu', route: '/admin/staff', icon: 'users', permission: 'staff.manage' },
    { label: 'Vai trò & quyền', hint: 'Vai trò, quyền của nhân sự', route: '/admin/roles', icon: 'cog', permission: 'role.manage' },
    { label: 'Nhật ký hoạt động', hint: 'Ai đã làm gì, khi nào', route: '/admin/activity', icon: 'clock', permission: 'activity.read' },
  ];
  readonly visibleManageItems = computed(() => this.manageItems.filter(i => !i.permission || this.auth.can(i.permission)));

  readonly accountItem: AdminNavItem = { label: 'Hồ sơ của tôi', hint: 'Họ tên, đổi mật khẩu', route: '/admin/profile', icon: 'users' };
  readonly mobileTabs = computed<AdminNavItem[]>(() => [
    ...this.visibleNavItems(),
    ...this.visibleClassItems(),
    ...this.visibleManageItems().map(i => ({ ...i, label: i.route === '/admin/activity' ? 'Nhật ký' : i.route === '/admin/roles' ? 'Vai trò' : i.label })),
    { ...this.accountItem, label: 'Hồ sơ' },
  ]);

  readonly initial = computed(() => (this.auth.username()[0] ?? '?').toUpperCase());

  constructor() {
    // Mất phiên giữa chừng → về trang đăng nhập rồi quay lại đúng trang, thay vì để ghi dữ liệu thất bại
    effect(() => {
      if (!this.auth.sessionLost()) return;
      this.router.navigate(['/admin/login'], { queryParams: { returnUrl: this.router.url, reason: 'expired' } });
    });
  }

  async signOut() {
    await this.auth.signOut();
    await this.router.navigateByUrl('/admin/login');
  }
}
