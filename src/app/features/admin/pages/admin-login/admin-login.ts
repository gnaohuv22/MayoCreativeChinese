import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, EMAIL_NOT_CONFIRMED, LOGIN_RATE_LIMITED } from '../../../../services/auth.service';
import { GoogleButtonComponent } from '../../../../components/shared/google-button/google-button';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';

/** Đối tượng đăng nhập — đặt qua route data `audience` (mặc định nhân sự) */
type LoginAudience = 'staff' | 'student';

const AUDIENCE_TEXT: Record<LoginAudience, { pageTitle: string; badge: string; intro: string; account: string; home: string }> = {
  staff: {
    pageTitle: 'Đăng nhập quản trị',
    badge: 'Admin & Ops',
    intro: 'Chỉ dành cho quản trị viên quản lý đề thi và từ vựng.',
    account: 'Tài khoản',
    home: '/admin/exams',
  },
  student: {
    pageTitle: 'Đăng nhập',
    badge: 'Học viên MCC',
    intro: 'Học viên dùng tài khoản giáo viên cấp; khách dùng email hoặc số điện thoại đã đăng ký.',
    account: 'Email, số điện thoại hoặc tên đăng nhập',
    home: '/hoc-vien',
  },
};

/** Trang đăng nhập dùng chung: /admin/login (nhân sự) và /dang-nhap (học viên) */
@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, RouterLink, NavHeaderComponent, GoogleButtonComponent],
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
  /** Email chưa xác nhận — hiện nút gửi lại thư */
  unconfirmedEmail = signal<string | null>(null);
  resendState = signal<'idle' | 'sending' | 'sent' | 'error'>('idle');
  /** returnUrl thô, truyền cho nút Google */
  readonly returnUrlParam = this.route.snapshot.queryParamMap.get('returnUrl') ?? undefined;

  constructor() {
    if (this.route.snapshot.queryParamMap.get('reason') === 'expired') {
      this.error.set('Phiên đăng nhập đã hết. Vui lòng đăng nhập lại để tiếp tục.');
    }
    // Quay lại từ Google / link xác nhận email: phiên đã có sẵn khi auth.ready xong
    this.auth.ready.then(() => {
      if (this.audience === 'student' && this.auth.needsOauthProfile()) {
        this.router.navigate(['/hoan-tat-ho-so'], { queryParams: this.returnQuery });
      } else if (this.signedIn()) {
        this.router.navigateByUrl(this.returnUrl());
      }
    });
  }

  private signedIn(): boolean {
    return this.audience === 'student' ? this.auth.isLearner() : this.auth.isStaff();
  }

  /** Chỉ cho phép quay lại đường dẫn nội bộ */
  /** Giữ returnUrl khi chuyển sang trang đăng ký */
  readonly returnQuery = (() => {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url ? { returnUrl: url } : {};
  })();

  private returnUrl(): string {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url?.startsWith('/') && !url.startsWith('//') ? url : this.text.home;
  }

  async submit() {
    if (!this.username.trim() || !this.password) return;
    this.isSubmitting.set(true);
    this.error.set(null);
    this.unconfirmedEmail.set(null);
    this.resendState.set('idle');
    const res: { error?: string; email?: string } = this.audience === 'student'
      ? await this.auth.signInStudent(this.username, this.password)
      : await this.auth.signIn(this.username, this.password);
    this.isSubmitting.set(false);
    if (res.error === EMAIL_NOT_CONFIRMED && res.email) {
      this.unconfirmedEmail.set(res.email);
      this.error.set('Email chưa được xác nhận. Bấm link trong thư MCC đã gửi, hoặc gửi lại thư bên dưới.');
      return;
    }
    if (res.error) {
      this.error.set(
        res.error === 'Invalid login credentials' ? 'Tài khoản hoặc mật khẩu không đúng.'
        : res.error === LOGIN_RATE_LIMITED ? 'Nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.'
        : res.error,
      );
      return;
    }
    await this.router.navigateByUrl(this.returnUrl());
  }

  async resendConfirmation() {
    const email = this.unconfirmedEmail();
    if (!email || this.resendState() === 'sending') return;
    this.resendState.set('sending');
    const res = await this.auth.resendConfirmation(email);
    this.resendState.set(res.error ? 'error' : 'sent');
  }
}
