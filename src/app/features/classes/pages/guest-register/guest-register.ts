import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, STUDENT_PASSWORD_RULES, normalizeVnPhone, type GuestRegisterError } from '../../../../services/auth.service';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';

const ERRORS: Record<GuestRegisterError, string> = {
  invalid_phone: 'Số điện thoại chưa đúng (số di động Việt Nam, 10 chữ số).',
  missing_name: 'Vui lòng nhập họ tên.',
  weak_password: 'Mật khẩu chưa đáp ứng đủ yêu cầu.',
  no_consent: 'Vui lòng đồng ý để MCC lưu thông tin tài khoản.',
  phone_taken: 'Số điện thoại này đã có tài khoản. Hãy đăng nhập, hoặc liên hệ MCC nếu quên mật khẩu.',
  rate_limited: 'Có quá nhiều lượt đăng ký từ mạng này. Vui lòng thử lại sau ít phút.',
};

/** /dang-ky — khách tự tạo tài khoản bằng số điện thoại (migration 021) */
@Component({
  selector: 'app-guest-register',
  standalone: true,
  imports: [FormsModule, RouterLink, NavHeaderComponent, AppIconComponent],
  templateUrl: './guest-register.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestRegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly fullName = signal('');
  readonly phone = signal('');
  readonly password = signal('');
  readonly showPassword = signal(false);
  readonly consent = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly rules = computed(() => STUDENT_PASSWORD_RULES.map(rule => ({ label: rule.label, ok: rule.test(this.password()) })));
  readonly phoneValid = computed(() => normalizeVnPhone(this.phone()) !== null);
  /** Giữ returnUrl khi chuyển qua lại giữa đăng ký và đăng nhập */
  readonly returnQuery = computed(() => {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url ? { returnUrl: url } : {};
  });

  constructor() {
    this.auth.ready.then(() => {
      if (this.auth.isLearner()) this.router.navigateByUrl(this.returnUrl());
    });
  }

  private returnUrl(): string {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url?.startsWith('/') && !url.startsWith('//') ? url : '/hoc-vien';
  }

  async submit() {
    if (this.submitting()) return;
    const problem: GuestRegisterError | null =
      !this.fullName().trim() ? 'missing_name'
      : !this.phoneValid() ? 'invalid_phone'
      : !this.rules().every(r => r.ok) ? 'weak_password'
      : !this.consent() ? 'no_consent'
      : null;
    if (problem) {
      this.error.set(ERRORS[problem]);
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    const res = await this.auth.registerGuest({
      phone: this.phone(),
      password: this.password(),
      fullName: this.fullName(),
      consent: this.consent(),
    });
    this.submitting.set(false);
    if (res.error) {
      this.error.set(ERRORS[res.error as GuestRegisterError] ?? res.error);
      return;
    }
    await this.router.navigateByUrl(this.returnUrl());
  }
}
