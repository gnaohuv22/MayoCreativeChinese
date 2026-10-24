import { Component, ChangeDetectionStrategy, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { generateStudentPassword, normalizeVnPhone } from '../../../../services/auth.service';
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
  styleUrl: './student-import.css',
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

  /** Số điện thoại / email (đã chuẩn hoá) → tài khoản đã có, để báo trước khi tạo thêm tài khoản lớp */
  private readonly existing = signal<Map<string, string>>(new Map());

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
    void this.checkExisting(profiles);
  }

  private async checkExisting(profiles: StudentProfileInput[]) {
    this.existing.set(new Map());
    // Số đã lưu có thể ở dạng chuẩn hoá (khách) hoặc nguyên văn (học viên lớp)
    const phones = [...new Set(profiles.flatMap(p => (p.phone?.trim() ? [p.phone.trim(), normalizeVnPhone(p.phone)] : [])).filter((p): p is string => !!p))];
    const emails = [...new Set(profiles.flatMap(p => (p.email?.trim() ? [p.email.trim().toLowerCase()] : [])))];
    if (!phones.length && !emails.length) return;
    const found = await this.classService.findExistingLearners(phones, emails);
    const map = new Map<string, string>();
    for (const a of found) {
      const label = `Đã có tài khoản ${a.account_type === 'guest' ? 'khách' : 'học viên'} ${a.username} (${a.full_name}) — tạo tiếp sẽ thành 2 tài khoản`;
      if (a.phone) map.set(normalizeVnPhone(a.phone) ?? a.phone.trim(), label);
      if (a.email) map.set(a.email.toLowerCase(), label);
    }
    this.existing.set(map);
  }

  /** Cảnh báo trùng tài khoản đã có của 1 dòng */
  existingAccount(d: StudentDraft): string | null {
    const map = this.existing();
    const phone = d.phone?.trim() ? (normalizeVnPhone(d.phone) ?? d.phone.trim()) : null;
    return (phone && map.get(phone)) || (d.email?.trim() && map.get(d.email.trim().toLowerCase())) || null;
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
