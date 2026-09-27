import { Component, ChangeDetectionStrategy, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, PASSWORD_RULES, generateStrongPassword } from '../../../../services/auth.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { AdminService, type ResetPasswordError, type StaffMember } from '../../services/admin.service';

const RESET_ERRORS: Record<ResetPasswordError, string> = {
  forbidden: 'Bạn không có quyền đặt lại mật khẩu.',
  too_many_attempts: 'Nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau 15 phút.',
  not_found: 'Không tìm thấy tài khoản này.',
  self: 'Hãy đổi mật khẩu của chính bạn ở trang Hồ sơ.',
  target_is_admin: 'Không thể đặt lại mật khẩu của quản trị viên khác.',
  wrong_admin_password: 'Mật khẩu của bạn không đúng.',
  weak_password: 'Mật khẩu mới chưa đáp ứng đủ yêu cầu.',
};

@Component({
  selector: 'app-admin-staff',
  standalone: true,
  imports: [FormsModule, AppIconComponent],
  templateUrl: './admin-staff.html',
  styleUrl: './admin-staff.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminStaffComponent {
  protected readonly auth = inject(AuthService);
  private readonly admin = inject(AdminService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('resetDialog');

  readonly staff = signal<StaffMember[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  // Hộp thoại đặt lại mật khẩu
  readonly target = signal<StaffMember | null>(null);
  readonly newPassword = signal('');
  readonly adminPassword = signal('');
  readonly showNewPassword = signal(true);
  readonly submitting = signal(false);
  readonly resetError = signal<string | null>(null);
  /** Mật khẩu vừa đặt, hiện 1 lần để admin gửi cho nhân sự */
  readonly issuedPassword = signal<string | null>(null);
  readonly copied = signal(false);

  readonly rules = computed(() => PASSWORD_RULES.map(rule => ({ label: rule.label, ok: rule.test(this.newPassword()) })));
  readonly canSubmit = computed(() =>
    this.rules().every(rule => rule.ok) && this.adminPassword().length > 0 && !this.submitting());

  constructor() {
    this.load();
  }

  async load() {
    this.loading.set(true);
    const res = await this.admin.listStaff();
    this.staff.set(res.data);
    this.loadError.set(res.error ?? null);
    this.loading.set(false);
  }

  isSelf(member: StaffMember) {
    return member.username === this.auth.username();
  }

  initial(member: StaffMember) {
    return (member.username[0] ?? '?').toUpperCase();
  }

  openReset(member: StaffMember) {
    this.target.set(member);
    this.newPassword.set(generateStrongPassword());
    this.adminPassword.set('');
    this.showNewPassword.set(true);
    this.resetError.set(null);
    this.issuedPassword.set(null);
    this.copied.set(false);
    this.dialog().nativeElement.showModal();
  }

  closeReset() {
    this.dialog().nativeElement.close();
  }

  /** Dọn dữ liệu nhạy cảm khi hộp thoại đóng (kể cả bấm Esc) */
  onDialogClosed() {
    this.target.set(null);
    this.newPassword.set('');
    this.adminPassword.set('');
    this.issuedPassword.set(null);
  }

  regenerate() {
    this.newPassword.set(generateStrongPassword());
    this.resetError.set(null);
  }

  async submitReset() {
    const member = this.target();
    if (!member || !this.canSubmit()) return;
    this.submitting.set(true);
    this.resetError.set(null);
    const res = await this.admin.resetStaffPassword(member.user_id, this.adminPassword(), this.newPassword());
    this.submitting.set(false);
    this.adminPassword.set('');
    if (res.error) {
      this.resetError.set(RESET_ERRORS[res.error as ResetPasswordError] ?? res.error);
      return;
    }
    this.issuedPassword.set(this.newPassword());
  }

  async copyIssued() {
    const pw = this.issuedPassword();
    if (!pw) return;
    await navigator.clipboard.writeText(pw);
    this.copied.set(true);
  }
}
