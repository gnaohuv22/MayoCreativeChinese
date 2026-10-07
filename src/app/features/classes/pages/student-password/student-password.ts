import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, STUDENT_PASSWORD_RULES, type StudentPasswordError } from '../../../../services/auth.service';
import { ToastService } from '../../../../services/toast.service';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';

const ERRORS: Record<StudentPasswordError, string> = {
  not_student: 'Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.',
  wrong_password: 'Mật khẩu hiện tại không đúng.',
  weak_password: 'Mật khẩu mới chưa đáp ứng đủ yêu cầu.',
  same_password: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
};

/** /hoc-vien/mat-khau — bắt buộc lần đầu đăng nhập (mật khẩu do giáo viên cấp) */
@Component({
  selector: 'app-student-password',
  standalone: true,
  imports: [FormsModule, RouterLink, NavHeaderComponent, AppIconComponent],
  templateUrl: './student-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentPasswordComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly forced = computed(() => this.auth.student()?.must_change_password ?? false);
  readonly current = signal('');
  readonly next = signal('');
  readonly confirm = signal('');
  readonly show = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly rules = computed(() => STUDENT_PASSWORD_RULES.map(r => ({ label: r.label, ok: r.test(this.next()) })));
  readonly mismatch = computed(() => this.confirm().length > 0 && this.confirm() !== this.next());
  readonly canSubmit = computed(() =>
    this.current().length > 0 && this.rules().every(r => r.ok) && this.confirm() === this.next() && !this.submitting());

  async submit() {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    this.error.set(null);
    const res = await this.auth.changeStudentPassword(this.current(), this.next());
    this.submitting.set(false);
    if (res.error) {
      this.error.set(ERRORS[res.error as StudentPasswordError] ?? res.error);
      return;
    }
    this.toast.success('Đã đổi mật khẩu.');
    await this.router.navigateByUrl('/hoc-vien');
  }

  async signOut() {
    await this.auth.signOut();
    await this.router.navigateByUrl('/dang-nhap');
  }
}
