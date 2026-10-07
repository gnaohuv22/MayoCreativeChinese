import { Component, ChangeDetectionStrategy, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { COURSE_DETAILS } from '../../../courses/data/course-details.data';
import { ClassService } from '../../services/class.service';
import {
  CLASS_STATUS_LABELS,
  STAFF_ROLE_LABELS,
  type ClassInput,
  type ClassStaffRole,
  type ClassStatus,
  type SchoolClass,
  type StaffDirectoryEntry,
} from '../../models/class.model';

/** Form tạo / sửa lớp (đặt trong <dialog> của trang cha) */
@Component({
  selector: 'app-class-form',
  standalone: true,
  imports: [FormsModule, AppIconComponent],
  templateUrl: './class-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassFormComponent implements OnInit {
  private readonly classService = inject(ClassService);
  private readonly auth = inject(AuthService);

  /** null = tạo lớp mới */
  cls = input<SchoolClass | null>(null);
  /** Danh bạ nhân sự (cha tải sẵn) */
  directory = input<StaffDirectoryEntry[]>([]);
  saved = output<string>();
  cancelled = output<void>();

  protected readonly courses = COURSE_DETAILS.map(c => ({ slug: c.slug, name: c.name }));
  protected readonly statusOptions = Object.entries(CLASS_STATUS_LABELS) as [ClassStatus, string][];
  protected readonly roleLabels = STAFF_ROLE_LABELS;

  form: ClassInput = {
    code: '', name: '', course_slug: null, hsk_level: null, hsk_version: null, study_mode: null,
    start_date: null, end_date: null, schedule: '', max_students: null, notes: '', status: 'planned', staff: [],
  };
  readonly staff = signal<{ user_id: string; role: ClassStaffRole }[]>([]);
  readonly addStaffId = signal('');
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly availableStaff = computed(() => {
    const chosen = new Set(this.staff().map(s => s.user_id));
    return this.directory().filter(d => !chosen.has(d.user_id));
  });

  ngOnInit() {
    const c = this.cls();
    if (c) {
      this.form = {
        id: c.id, code: c.code, name: c.name, course_slug: c.course_slug, hsk_level: c.hsk_level,
        hsk_version: c.hsk_version, study_mode: c.study_mode, start_date: c.start_date, end_date: c.end_date,
        schedule: c.schedule, max_students: c.max_students, notes: c.notes, status: c.status, staff: [],
      };
      this.staff.set(c.staff.map(s => ({ ...s })));
    } else if (!this.auth.can('class.all')) {
      // Nhân sự tạo lớp → mặc định là giáo viên của lớp
      const me = this.directory().find(d => d.username === this.auth.username());
      if (me) this.staff.set([{ user_id: me.user_id, role: 'teacher' }]);
    }
  }

  nameOf(userId: string): string {
    const d = this.directory().find(x => x.user_id === userId);
    return d ? d.full_name || d.username : 'Nhân sự';
  }

  addStaff() {
    const id = this.addStaffId();
    if (!id) return;
    const hasTeacher = this.staff().some(s => s.role === 'teacher');
    this.staff.update(list => [...list, { user_id: id, role: hasTeacher ? 'assistant' : 'teacher' }]);
    this.addStaffId.set('');
  }

  setRole(userId: string, role: ClassStaffRole) {
    this.staff.update(list => list.map(s => (s.user_id === userId ? { ...s, role } : s)));
  }

  removeStaff(userId: string) {
    this.staff.update(list => list.filter(s => s.user_id !== userId));
  }

  async submit() {
    if (!this.form.code.trim() || !this.form.name.trim()) return;
    if (this.form.start_date && this.form.end_date && this.form.end_date < this.form.start_date) {
      this.error.set('Ngày kết thúc phải sau ngày khai giảng.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const res = await this.classService.saveClass({
      ...this.form,
      hsk_level: this.form.hsk_level ? Number(this.form.hsk_level) : null,
      max_students: this.form.max_students ? Number(this.form.max_students) : null,
      start_date: this.form.start_date || null,
      end_date: this.form.end_date || null,
      staff: this.staff(),
    });
    this.saving.set(false);
    if (res.error || !res.id) {
      this.error.set(res.error ?? 'Không lưu được lớp.');
      return;
    }
    this.saved.emit(res.id);
  }
}
