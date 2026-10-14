import { Component, ChangeDetectionStrategy, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, PASSWORD_RULES, generateStrongPassword } from '../../../../services/auth.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { ToastService } from '../../../../services/toast.service';
import { usernameBase } from '../../../classes/utils/student-import.util';
import { AdminService, type ResetPasswordError, type RoleInfo, type StaffMember } from '../../services/admin.service';

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
  private readonly toast = inject(ToastService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('resetDialog');
  private readonly createDialog = viewChild.required<ElementRef<HTMLDialogElement>>('createDialog');

  readonly staff = signal<StaffMember[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  /** Danh sách vai trò để đổi vai trò / tạo tài khoản (chỉ khi có role.manage) */
  readonly roles = signal<RoleInfo[]>([]);
  readonly busyUser = signal<string | null>(null);

  // Hộp thoại tạo tài khoản
  readonly creating = signal(false);
  readonly newStaff = signal({ full_name: '', username: '', role_id: '', password: '' });
  private usernameEdited = false;
  readonly createError = signal<string | null>(null);
  readonly createdAccount = signal<{ username: string; password: string } | null>(null);
  readonly newStaffRules = computed(() => PASSWORD_RULES.map(rule => ({ label: rule.label, ok: rule.test(this.newStaff().password) })));
  readonly canCreate = computed(() => {
    const s = this.newStaff();
    return !!s.full_name.trim() && /^[A-Za-z][A-Za-z0-9]{1,29}$/.test(s.username) && !!s.role_id
      && this.newStaffRules().every(r => r.ok) && !this.creating();
  });

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
    const [res, roles] = await Promise.all([
      this.admin.listStaff(),
      this.auth.can('role.manage') ? this.admin.listRoles() : Promise.resolve(null),
    ]);
    this.staff.set(res.data);
    if (roles) this.roles.set(roles.roles);
    this.loadError.set(res.error ?? roles?.error ?? null);
    this.loading.set(false);
  }

  canManage(member: StaffMember) {
    return this.auth.can('role.manage') && !this.isSelf(member);
  }

  async changeRole(member: StaffMember, roleId: string) {
    if (roleId === member.role_id) return;
    this.busyUser.set(member.user_id);
    const res = await this.admin.setStaffRole(member.user_id, roleId);
    this.busyUser.set(null);
    if (res.error) {
      this.toast.error(res.error);
    } else {
      this.toast.success(`Đã đổi vai trò của ${member.username}.`);
    }
    await this.load();
  }

  async toggleLock(member: StaffMember) {
    const lock = member.status === 'active';
    if (lock && !confirm(`Khoá tài khoản ${member.username}? Người này bị đăng xuất khỏi mọi thiết bị và không đăng nhập được nữa.`)) return;
    this.busyUser.set(member.user_id);
    const res = await this.admin.setStaffStatus(member.user_id, lock ? 'locked' : 'active');
    this.busyUser.set(null);
    if (res.error) {
      this.toast.error(res.error);
      return;
    }
    this.toast.success(lock ? `Đã khoá tài khoản ${member.username}.` : `Đã mở khoá tài khoản ${member.username}.`);
    await this.load();
  }

  openCreate() {
    const defaultRole = this.roles().find(r => r.id === 'staff')?.id ?? this.roles()[0]?.id ?? '';
    this.newStaff.set({ full_name: '', username: '', role_id: defaultRole, password: generateStrongPassword() });
    this.usernameEdited = false;
    this.createError.set(null);
    this.createdAccount.set(null);
    this.copied.set(false);
    this.createDialog().nativeElement.showModal();
  }

  closeCreate() {
    this.createDialog().nativeElement.close();
  }

  onCreateClosed() {
    this.newStaff.update(s => ({ ...s, password: '' }));
    this.createdAccount.set(null);
  }

  patchNewStaff(change: Partial<{ full_name: string; username: string; role_id: string; password: string }>) {
    if (change.username !== undefined) this.usernameEdited = change.username !== '';
    this.newStaff.update(s => {
      const next = { ...s, ...change };
      // Tên đăng nhập tự theo họ tên (MaiLN) cho tới khi người dùng tự sửa
      if (change.full_name !== undefined && !this.usernameEdited) next.username = usernameBase(change.full_name);
      return next;
    });
    this.createError.set(null);
  }

  async submitCreate() {
    if (!this.canCreate()) return;
    const input = { ...this.newStaff(), full_name: this.newStaff().full_name.trim() };
    this.creating.set(true);
    const res = await this.admin.createStaff(input);
    this.creating.set(false);
    if (res.error) {
      this.createError.set(res.error);
      return;
    }
    this.createdAccount.set({ username: input.username, password: input.password });
    await this.load();
  }

  async copyCreated() {
    const account = this.createdAccount();
    if (!account) return;
    await navigator.clipboard.writeText(`Tên đăng nhập: ${account.username}
Mật khẩu: ${account.password}`);
    this.copied.set(true);
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

  regeneratedPassword() {
    return generateStrongPassword();
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
