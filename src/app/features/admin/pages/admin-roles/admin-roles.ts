import { Component, ChangeDetectionStrategy, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, type Permission } from '../../../../services/auth.service';
import { ToastService } from '../../../../services/toast.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { stripVietnamese } from '../../../classes/utils/student-import.util';
import { AdminService, type PermissionInfo, type RoleInfo } from '../../services/admin.service';

const GROUP_LABELS: Record<string, string> = {
  content: 'Nội dung',
  class: 'Lớp học & học viên',
  admin: 'Quản trị',
  other: 'Khác',
};

interface RoleDraft {
  id: string;
  label: string;
  description: string;
  permissions: Set<Permission>;
  create: boolean;
}

/** "Trợ giảng" → "tro_giang"; thêm số nếu trùng mã có sẵn */
function roleIdFromLabel(label: string, taken: Set<string>): string {
  let base = stripVietnamese(label).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24);
  if (!/^[a-z]/.test(base)) base = `role_${base}`.replace(/_+$/, '');
  let id = base;
  for (let i = 2; taken.has(id); i++) id = `${base}_${i}`;
  return id;
}

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [FormsModule, AppIconComponent],
  templateUrl: './admin-roles.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRolesComponent {
  protected readonly auth = inject(AuthService);
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('roleDialog');

  readonly roles = signal<RoleInfo[]>([]);
  readonly permissions = signal<PermissionInfo[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly draft = signal<RoleDraft | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly groups = computed(() => {
    const map = new Map<string, PermissionInfo[]>();
    for (const p of this.permissions()) map.set(p.grp, [...(map.get(p.grp) ?? []), p]);
    return [...map].map(([grp, items]) => ({ grp, label: GROUP_LABELS[grp] ?? grp, items }));
  });
  private readonly permissionLabels = computed(() => new Map(this.permissions().map(p => [p.id, p.label])));

  constructor() {
    this.load();
  }

  async load() {
    this.loading.set(true);
    const res = await this.admin.listRoles();
    this.roles.set(res.roles);
    this.permissions.set(res.permissions);
    this.loadError.set(res.error ?? null);
    this.loading.set(false);
  }

  permissionLabel(id: Permission) {
    return this.permissionLabels().get(id) ?? id;
  }

  isOwnRole(roleId: string) {
    return this.auth.roleId() === roleId;
  }

  openCreate() {
    this.openDialog({ id: '', label: '', description: '', permissions: new Set<Permission>(['content.read']), create: true });
  }

  openEdit(role: RoleInfo) {
    this.openDialog({ id: role.id, label: role.label, description: role.description, permissions: new Set(role.permissions), create: false });
  }

  private openDialog(draft: RoleDraft) {
    this.draft.set(draft);
    this.formError.set(null);
    this.dialog().nativeElement.showModal();
  }

  closeDialog() {
    this.dialog().nativeElement.close();
  }

  patch(change: Partial<RoleDraft>) {
    this.draft.update(d => (d ? { ...d, ...change } : d));
    this.formError.set(null);
  }

  toggle(id: Permission, checked: boolean) {
    const d = this.draft();
    if (!d) return;
    const next = new Set(d.permissions);
    if (checked) next.add(id);
    else next.delete(id);
    this.patch({ permissions: next });
  }

  /** Bỏ Phân quyền khỏi vai trò của chính mình sẽ bị DB từ chối — khoá luôn ô này */
  lockedPermission(id: Permission, d: RoleDraft) {
    return id === 'role.manage' && !d.create && this.isOwnRole(d.id);
  }

  async save() {
    const d = this.draft();
    if (!d || this.saving()) return;
    const label = d.label.trim();
    if (!label) {
      this.formError.set('Cần nhập tên vai trò.');
      return;
    }
    const id = d.create ? roleIdFromLabel(label, new Set(this.roles().map(r => r.id))) : d.id;
    this.saving.set(true);
    const res = await this.admin.saveRole({
      id,
      label,
      description: d.description.trim(),
      permissions: [...d.permissions],
      create: d.create,
    });
    this.saving.set(false);
    if (res.error) {
      this.formError.set(res.error);
      return;
    }
    this.closeDialog();
    this.toast.success(d.create ? `Đã tạo vai trò "${label}".` : `Đã lưu vai trò "${label}".`);
    await Promise.all([this.load(), this.auth.loadContext()]);
  }

  async remove(role: RoleInfo) {
    if (!confirm(`Xoá vai trò "${role.label}"?`)) return;
    const res = await this.admin.deleteRole(role.id);
    if (res.error) {
      this.toast.error(res.error);
      return;
    }
    this.toast.success(`Đã xoá vai trò "${role.label}".`);
    await this.load();
  }
}
