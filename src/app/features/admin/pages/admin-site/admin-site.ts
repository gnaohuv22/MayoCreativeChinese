import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { I18nService, type Lang, type LocalizedText } from '../../../../services/i18n.service';
import { ToastService } from '../../../../services/toast.service';
import { SiteContentService } from '../../../landing/services/site-content.service';
import { CourseService } from '../../../courses/services/course.service';
import { AUDIENCE_PARAM, slugify } from '../../../courses/course-links';
import {
  COURSE_ICONS,
  SITE_SECTION_IDS,
  type CourseIcon,
  type CourseItem,
  type GalleryItem,
  type SiteContent,
  type SiteSectionId,
  type TeacherItem,
} from '../../../landing/models/site-content.model';
import { SiteAdminService } from '../../services/site-admin.service';
import { LtextInputComponent } from '../../components/ltext-input/ltext-input';
import { SiteImageFieldComponent } from '../../components/site-image-field/site-image-field';
import { AdminGuideComponent } from '../../components/admin-guide/admin-guide';

const SECTION_LABELS: Record<SiteSectionId, string> = {
  hero: 'Mở đầu',
  about: 'Giới thiệu',
  teachers: 'Giáo viên',
  courses: 'Khóa học',
  gallery: 'Thư viện ảnh',
  contact: 'Liên hệ',
};

const ICON_LABELS: Record<CourseIcon, string> = {
  certificate: 'Chứng chỉ',
  academic: 'Mũ tốt nghiệp',
  chat: 'Hội thoại',
  business: 'Kinh doanh',
  tutor: 'Gia sư',
  logistics: 'Vận chuyển',
};

const newId = () => crypto.randomUUID().slice(0, 8);

/** JSON với khoá object xếp theo thứ tự chữ cái — DB (jsonb) trả khoá đã sắp xếp, so sánh không bị lệch thứ tự */
function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v);
}
const clone = <T>(value: T): T => structuredClone(value);

