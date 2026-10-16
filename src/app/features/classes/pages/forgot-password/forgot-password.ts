import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';

/** /quen-mat-khau — gửi thư khôi phục tới email của khách (học viên lớp nhờ giáo viên đặt lại) */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink, NavHeaderComponent],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);

  readonly email = signal('');
  readonly submitting = signal(false);
  readonly sentTo = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  async submit() {
    const email = this.email().trim();
    if (this.submitting()) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      this.error.set('Email chưa đúng định dạng.');
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    const res = await this.auth.requestPasswordReset(email);
    this.submitting.set(false);
    if (res.error === 'rate_limited') {
      this.error.set('Vừa gửi thư cho email này. Vui lòng đợi 1 phút rồi thử lại.');
      return;
    }
    this.sentTo.set(email);
  }
}
