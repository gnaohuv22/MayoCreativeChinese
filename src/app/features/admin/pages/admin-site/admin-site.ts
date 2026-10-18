import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { I18nService, type Lang, type LocalizedText } from '../../../../services/i18n.service';
import { ToastService } from '../../../../services/toast.service';
import { SiteContentService } from '../../../landing/services/site-content.service';
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

/** Trang chi tiết khóa học có sẵn (features/courses/data/course-details.data.ts) */
const DETAIL_OPTIONS = [
  { value: '', label: 'Không có' },
  { value: 'hsk-3-0', label: 'HSK 3.0' },
  { value: 'bo-sung-hsk-2-len-3', label: 'Bổ sung HSK 2.0 lên 3.0' },
  { value: 'tieng-trung-tre-em', label: 'Tiếng Trung trẻ em' },
  { value: 'tieng-trung-tre-em?doi-tuong=nguoi-lon', label: 'Giao tiếp người lớn' },
  { value: 'gia-su', label: 'Gia sư' },
  { value: 'hsk-2-0', label: 'HSK 2.0' },
];

const newId = () => crypto.randomUUID().slice(0, 8);
const clone = <T>(value: T): T => structuredClone(value);

/** /admin/site — sửa nội dung trang chủ (quyền site.manage) */
@Component({
  selector: 'app-admin-site',
  standalone: true,
  imports: [RouterLink, AppIconComponent, LtextInputComponent, SiteImageFieldComponent],
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
      this.saved[row.id] = JSON.stringify(row.content);
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
    return !!draft && JSON.stringify(draft[id]) !== this.saved[id];
  }

  anyDirty(): boolean {
    return SITE_SECTION_IDS.some(id => this.isDirty(id));
  }

  /** Dùng cho canDeactivate trên route */
  confirmLeave(): boolean {
    return !this.anyDirty() || confirm('Có thay đổi chưa lưu. Rời trang và bỏ các thay đổi này?');
  }

  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.anyDirty()) event.preventDefault();
  }

  selectTab(id: SiteSectionId): void {
    this.tab.set(id);
    this.openItem.set(null);
  }

  toggleItem(id: string): void {
    this.openItem.update(current => (current === id ? null : id));
  }

  discard(): void {
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
    this.saved[id] = JSON.stringify(content);
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
    const item: GalleryItem = { id: newId(), src: url, category: gallery.categories[0]?.id ?? '', caption: {} };
    gallery.items.push(item);
  }

  detailOptions(current: string): { value: string; label: string }[] {
    return DETAIL_OPTIONS.some(o => o.value === current) ? DETAIL_OPTIONS : [...DETAIL_OPTIONS, { value: current, label: current }];
  }

  /** Tên trên thẻ thu gọn */
  previewName(t: LocalizedText): string {
    return t.vi?.trim() || '(chưa có tên)';
  }
}
