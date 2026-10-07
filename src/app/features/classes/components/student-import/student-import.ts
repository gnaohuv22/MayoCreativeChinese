import { Component, ChangeDetectionStrategy, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { generateStudentPassword } from '../../../../services/auth.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { ClassService } from '../../services/class.service';
import {
  buildDrafts,
  downloadCredentials,
  downloadStudentTemplate,
  parsePastedText,
  parseStudentFile,
  usernameBase,
  type IssuedCredential,
  type StudentDraft,
} from '../../utils/student-import.util';
import type { StudentProfileInput } from '../../models/class.model';

type Step = 'input' | 'preview' | 'done';

/** Tạo tài khoản học viên theo lô cho 1 lớp: dán / tải file → xem trước → tạo → phát tài khoản */
@Component({
  selector: 'app-student-import',
  standalone: true,
  imports: [FormsModule, AppIconComponent],
  templateUrl: './student-import.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentImportComponent {
  private readonly classService = inject(ClassService);

  classId = input.required<string>();
  classCode = input.required<string>();
  /** Sĩ số tối đa và số học viên hiện có — để cảnh báo vượt sĩ số */
  maxStudents = input<number | null>(null);
  currentCount = input(0);
  /** Đã tạo xong (cha tải lại danh sách) */
  created = output<void>();
  closed = output<void>();

  readonly step = signal<Step>('input');
  pasted = '';
  readonly parseError = signal<string | null>(null);
  readonly drafts = signal<StudentDraft[]>([]);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly issued = signal<IssuedCredential[]>([]);
  readonly copied = signal(false);

  readonly invalidCount = computed(() => this.drafts().filter(d => d.errors.length).length);
  readonly overCapacity = computed(() => {
    const max = this.maxStudents();
    return max != null && this.currentCount() + this.drafts().length > max;
  });
  readonly loginUrl = `${location.origin}/dang-nhap`;

  readonly downloadTemplate = downloadStudentTemplate;

  private load(profiles: StudentProfileInput[]) {
    if (profiles.length === 0) {
      this.parseError.set('Không đọc được học viên nào. Kiểm tra lại cột "Họ tên".');
      return;
    }
    if (profiles.length > 200) {
      this.parseError.set(`Mỗi lần tạo tối đa 200 học viên (danh sách có ${profiles.length}).`);
      return;
    }
    this.drafts.set(buildDrafts(profiles, generateStudentPassword));
    this.parseError.set(null);
    this.step.set('preview');
  }

  usePasted() {
    this.load(parsePastedText(this.pasted));
  }

  async onFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (!file) return;
    try {
      this.load(await parseStudentFile(file));
    } catch (err) {
      this.parseError.set((err as Error).message);
    }
  }

  /** Sửa họ tên ngay trong bảng xem trước → tính lại tên đăng nhập và lỗi */
  rename(index: number, fullName: string) {
    const profiles = this.drafts().map((d, i) => ({ ...this.profileOf(d), full_name: i === index ? fullName : d.full_name }));
    const passwords = this.drafts().map(d => d.password);
    let i = 0;
    this.drafts.set(buildDrafts(profiles, () => passwords[i++]));
  }

  remove(index: number) {
    const rest = this.drafts().filter((_, i) => i !== index);
    const passwords = rest.map(d => d.password);
    let i = 0;
    this.drafts.set(buildDrafts(rest.map(d => this.profileOf(d)), () => passwords[i++]));
    if (rest.length === 0) this.step.set('input');
  }

  private profileOf(d: StudentDraft): StudentProfileInput {
    return { full_name: d.full_name, birth_year: d.birth_year, phone: d.phone, email: d.email, parent_phone: d.parent_phone, notes: d.notes };
  }

  previewUsername(d: StudentDraft): string {
    return d.username_base || usernameBase(d.full_name);
  }

  back() {
    this.step.set('input');
    this.submitError.set(null);
  }

  async submit() {
    if (this.invalidCount() > 0 || this.drafts().length === 0) return;
    this.submitting.set(true);
    this.submitError.set(null);
    const drafts = this.drafts();
    const res = await this.classService.createStudents(
      this.classId(),
      drafts.map(({ errors, warnings, ...row }) => row),
    );
    this.submitting.set(false);
    if (res.error) {
      this.submitError.set(res.error);
      return;
    }
    this.issued.set(res.data.map(c => ({ full_name: c.full_name, username: c.username, password: drafts[c.row - 1].password })));
    this.step.set('done');
    this.created.emit();
  }

  async download() {
    await downloadCredentials(this.classCode(), this.issued(), this.loginUrl);
  }

  async copyAll() {
    const text = this.issued().map(i => `${i.full_name}\t${i.username}\t${i.password}`).join('\n');
    await navigator.clipboard.writeText(`Họ tên\tTên đăng nhập\tMật khẩu\n${text}`);
    this.copied.set(true);
  }

  /** Đóng: xoá mật khẩu khỏi bộ nhớ */
  close() {
    this.drafts.set([]);
    this.issued.set([]);
    this.pasted = '';
    this.step.set('input');
    this.closed.emit();
  }
}
