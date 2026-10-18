import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { ToastService } from '../../../../services/toast.service';
import { SiteAdminService } from '../../services/site-admin.service';
import { CourseBlocksEditorComponent } from '../../components/course-blocks-editor/course-blocks-editor';
import { CourseInfoEditorComponent } from '../../components/course-info-editor/course-info-editor';
import { slugify } from '../../../courses/course-links';
import { type CourseDraft, type CourseRow, type DraftTrack, draftToContent, emptyDraft, rowToDraft } from './course-draft';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** /admin/courses — trang chi tiết khóa học (quyền site.manage) */
@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [RouterLink, AppIconComponent, CourseBlocksEditorComponent, CourseInfoEditorComponent],
  templateUrl: './admin-courses.html',
  styleUrl: './admin-courses.css',
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCoursesComponent {
  private readonly siteAdmin = inject(SiteAdminService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly rows = signal<CourseRow[]>([]);
  readonly saving = signal(false);
  readonly reordering = signal(false);

  /** Khóa đang mở (các ô nhập sửa thẳng vào object bên trong) */
  readonly draft = signal<CourseDraft | null>(null);
  private savedSnapshot = '';
  /** Chặng đang mở */
  readonly openTrack = signal<DraftTrack | null>(null);

  readonly bannerOptions = computed(() => this.rows().map(r => ({ slug: r.slug, name: r.name })));

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    const { rows, error } = await this.siteAdmin.listCourses();
    this.loading.set(false);
    if (error || !rows) {
      this.loadError.set(error ?? 'Không có dữ liệu');
      return;
    }
    this.rows.set(rows);
  }

  private snapshot(draft: CourseDraft): string {
    return JSON.stringify({ name: draft.name.trim(), slug: draft.slug.trim(), is_published: draft.is_published, content: draftToContent(draft) });
  }

  isDirty(): boolean {
    const draft = this.draft();
    return !!draft && this.snapshot(draft) !== this.savedSnapshot;
  }

  confirmLeave(): boolean {
    return !this.isDirty() || confirm('Có thay đổi chưa lưu. Rời trang và bỏ các thay đổi này?');
  }

  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.isDirty()) event.preventDefault();
  }

  private openDraft(draft: CourseDraft | null, isNew = false): void {
    this.draft.set(draft);
    this.openTrack.set(null);
    this.savedSnapshot = draft && !isNew ? this.snapshot(draft) : '';
    window.scrollTo({ top: 0 });
  }

  edit(row: CourseRow): void {
    if (this.confirmLeave()) this.openDraft(rowToDraft(row));
  }

  addCourse(): void {
    if (this.confirmLeave()) this.openDraft(emptyDraft(), true);
  }

  close(): void {
    if (this.confirmLeave()) this.openDraft(null);
  }

  // ---------------------------------------------------------------------------
  // Ô nhập
  // ---------------------------------------------------------------------------

  setName(draft: CourseDraft, name: string): void {
    draft.name = name;
    if (!draft.id && !draft.slugTouched) draft.slug = slugify(name);
  }

  setSlug(draft: CourseDraft, slug: string): void {
    draft.slug = slug;
    draft.slugTouched = true;
  }

  slugValid(slug: string): boolean {
    return SLUG_PATTERN.test(slug.trim());
  }

  move<T>(list: T[], index: number, delta: -1 | 1): void {
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
  }

  remove<T>(list: T[], index: number, what: string): void {
    if (confirm(`Xoá ${what}?`)) list.splice(index, 1);
  }

  addLead(draft: CourseDraft): void {
    draft.lead.push({ label: '', text: '' });
  }

  addStat(draft: CourseDraft): void {
    draft.stats.push({ value: '', label: '' });
  }

  addTrack(draft: CourseDraft): void {
    const track: DraftTrack = { id: crypto.randomUUID().slice(0, 8), title: '', sessions: '', summary: '', blocks: [], info: [] };
    draft.tracks.push(track);
    this.openTrack.set(track);
  }

  toggleTrack(track: DraftTrack): void {
    this.openTrack.update(t => (t === track ? null : track));
  }

  // ---------------------------------------------------------------------------
  // Lưu / xoá / đổi thứ tự
  // ---------------------------------------------------------------------------

  async save(): Promise<void> {
    const draft = this.draft();
    if (!draft || this.saving()) return;
    const name = draft.name.trim();
    if (!name) return this.toast.error('Chưa nhập tên khóa học');
    if (!draft.id && !this.slugValid(draft.slug)) return this.toast.error('Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang');
    const fields = { name, is_published: draft.is_published, content: draftToContent(draft) };

    this.saving.set(true);
    const existing = draft.id ? this.rows().find(r => r.id === draft.id) : null;
    const res = existing
      ? await this.siteAdmin.updateCourse(existing.id, fields, existing.updated_at)
      : await this.siteAdmin.createCourse({ ...fields, slug: draft.slug.trim(), sort_order: Math.max(0, ...this.rows().map(r => r.sort_order)) + 1 });
    this.saving.set(false);

    if ('conflict' in res && res.conflict) {
      this.toast.error('Khóa này vừa được người khác lưu. Tải lại trang để xem bản mới rồi sửa lại.');
      return;
    }
    if (res.error || !res.row) {
      this.toast.error(res.error ?? 'Lưu thất bại');
      return;
    }
    const row = res.row;
    this.rows.update(rows => (existing ? rows.map(r => (r.id === row.id ? row : r)) : [...rows, row]));
    // Giữ nguyên bản nháp đang mở (vị trí cuộn, khối đang mở), chỉ cập nhật trạng thái đã lưu
    draft.id = row.id;
    this.savedSnapshot = this.snapshot(draft);
    this.toast.success(`Đã lưu: ${row.name}`);
  }

  async deleteCourse(row: CourseRow): Promise<void> {
    if (!confirm(`Xoá hẳn trang khóa học “${row.name}”? Lớp học đang gắn khóa này sẽ không còn hiện tên khóa. Muốn tạm ẩn thì bỏ chọn “Hiện trên trang web”.`)) return;
    const { error } = await this.siteAdmin.deleteCourse(row.id);
    if (error) {
      this.toast.error(error);
      return;
    }
    this.rows.update(rows => rows.filter(r => r.id !== row.id));
    this.toast.success('Đã xoá trang khóa học');
  }

  async moveCourse(index: number, delta: -1 | 1): Promise<void> {
    const rows = [...this.rows()];
    const target = index + delta;
    if (target < 0 || target >= rows.length || this.reordering()) return;
    [rows[index], rows[target]] = [rows[target], rows[index]];
    this.reordering.set(true);
    const { stamps, error } = await this.siteAdmin.reorderCourses(rows.map(r => r.id));
    this.reordering.set(false);
    if (error || !stamps) {
      this.toast.error(error ?? 'Không đổi được thứ tự');
      return;
    }
    this.rows.set(rows.map((r, i) => ({ ...r, sort_order: i + 1, updated_at: stamps[r.id] ?? r.updated_at })));
  }
}
