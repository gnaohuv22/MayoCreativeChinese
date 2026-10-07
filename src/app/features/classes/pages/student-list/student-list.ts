import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { stripVietnamese } from '../../utils/student-import.util';
import { ClassService } from '../../services/class.service';
import { StudentTableComponent } from '../../components/student-table/student-table';
import { STUDENT_STATUS_LABELS, type SchoolClass, type Student, type StudentStatus } from '../../models/class.model';

/** /admin/students — học viên của mọi lớp người đang đăng nhập quản lý (admin: tất cả, kể cả chưa có lớp) */
@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [FormsModule, AppIconComponent, StudentTableComponent],
  templateUrl: './student-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentListComponent {
  protected readonly auth = inject(AuthService);
  private readonly classService = inject(ClassService);

  protected readonly statusLabels = STUDENT_STATUS_LABELS;

  readonly students = signal<Student[]>([]);
  readonly classes = signal<SchoolClass[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly search = signal('');
  /** '' = mọi lớp, 'none' = chưa có lớp */
  readonly classFilter = signal('');
  readonly statusFilter = signal<StudentStatus | 'all'>('active');

  readonly classCodes = computed(() => new Map(this.classes().map(c => [c.id, c.code])));
  readonly hasUnassigned = computed(() => this.students().some(s => !s.class_id));

  readonly filtered = computed(() => {
    const q = stripVietnamese(this.search().trim().toLowerCase());
    const cls = this.classFilter();
    const status = this.statusFilter();
    return this.students().filter(s =>
      (status === 'all' || s.status === status)
      && (!cls || (cls === 'none' ? !s.class_id : s.class_id === cls))
      && (!q
        || stripVietnamese(s.full_name.toLowerCase()).includes(q)
        || s.username.toLowerCase().includes(q)
        || s.phone.includes(q)
        || s.parent_phone.includes(q)
        || s.email.toLowerCase().includes(q)));
  });

  constructor() {
    this.load();
  }

  async load() {
    this.loading.set(true);
    const [students, classes] = await Promise.all([this.classService.listStudents(null), this.classService.listClasses()]);
    this.students.set(students.data);
    this.classes.set(classes.data);
    this.loadError.set(students.error ?? classes.error ?? null);
    this.loading.set(false);
  }
}
