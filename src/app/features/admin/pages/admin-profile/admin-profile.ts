import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, PASSWORD_RULES, STAFF_ROLE_LABELS } from '../../../../services/auth.service';
import { ToastService } from '../../../../services/toast.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [FormsModule, AppIconComponent],
  templateUrl: './admin-profile.html',
  styleUrl: './admin-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProfileComponent {
  protected readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly roleInfo = computed(() => {
    const role = this.auth.role();
    return role ? STAFF_ROLE_LABELS[role] : null;
  });

  // Thông tin cá nhân
  readonly fullName = signal(this.auth.displayName());
  readonly savingName = signal(false);
  readonly nameChanged = computed(() => {
    const name = this.fullName().trim();
    return name.length > 0 && name !== this.auth.displayName();
  });

  // Đổi mật khẩu
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly showPasswords = signal(false);
  readonly savingPassword = signal(false);
  readonly passwordError = signal<string | null>(null);

  readonly rules = computed(() => {
    const pw = this.newPassword();
    return [
      ...PASSWORD_RULES.map(rule => ({ label: rule.label, ok: rule.test(pw) })),
      { label: 'Nhập lại khớp với mật khẩu mới', ok: pw.length > 0 && pw === this.confirmPassword() },
      { label: 'Khác mật khẩu hiện tại', ok: pw.length > 0 && pw !== this.currentPassword() },
    ];
  });
  readonly canSubmitPassword = computed(() =>
    this.currentPassword().length > 0 && this.rules().every(rule => rule.ok) && !this.savingPassword());

  async saveName() {
    if (!this.nameChanged()) return;
    this.savingName.set(true);
    const res = await this.auth.updateFullName(this.fullName());
    this.savingName.set(false);
    if (res.error) {
      this.toast.error(`Không lưu được họ tên: ${res.error}`);
      return;
    }
    this.fullName.set(this.fullName().trim());
    this.toast.success('Đã cập nhật họ tên.');
  }

  async savePassword() {
    if (!this.canSubmitPassword()) return;
    this.savingPassword.set(true);
    this.passwordError.set(null);
    const res = await this.auth.changePassword(this.currentPassword(), this.newPassword());
    this.savingPassword.set(false);
    if (res.error) {
      this.passwordError.set(res.error);
      return;
    }
    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.showPasswords.set(false);
    this.toast.success('Đã đổi mật khẩu. Lần đăng nhập sau hãy dùng mật khẩu mới.');
  }
}
