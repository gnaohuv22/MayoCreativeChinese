import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';

const ERRORS: Record<string, string> = {
  invalid_email: 'Email chưa đúng định dạng.',
  email_taken: 'Email này đã dùng cho tài khoản khác.',
  rate_limited: 'Vừa gửi thư. Vui lòng đợi 1 phút rồi thử lại.',
};

/**
 * Khách đăng ký trước khi có email (email đăng nhập nội bộ): thêm email để khôi phục mật khẩu.
 * Supabase gửi thư xác nhận; xác nhận xong email này thành email đăng nhập (số điện thoại vẫn đăng nhập được).
 */
@Component({
  selector: 'app-recovery-email',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './recovery-email.html',
  styleUrl: './recovery-email.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoveryEmailComponent {
  private readonly auth = inject(AuthService);

  readonly email = signal('');
  readonly submitting = signal(false);
  readonly sentTo = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  async submit() {
    const email = this.email().trim();
    if (this.submitting()) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      this.error.set(ERRORS['invalid_email']);
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    const res = await this.auth.addRecoveryEmail(email);
    this.submitting.set(false);
    if (res.error) {
      this.error.set(ERRORS[res.error] ?? res.error);
      return;
    }
    this.sentTo.set(email);
  }
}
