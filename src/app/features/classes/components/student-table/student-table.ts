import { Component, ChangeDetectionStrategy, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, STUDENT_PASSWORD_RULES, generateStudentPassword } from '../../../../services/auth.service';
import { ToastService } from '../../../../services/toast.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { ClassService } from '../../services/class.service';
import { ACCESS_MODULE_LABELS, isGrantActive, type AccessModule } from '../../../../components/shared/visibility/content-visibility';
import { formatDate } from '../../utils/class-display.util';
import { DeviceListComponent } from '../device-list/device-list';
import type { DeviceList, LearnerDevice } from '../../../../services/auth.service';
import {
  STUDENT_STATUS_LABELS,
  type ClassOption,
  type Student,
  type GrantTerm,
  type StudentAccessGrant,
  type StudentProfileInput,
  type StudentStatus,
} from '../../models/class.model';

type BulkAction = 'move' | 'active' | 'locked' | 'archived' | 'delete';

/** Thời hạn chọn sẵn khi cấp quyền (interval Postgres) */
const GRANT_TERMS: { value: string; label: string }[] = [
  { value: '7 days', label: '7 ngày' },
  { value: '1 month', label: '1 tháng' },
  { value: '3 months', label: '3 tháng' },
  { value: '6 months', label: '6 tháng' },
  { value: '12 months', label: '12 tháng' },
  { value: 'until', label: 'Đến ngày…' },
  { value: 'unlimited', label: 'Không thời hạn' },
];

/** Cộng thời lượng dạng '7 days' / '3 months' vào một mốc */
function addTerm(from: Date, term: string): Date {
  const [n, unit] = term.split(' ');
  const d = new Date(from);
  if (unit.startsWith('day')) d.setDate(d.getDate() + Number(n));
  else d.setMonth(d.getMonth() + Number(n));
  return d;
}

const BULK_CONFIRM: Record<Exclude<BulkAction, 'move'>, { title: string; verb: string; done: string }> = {
  active: { title: 'Mở lại tài khoản', verb: 'Mở lại', done: 'Đã mở lại' },
  locked: { title: 'Khoá tài khoản', verb: 'Khoá', done: 'Đã khoá' },
  archived: { title: 'Lưu trữ tài khoản', verb: 'Lưu trữ', done: 'Đã lưu trữ' },
  delete: { title: 'Xoá vĩnh viễn', verb: 'Xoá vĩnh viễn', done: 'Đã xoá' },
};

