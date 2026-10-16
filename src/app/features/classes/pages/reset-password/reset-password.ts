import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, STUDENT_PASSWORD_RULES, type ResetPasswordError } from '../../../../services/auth.service';
import { ToastService } from '../../../../services/toast.service';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';

const ERRORS: Record<ResetPasswordError, string> = {
  not_recovery: 'Link đặt lại mật khẩu đã hết hạn hoặc đã dùng. Vui lòng yêu cầu link mới.',
  not_student: 'Tài khoản này không đặt lại mật khẩu ở đây được. Vui lòng liên hệ MCC.',
  weak_password: 'Mật khẩu mới chưa đáp ứng đủ yêu cầu.',
};

/** /dat-lai-mat-khau — mở từ link trong thư khôi phục (phiên đăng nhập có amr = recovery) */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink, NavHeaderComponent, AppIconComponent],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly ready = signal(false);
  /** Không có phiên khôi phục: link hỏng / hết hạn, hoặc mở trang trực tiếp */
  readonly linkInvalid = signal(false);
  readonly next = signal('');
  readonly confirm = signal('');
  readonly show = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly rules = computed(() => STUDENT_PASSWORD_RULES.map(r => ({ label: r.label, ok: r.test(this.next()) })));
  readonly mismatch = computed(() => this.confirm().length > 0 && this.confirm() !== this.next());
  readonly canSubmit = computed(() =>
    !this.submitting() && this.rules().every(r => r.ok) && this.confirm() === this.next());

  constructor() {
    // Supabase báo lỗi link (hết hạn, đã dùng) trong phần # của URL
    const linkError = new URLSearchParams(location.hash.slice(1)).get('error_code');
    this.auth.ready.then(() => {
      this.linkInvalid.set(!!linkError || !this.auth.userId());
      this.ready.set(true);
    });
  }

  async submit() {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    this.error.set(null);
    const res = await this.auth.resetLearnerPassword(this.next());
    this.submitting.set(false);
    if (res.error) {
      this.error.set(ERRORS[res.error as ResetPasswordError] ?? res.error);
      return;
    }
    this.toast.success('Đã đặt mật khẩu mới.');
    await this.router.navigateByUrl('/hoc-vien');
  }
}
