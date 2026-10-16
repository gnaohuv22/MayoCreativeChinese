import { Component, ChangeDetectionStrategy, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, STUDENT_PASSWORD_RULES, normalizeVnPhone, type GuestRegisterError } from '../../../../services/auth.service';
import { GoogleButtonComponent } from '../../../../components/shared/google-button/google-button';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { TurnstileComponent, turnstileEnabled } from '../../../../components/shared/turnstile/turnstile';

const ERRORS: Record<GuestRegisterError, string> = {
  invalid_email: 'Email chưa đúng định dạng.',
  email_taken: 'Email này đã có tài khoản. Hãy đăng nhập, hoặc dùng "Quên mật khẩu" nếu không nhớ mật khẩu.',
  invalid_phone: 'Số điện thoại chưa đúng (số di động Việt Nam, 10 chữ số).',
  missing_name: 'Vui lòng nhập họ tên.',
  weak_password: 'Mật khẩu chưa đáp ứng đủ yêu cầu.',
  no_consent: 'Vui lòng đồng ý để MCC lưu thông tin tài khoản.',
  phone_taken: 'Số điện thoại này đã có tài khoản. Hãy đăng nhập, hoặc liên hệ MCC nếu quên mật khẩu.',
  rate_limited: 'Có quá nhiều lượt đăng ký từ mạng này. Vui lòng thử lại sau ít phút.',
  captcha_required: 'Vui lòng chờ bước xác minh bên dưới hoàn tất.',
  captcha_failed: 'Xác minh không thành công. Vui lòng thử lại.',
};

/** /dang-ky — khách tự tạo tài khoản: email (xác nhận qua thư) + số điện thoại, hoặc Google (migration 022) */
@Component({
  selector: 'app-guest-register',
  standalone: true,
  imports: [FormsModule, RouterLink, NavHeaderComponent, AppIconComponent, TurnstileComponent, GoogleButtonComponent],
  templateUrl: './guest-register.html',
  styleUrl: './guest-register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestRegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly fullName = signal('');
  readonly email = signal('');
  readonly phone = signal('');
  readonly password = signal('');
  readonly showPassword = signal(false);
  readonly consent = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly turnstileToken = signal<string | null>(null);
  /** Email đã đăng ký, chờ xác nhận qua thư */
  readonly sentTo = signal<string | null>(null);
  readonly resendState = signal<'idle' | 'sending' | 'sent' | 'error'>('idle');
  private readonly turnstile = viewChild(TurnstileComponent);

  readonly rules = computed(() => STUDENT_PASSWORD_RULES.map(rule => ({ label: rule.label, ok: rule.test(this.password()) })));
  readonly phoneValid = computed(() => normalizeVnPhone(this.phone()) !== null);
  readonly emailValid = computed(() => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.email().trim()));
  /** Trang muốn quay về sau khi đăng nhập (truyền cho nút Google) */
  readonly returnUrlParam = this.route.snapshot.queryParamMap.get('returnUrl') ?? undefined;
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
      : !this.emailValid() ? 'invalid_email'
      : !this.phoneValid() ? 'invalid_phone'
      : !this.rules().every(r => r.ok) ? 'weak_password'
      : !this.consent() ? 'no_consent'
      : turnstileEnabled() && !this.turnstileToken() ? 'captcha_required'
      : null;
    if (problem) {
      this.error.set(ERRORS[problem]);
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    const res = await this.auth.registerGuest({
      email: this.email(),
      phone: this.phone(),
      password: this.password(),
      fullName: this.fullName(),
      consent: this.consent(),
      turnstileToken: this.turnstileToken(),
    });
    // Token đã dùng — lấy token mới cho lần gửi lại
    this.turnstile()?.reset();
    this.submitting.set(false);
    if (res.error) {
      this.error.set(ERRORS[res.error as GuestRegisterError] ?? res.error);
      return;
    }
    this.sentTo.set(res.email ?? this.email().trim());
  }

  async resend() {
    const email = this.sentTo();
    if (!email || this.resendState() === 'sending') return;
    this.resendState.set('sending');
    const res = await this.auth.resendConfirmation(email);
    this.resendState.set(res.error ? 'error' : 'sent');
  }
}
