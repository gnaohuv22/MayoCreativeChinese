import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, type OauthProfileError } from '../../../../services/auth.service';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';

const ERRORS: Record<OauthProfileError, string> = {
  not_oauth: 'Phiên đăng nhập Google đã hết. Vui lòng đăng nhập lại.',
  has_profile: 'Tài khoản đã có hồ sơ.',
  missing_name: 'Vui lòng nhập họ tên.',
  invalid_phone: 'Số điện thoại chưa đúng (số di động Việt Nam, 10 chữ số).',
  phone_taken: 'Số điện thoại này đã có tài khoản khác. Hãy để trống hoặc dùng số khác.',
  no_consent: 'Vui lòng đồng ý để MCC lưu thông tin tài khoản.',
};

/** /hoan-tat-ho-so — lần đầu đăng nhập Google: họ tên, số điện thoại (không bắt buộc), đồng ý lưu thông tin */
@Component({
  selector: 'app-oauth-profile',
  standalone: true,
  imports: [FormsModule, RouterLink, NavHeaderComponent],
  templateUrl: './oauth-profile.html',
  styleUrl: './oauth-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OauthProfileComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly fullName = signal('');
  readonly phone = signal('');
  readonly consent = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.auth.ready.then(() => {
      if (this.auth.isLearner()) {
        this.router.navigateByUrl(this.returnUrl());
      } else if (!this.auth.needsOauthProfile()) {
        this.router.navigateByUrl('/dang-nhap');
      } else {
        this.fullName.set(this.auth.oauthName());
      }
    });
  }

  private returnUrl(): string {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url?.startsWith('/') && !url.startsWith('//') ? url : '/hoc-vien';
  }

  async submit() {
    if (this.submitting()) return;
    if (!this.fullName().trim()) {
      this.error.set(ERRORS.missing_name);
      return;
    }
    if (!this.consent()) {
      this.error.set(ERRORS.no_consent);
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    const res = await this.auth.completeOauthProfile({ fullName: this.fullName(), phone: this.phone(), consent: this.consent() });
    this.submitting.set(false);
    if (res.error) {
      this.error.set(ERRORS[res.error as OauthProfileError] ?? res.error);
      return;
    }
    await this.router.navigateByUrl(this.returnUrl());
  }

  async cancel() {
    await this.auth.signOut();
    await this.router.navigateByUrl('/dang-nhap');
  }
}