/** Bảng học viên dùng chung cho trang lớp và trang "Học viên": chọn nhiều, chuyển lớp, khoá, sửa, đặt lại mật khẩu */
@Component({
  selector: 'app-student-table',
  standalone: true,
  imports: [FormsModule, AppIconComponent, DeviceListComponent],
  templateUrl: './student-table.html',
  styleUrl: './student-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentTableComponent {
  protected readonly auth = inject(AuthService);
  private readonly classService = inject(ClassService);
  private readonly toast = inject(ToastService);

  students = input.required<Student[]>();
  /** Trang "Học viên": hiện cột lớp */
  showClass = input(false);
  /** id lớp → mã lớp (cột lớp) */
  classCodes = input<Map<string, string>>(new Map());
  changed = output<void>();

  protected readonly statusLabels = STUDENT_STATUS_LABELS;
  protected readonly passwordRules = STUDENT_PASSWORD_RULES;

  readonly selected = signal<Set<string>>(new Set());
  readonly selectedStudents = computed(() => this.students().filter(s => this.selected().has(s.user_id)));
  readonly allSelected = computed(() => this.students().length > 0 && this.students().every(s => this.selected().has(s.user_id)));
  readonly busy = signal(false);

  private readonly editDialog = viewChild.required<ElementRef<HTMLDialogElement>>('editDialog');
  private readonly passwordDialog = viewChild.required<ElementRef<HTMLDialogElement>>('passwordDialog');
  private readonly bulkDialog = viewChild.required<ElementRef<HTMLDialogElement>>('bulkDialog');
  private readonly grantDialog = viewChild.required<ElementRef<HTMLDialogElement>>('grantDialog');
  private readonly deviceDialog = viewChild.required<ElementRef<HTMLDialogElement>>('deviceDialog');

  // Thiết bị đăng nhập
  readonly deviceTarget = signal<Student | null>(null);
  readonly deviceList = signal<DeviceList | null>(null);
  readonly removingDevice = signal<string | null>(null);
  readonly deviceError = signal<string | null>(null);

  // Cấp / thu hồi quyền Mayo+
  protected readonly moduleLabels = ACCESS_MODULE_LABELS;
  protected readonly modules = Object.keys(ACCESS_MODULE_LABELS) as AccessModule[];
  protected readonly grantTerms = GRANT_TERMS;
  protected readonly formatDate = formatDate;
  readonly grantMode = signal<'grant' | 'revoke'>('grant');
  readonly grantTargets = signal<Student[]>([]);
  readonly grantModules = signal<Set<AccessModule>>(new Set(['flashcards', 'exams']));
  readonly grantTerm = signal('1 month');
  readonly grantUntil = signal('');
  readonly grantNote = signal('');
  readonly grantError = signal<string | null>(null);
  /** Ngày nhỏ nhất chọn được (ngày mai) */
  readonly minUntil = computed(() => {
    const d = new Date(Date.now() + 86_400_000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  /** Hạn trước → sau khi lưu của từng mục đã chọn (khớp cách grant_access tính, migration 024) */
  readonly grantPreview = computed(() => {
    const targets = this.grantTargets();
    const mode = this.grantMode();
    const term = this.grantTerm();
    return this.modules.filter(m => this.grantModules().has(m)).map(module => {
      const current = targets.length === 1 ? targets[0].access_grants?.find(g => g.module === module) : undefined;
      const active = current && isGrantActive(current) ? current : undefined;
      const before = targets.length > 1 ? `${targets.length} tài khoản`
        : !active ? 'Chưa có' : active.expires_at ? formatDate(active.expires_at) : 'Không thời hạn';
      let after: string;
      if (mode === 'revoke') after = 'Thu hồi';
      else if (term === 'unlimited') after = 'Không thời hạn';
      else if (term === 'until') after = this.grantUntil() ? formatDate(this.grantUntil()) : '…';
      else if (targets.length > 1) after = `+ ${GRANT_TERMS.find(t => t.value === term)?.label ?? term}`;
      else if (active && !active.expires_at) after = 'Không thời hạn';
      else after = formatDate(addTerm(active?.expires_at ? new Date(active.expires_at) : new Date(), term).toISOString());
      return { label: ACCESS_MODULE_LABELS[module], before, after };
    });
  });
  readonly grantReady = computed(() =>
    this.grantModules().size > 0 && (this.grantMode() === 'revoke' || this.grantTerm() !== 'until' || this.grantUntil() >= this.minUntil()));

  // Sửa hồ sơ
  readonly editing = signal<Student | null>(null);
  editForm: StudentProfileInput = this.emptyProfile();
  readonly editError = signal<string | null>(null);

  // Đặt lại mật khẩu
  readonly passwordTarget = signal<Student | null>(null);
  readonly newPassword = signal('');
  readonly issuedPassword = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);
  readonly passwordOk = computed(() => STUDENT_PASSWORD_RULES.every(r => r.test(this.newPassword())));
  readonly copied = signal(false);

  // Thao tác hàng loạt
  readonly bulkAction = signal<BulkAction | null>(null);
  readonly classOptions = signal<ClassOption[]>([]);
  readonly moveTarget = signal('');
  readonly bulkError = signal<string | null>(null);
  readonly bulkText = computed(() => {
    const action = this.bulkAction();
    return action && action !== 'move' ? BULK_CONFIRM[action] : null;
  });

  statusClass(status: StudentStatus): string {
    return {
      active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
      locked: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
      archived: 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300',
    }[status];
  }

  toggle(id: string) {
    this.selected.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  toggleAll() {
    this.selected.set(this.allSelected() ? new Set() : new Set(this.students().map(s => s.user_id)));
  }

  clearSelection() {
    this.selected.set(new Set());
  }

  // ---------------------------------------------------------------------------
  private emptyProfile(): StudentProfileInput {
    return { full_name: '', birth_year: null, phone: '', email: '', parent_phone: '', notes: '' };
  }

  openEdit(student: Student) {
    this.editing.set(student);
    this.editForm = {
      full_name: student.full_name,
      birth_year: student.birth_year,
      phone: student.phone,
      email: student.email,
      parent_phone: student.parent_phone,
      notes: student.notes,
    };
    this.editError.set(null);
    this.editDialog().nativeElement.showModal();
  }

  async saveEdit() {
    const student = this.editing();
    if (!student || !this.editForm.full_name.trim()) return;
    this.busy.set(true);
    const res = await this.classService.updateStudent(student.user_id, {
      ...this.editForm,
      birth_year: this.editForm.birth_year ? Number(this.editForm.birth_year) : null,
    });
    this.busy.set(false);
    if (res.error) {
      this.editError.set(res.error);
      return;
    }
    this.editDialog().nativeElement.close();
    this.toast.success(`Đã lưu hồ sơ ${this.editForm.full_name}.`);
    this.changed.emit();
  }

  // ---------------------------------------------------------------------------
  openPassword(student: Student) {
    this.passwordTarget.set(student);
    this.newPassword.set(generateStudentPassword());
    this.issuedPassword.set(null);
    this.passwordError.set(null);
    this.copied.set(false);
    this.passwordDialog().nativeElement.showModal();
  }

  regeneratePassword() {
    this.newPassword.set(generateStudentPassword());
    this.passwordError.set(null);
  }

  async submitPassword() {
    const student = this.passwordTarget();
    if (!student || !this.passwordOk()) return;
    this.busy.set(true);
    const res = await this.classService.resetStudentPassword(student.user_id, this.newPassword());
    this.busy.set(false);
    if (res.error) {
      this.passwordError.set(res.error);
      return;
    }
    this.issuedPassword.set(this.newPassword());
    this.changed.emit();
  }

  async copyPassword() {
    const student = this.passwordTarget();
    const pw = this.issuedPassword();
    if (!student || !pw) return;
    await navigator.clipboard.writeText(`Tên đăng nhập: ${student.username}\nMật khẩu: ${pw}`);
    this.copied.set(true);
  }

  /** Dọn mật khẩu khỏi bộ nhớ khi đóng hộp thoại */
  onPasswordClosed() {
    this.passwordTarget.set(null);
    this.newPassword.set('');
    this.issuedPassword.set(null);
  }

  // ---------------------------------------------------------------------------
  /** Quyền của 1 tài khoản để hiện trong bảng: còn hạn trước, hết hạn sau */
  grantsOf(student: Student): (StudentAccessGrant & { active: boolean })[] {
    return (student.access_grants ?? [])
      .map(g => ({ ...g, active: isGrantActive(g) }))
      .sort((a, b) => Number(b.active) - Number(a.active) || a.module.localeCompare(b.module));
  }

  async openDevices(student: Student) {
    this.deviceTarget.set(student);
    this.deviceList.set(null);
    this.deviceError.set(null);
    this.deviceDialog().nativeElement.showModal();
    const res = await this.classService.studentDevices(student.user_id);
    if (res.error) this.deviceError.set(res.error);
    else this.deviceList.set(res.data ?? null);
  }

  async removeDevice(device: LearnerDevice) {
    const student = this.deviceTarget();
    if (!student) return;
    this.removingDevice.set(device.device_id);
    this.deviceError.set(null);
    const res = await this.classService.removeStudentDevice(student.user_id, device.device_id);
    this.removingDevice.set(null);
    if (res.error) {
      this.deviceError.set(res.error);
      return;
    }
    this.deviceList.set(res.data ?? null);
    this.toast.success(`Đã gỡ ${device.label || 'thiết bị'} của ${student.full_name}.`);
  }

  openGrant(students: Student[], mode: 'grant' | 'revoke' = 'grant') {
    if (students.length === 0) return;
    this.grantTargets.set(students);
    this.grantMode.set(mode);
    // Thu hồi: để trống, tránh lỡ tay thu hồi cả hai
    this.grantModules.set(new Set(mode === 'grant' ? this.modules : []));
    this.grantTerm.set('1 month');
    this.grantUntil.set('');
    this.grantNote.set('');
    this.grantError.set(null);
    this.grantDialog().nativeElement.showModal();
  }

  toggleGrantModule(module: AccessModule) {
    this.grantModules.update(set => {
      const next = new Set(set);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  }

  async submitGrant() {
    const ids = this.grantTargets().map(s => s.user_id);
    const modules = this.modules.filter(m => this.grantModules().has(m));
    if (ids.length === 0 || !this.grantReady()) return;
    const term = this.grantTerm();
    const grantTerm: GrantTerm =
      term === 'unlimited' ? { unlimited: true }
      : term === 'until' ? { until: `${this.grantUntil()}T23:59:59+07:00` }
      : { duration: term };

    this.busy.set(true);
    const res = this.grantMode() === 'grant'
      ? await this.classService.grantAccess(ids, modules, grantTerm, this.grantNote().trim())
      : await this.classService.revokeAccess(ids, modules);
    this.busy.set(false);
    if (res.error) {
      this.grantError.set(res.error);
      return;
    }
    this.grantDialog().nativeElement.close();
    const what = modules.map(m => ACCESS_MODULE_LABELS[m]).join(' + ');
    this.toast.success(this.grantMode() === 'grant'
      ? `Đã cấp ${what} cho ${ids.length} tài khoản.`
      : `Đã thu hồi ${what} của ${ids.length} tài khoản.`);
    this.clearSelection();
    this.changed.emit();
  }

  // ---------------------------------------------------------------------------
  async openBulk(action: BulkAction) {
    if (this.selectedStudents().length === 0) return;
    this.bulkAction.set(action);
    this.bulkError.set(null);
    this.moveTarget.set('');
    if (action === 'move') this.classOptions.set(await this.classService.classOptions());
    this.bulkDialog().nativeElement.showModal();
  }

  async submitBulk() {
    const action = this.bulkAction();
    const ids = this.selectedStudents().map(s => s.user_id);
    if (!action || ids.length === 0) return;
    if (action === 'move' && !this.moveTarget()) return;

    this.busy.set(true);
    const res =
      action === 'move' ? await this.classService.moveStudents(ids, this.moveTarget())
      : action === 'delete' ? await this.classService.deleteStudents(ids)
      : await this.classService.setStudentsStatus(ids, action);
    this.busy.set(false);
    if (res.error) {
      this.bulkError.set(res.error);
      return;
    }
    this.bulkDialog().nativeElement.close();
    const target = this.classOptions().find(c => c.id === this.moveTarget());
    this.toast.success(action === 'move'
      ? `Đã chuyển ${ids.length} học viên sang lớp ${target?.code ?? ''}.`
      : `${BULK_CONFIRM[action].done} ${ids.length} tài khoản.`);
    this.clearSelection();
    this.changed.emit();
  }
}
