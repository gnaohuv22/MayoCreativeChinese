import { Component, ChangeDetectionStrategy, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, STUDENT_PASSWORD_RULES, generateStudentPassword } from '../../../../services/auth.service';
import { ToastService } from '../../../../services/toast.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { ClassService } from '../../services/class.service';
import {
  STUDENT_STATUS_LABELS,
  type ClassOption,
  type Student,
  type StudentProfileInput,
  type StudentStatus,
} from '../../models/class.model';

type BulkAction = 'move' | 'active' | 'locked' | 'archived' | 'delete';

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
  imports: [FormsModule, AppIconComponent],
  templateUrl: './student-table.html',
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