/** /admin/site — sửa nội dung trang chủ (quyền site.manage) */
@Component({
  selector: 'app-admin-site',
  standalone: true,
  imports: [RouterLink, AppIconComponent, LtextInputComponent, SiteImageFieldComponent, AdminGuideComponent],
  templateUrl: './admin-site.html',
  styleUrl: './admin-site.css',
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSiteComponent {
  private readonly siteAdmin = inject(SiteAdminService);
  private readonly siteContent = inject(SiteContentService);
  private readonly toast = inject(ToastService);
  protected readonly i18n = inject(I18nService);
  private readonly courseService = inject(CourseService);

  /** Trang chi tiết khóa học (site_courses), mỗi tab đối tượng là 1 lựa chọn riêng */
  private readonly detailChoices = computed(() => [
    { value: '', label: 'Không có' },
    ...(this.courseService.names() ?? []).flatMap(c => [
      { value: c.slug, label: c.is_published ? c.name : `${c.name} (đang ẩn)` },
      ...(c.audiences ?? []).slice(1).map(a => {
        const short = a.replace(/\s*\(.*\)$/, '');
        return { value: `${c.slug}?${AUDIENCE_PARAM}=${slugify(short)}`, label: `${c.name} – ${short}` };
      }),
    ]),
  ]);

  readonly sectionIds = SITE_SECTION_IDS;
  readonly sectionLabels = SECTION_LABELS;
  readonly courseIcons = COURSE_ICONS.map(value => ({ value, label: ICON_LABELS[value] }));

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly tab = signal<SiteSectionId>('hero');
  readonly lang = signal<Lang>('vi');
  /** Thẻ đang mở trong danh sách giáo viên / khóa học */
  readonly openItem = signal<string | null>(null);

  /** Bản nháp đang sửa (các ô nhập sửa thẳng vào object bên trong) */
  readonly draft = signal<SiteContent | null>(null);
  private saved: Partial<Record<SiteSectionId, string>> = {};
  private stamps: Partial<Record<SiteSectionId, string>> = {};

  constructor() {
    void this.load();
    void this.courseService.loadNames();
  }

  private async load(): Promise<void> {
    const { rows, error } = await this.siteAdmin.loadAll();
    this.loading.set(false);
    if (error || !rows) {
      this.loadError.set(error ?? 'Không có dữ liệu');
      return;
    }
    const content: Partial<SiteContent> = {};
    for (const row of rows) {
      Object.assign(content, { [row.id]: row.content });
      this.saved[row.id] = stableJson(row.content);
      this.stamps[row.id] = row.updated_at;
    }
    if (SITE_SECTION_IDS.some(id => !content[id])) {
      this.loadError.set('Thiếu khối nội dung — kiểm tra migration 028');
      return;
    }
    this.draft.set(clone(content as SiteContent));
  }

  isDirty(id: SiteSectionId): boolean {
    const draft = this.draft();
    return !!draft && stableJson(draft[id]) !== this.saved[id];
  }

  anyDirty(): boolean {
    return SITE_SECTION_IDS.some(id => this.isDirty(id));
  }

  /** Dùng cho canDeactivate trên route */
  confirmLeave(): boolean {
    return !this.anyDirty() || confirm('Có thay đổi chưa lưu. Rời trang và bỏ các thay đổi này?');
  }

  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.anyDirty()) return;
    event.preventDefault();
    // Chromium cũ cần returnValue mới hiện hộp xác nhận
    event.returnValue = '';
  }

  selectTab(id: SiteSectionId): void {
    this.tab.set(id);
    this.openItem.set(null);
  }

  toggleItem(id: string): void {
    this.openItem.update(current => (current === id ? null : id));
  }

  discard(): void {
    if (!confirm(`Bỏ mọi thay đổi chưa lưu ở “${SECTION_LABELS[this.tab()]}”?`)) return;
    const id = this.tab();
    const saved = this.saved[id];
    const draft = this.draft();
    if (!draft || !saved) return;
    this.draft.set({ ...draft, [id]: JSON.parse(saved) });
  }

  async save(): Promise<void> {
    const id = this.tab();
    const draft = this.draft();
    const stamp = this.stamps[id];
    if (!draft || !stamp || this.saving()) return;
    const missing = this.missingVietnamese(id);
    if (missing) {
      this.toast.error(`Chưa nhập tiếng Việt: ${missing}`);
      return;
    }
    this.saving.set(true);
    const content = clone(draft[id]);
    const res = await this.siteAdmin.save(id, content, stamp);
    this.saving.set(false);
    if (res.conflict) {
      this.toast.error('Khối này vừa được người khác lưu. Tải lại trang để xem bản mới rồi sửa lại.');
      return;
    }
    if (res.error || !res.updatedAt) {
      this.toast.error(res.error ?? 'Lưu thất bại');
      return;
    }
    this.saved[id] = stableJson(content);
    this.stamps[id] = res.updatedAt;
    this.siteContent.applySaved(id, content, res.updatedAt);
    this.toast.success(`Đã lưu: ${SECTION_LABELS[id]}`);
  }

  /** Tên mục đầu tiên còn trống tiếng Việt (trang chủ sẽ hiện ô trống) */
  private missingVietnamese(id: SiteSectionId): string | null {
    const draft = this.draft();
    if (!draft) return null;
    const empty = (t: LocalizedText) => !t.vi?.trim();
    switch (id) {
      case 'teachers': {
        const t = draft.teachers.items.find(i => empty(i.name));
        return t ? 'tên giáo viên' : null;
      }
      case 'courses': {
        const c = draft.courses.items.find(i => empty(i.title));
        return c ? 'tên khóa học' : null;
      }
      case 'gallery': {
        const c = draft.gallery.categories.find(i => empty(i.label));
        return c ? 'tên danh mục ảnh' : null;
      }
      case 'contact':
        return !draft.contact.phone.trim() ? 'hotline' : !draft.contact.email.trim() ? 'email' : null;
      default:
        return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Danh sách: thêm / xoá / đổi thứ tự (sửa thẳng trên bản nháp)
  // ---------------------------------------------------------------------------

  move<T>(list: T[], index: number, delta: -1 | 1): void {
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
  }

  remove<T>(list: T[], index: number, what: string): void {
    if (!confirm(`Xoá ${what}?`)) return;
    list.splice(index, 1);
  }

  addStat(): void {
    this.draft()?.hero.stats.push({ value: {}, label: {} });
  }

  addCredential(teacher: TeacherItem): void {
    teacher.credentials.push({});
  }

  addTeacher(): void {
    const draft = this.draft();
    if (!draft) return;
    const teacher: TeacherItem = { id: newId(), image: '', name: {}, role: {}, bio: {}, credentials: [] };
    draft.teachers.items.push(teacher);
    this.openItem.set(teacher.id);
  }

  addCourse(): void {
    const draft = this.draft();
    if (!draft) return;
    const course: CourseItem = {
      id: newId(), icon: 'certificate', title: {}, desc: {}, duration: {}, classSize: {}, objective: {}, badge: {}, detail: '',
    };
    draft.courses.items.push(course);
    this.openItem.set(course.id);
  }

  addCategory(): void {
    this.draft()?.gallery.categories.push({ id: newId(), label: {} });
  }

  categoryInUse(id: string): boolean {
    return !!this.draft()?.gallery.items.some(i => i.category === id);
  }

  addPhoto(url: string): void {
    const gallery = this.draft()?.gallery;
    if (!gallery || !url) return;
    if (gallery.categories.length === 0) {
      this.toast.error('Thêm danh mục ảnh trước');
      return;
    }
    const item: GalleryItem = { id: newId(), src: url, category: gallery.categories[0]?.id ?? '', caption: {} };
    gallery.items.push(item);
  }

  detailOptions(current: string): { value: string; label: string }[] {
    const choices = this.detailChoices();
    return choices.some(o => o.value === current) ? choices : [...choices, { value: current, label: current }];
  }

  /** Tên trên thẻ thu gọn */
  previewName(t: LocalizedText): string {
    return t.vi?.trim() || '(chưa có tên)';
  }
}
