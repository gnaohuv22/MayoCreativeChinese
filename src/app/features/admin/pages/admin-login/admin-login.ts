import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';

/** Đối tượng đăng nhập — đặt qua route data `audience` (mặc định nhân sự) */
type LoginAudience = 'staff' | 'student';

const AUDIENCE_TEXT: Record<LoginAudience, { pageTitle: string; badge: string; intro: string; home: string }> = {
  staff: {
    pageTitle: 'Đăng nhập quản trị',
    badge: 'Admin & Ops',
    intro: 'Chỉ dành cho quản trị viên quản lý đề thi và từ vựng.',
    home: '/admin/exams',
  },
  student: {
    pageTitle: 'Đăng nhập học viên',
    badge: 'Học viên MCC',
    intro: 'Dùng tài khoản giáo viên đã cấp cho lớp của bạn.',
    home: '/hoc-vien',
  },
};

/** Trang đăng nhập dùng chung: /admin/login (nhân sự) và /dang-nhap (học viên) */
@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, NavHeaderComponent],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly audience: LoginAudience = this.route.snapshot.data['audience'] === 'student' ? 'student' : 'staff';
  readonly text = AUDIENCE_TEXT[this.audience];

  username = '';
  password = '';
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  constructor() {
    if (this.route.snapshot.queryParamMap.get('reason') === 'expired') {
      this.error.set('Phiên đăng nhập đã hết. Vui lòng đăng nhập lại để tiếp tục.');
    }
    this.auth.ready.then(() => {
      if (this.signedIn()) this.router.navigateByUrl(this.returnUrl());
    });
  }

  private signedIn(): boolean {
    return this.audience === 'student' ? this.auth.isStudent() : this.auth.isStaff();
  }

  /** Chỉ cho phép quay lại đường dẫn nội bộ */
  private returnUrl(): string {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url?.startsWith('/') && !url.startsWith('//') ? url : this.text.home;
  }

  async submit() {
    if (!this.username.trim() || !this.password) return;
    this.isSubmitting.set(true);
    this.error.set(null);
    const res = this.audience === 'student'
      ? await this.auth.signInStudent(this.username, this.password)
      : await this.auth.signIn(this.username, this.password);
    this.isSubmitting.set(false);
    if (res.error) {
      this.error.set(res.error === 'Invalid login credentials' ? 'Tài khoản hoặc mật khẩu không đúng.' : res.error);
      return;
    }
    await this.router.navigateByUrl(this.returnUrl());
  }
}
