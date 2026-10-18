import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { ToastService } from '../../../../services/toast.service';
import { SiteAdminService, type StoryFields } from '../../services/site-admin.service';
import { SiteImageFieldComponent } from '../../components/site-image-field/site-image-field';
import type { StoryBlock, StoryBlockKind, StoryResult, StoryRow } from '../../../posts/models/student-story.model';

/** Khối đang sửa: danh sách giữ dạng chữ nhiều dòng cho dễ gõ, tách dòng khi lưu */
type DraftBlock =
  | { kind: 'lead' | 'paragraph'; text: string }
  | { kind: 'list'; text: string }
  | { kind: 'results'; items: StoryResult[] };

interface Draft {
  /** null = bài mới chưa lưu */
  id: string | null;
  slug: string;
  /** Bài mới: đường dẫn tự sinh theo tiêu đề cho tới khi người dùng tự sửa */
  slugTouched: boolean;
  is_published: boolean;
  category: string;
  title: string;
  excerpt: string;
  images: { src: string; alt: string }[];
  body: DraftBlock[];
}

const BLOCK_LABELS: Record<StoryBlockKind, string> = {
  lead: 'Đoạn mở đầu',
  paragraph: 'Đoạn văn',
  list: 'Danh sách',
  results: 'Bảng kết quả',
};

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Tiêu đề tiếng Việt → đường dẫn không dấu (VD: "Học viên đạt HSK6" → "hoc-vien-dat-hsk6") */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}

function toDraft(row: StoryRow): Draft {
  return {
    id: row.id,
    slug: row.slug,
    slugTouched: true,
    is_published: row.is_published,
    category: row.category,
    title: row.title,
    excerpt: row.excerpt,
    images: row.images.map(i => ({ ...i })),
    body: row.body.map((b): DraftBlock =>
      b.kind === 'list' ? { kind: 'list', text: b.items.join('\n') }
        : b.kind === 'results' ? { kind: 'results', items: b.items.map(r => ({ ...r })) }
          : { kind: b.kind, text: b.text }),
  };
}

function toFields(draft: Draft): StoryFields {
  return {
    slug: draft.slug.trim(),
    is_published: draft.is_published,
    category: draft.category.trim(),
    title: draft.title.trim(),
    excerpt: draft.excerpt.trim(),
    images: draft.images.filter(i => i.src),
    body: draft.body
      .map((b): StoryBlock => {
        if (b.kind === 'list') return { kind: 'list', items: b.text.split('\n').map(l => l.trim()).filter(Boolean) };
        if (b.kind === 'results') {
          return {
            kind: 'results',
            items: b.items
              .filter(r => r.name.trim())
              .map(r => ({ name: r.name.trim(), level: r.level.trim(), score: r.score.trim(), ...(r.note?.trim() ? { note: r.note.trim() } : {}) })),
          };
        }
        return { kind: b.kind, text: b.text.trim() };
      })
      .filter(b => ('text' in b ? b.text : b.items.length > 0)),
  };
}

/** /admin/stories — câu chuyện học viên (quyền site.manage) */
@Component({
  selector: 'app-admin-stories',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, AppIconComponent, SiteImageFieldComponent],
  templateUrl: './admin-stories.html',
  styleUrl: './admin-stories.css',
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminStoriesComponent {
  private readonly siteAdmin = inject(SiteAdminService);
  private readonly toast = inject(ToastService);

  readonly blockKinds = Object.entries(BLOCK_LABELS).map(([kind, label]) => ({ kind: kind as StoryBlockKind, label }));
  readonly blockLabels = BLOCK_LABELS;

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly rows = signal<StoryRow[]>([]);
  readonly saving = signal(false);
  readonly reordering = signal(false);

  /** Bài đang mở (các ô nhập sửa thẳng vào object bên trong) */
  readonly draft = signal<Draft | null>(null);
  private savedSnapshot = '';

  readonly categories = computed(() => [...new Set(this.rows().map(r => r.category).filter(Boolean))]);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    const { rows, error } = await this.siteAdmin.listPosts();
    this.loading.set(false);
    if (error || !rows) {
      this.loadError.set(error ?? 'Không có dữ liệu');
      return;
    }
    this.rows.set(rows);
  }

  isDirty(): boolean {
    const draft = this.draft();
    return !!draft && JSON.stringify(toFields(draft)) !== this.savedSnapshot;
  }

  confirmLeave(): boolean {
    return !this.isDirty() || confirm('Có thay đổi chưa lưu. Rời trang và bỏ các thay đổi này?');
  }

  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.isDirty()) event.preventDefault();
  }

  private openDraft(draft: Draft | null): void {
    this.draft.set(draft);
    this.savedSnapshot = draft ? JSON.stringify(toFields(draft)) : '';
  }

  edit(row: StoryRow): void {
    if (this.draft()?.id === row.id) {
      if (this.confirmLeave()) this.openDraft(null);
      return;
    }
    if (!this.confirmLeave()) return;
    this.openDraft(toDraft(row));
  }

  addPost(): void {
    if (!this.confirmLeave()) return;
    const draft: Draft = {
      id: null, slug: '', slugTouched: false, is_published: false, category: this.categories()[0] ?? '',
      title: '', excerpt: '', images: [], body: [{ kind: 'lead', text: '' }],
    };
    this.draft.set(draft);
    // Bài mới luôn tính là chưa lưu
    this.savedSnapshot = '';
  }

  close(): void {
    if (this.confirmLeave()) this.openDraft(null);
  }

  // ---------------------------------------------------------------------------
  // Ô nhập
  // ---------------------------------------------------------------------------

  setTitle(draft: Draft, title: string): void {
    draft.title = title;
    if (!draft.slugTouched) draft.slug = slugify(title);
  }

  setSlug(draft: Draft, slug: string): void {
    draft.slug = slug;
    draft.slugTouched = true;
  }

  slugValid(slug: string): boolean {
    return SLUG_PATTERN.test(slug.trim());
  }

  addImage(draft: Draft, url: string): void {
    if (!url) return;
    draft.images.push({ src: url, alt: `${draft.title.trim() || 'Câu chuyện học viên MCC'} — ảnh ${draft.images.length + 1}` });
  }

  addBlock(draft: Draft, kind: StoryBlockKind): void {
    draft.body.push(kind === 'results' ? { kind, items: [{ name: '', level: '', score: '' }] } : { kind, text: '' });
  }

  addResult(block: { items: StoryResult[] }): void {
    block.items.push({ name: '', level: '', score: '' });
  }

  move<T>(list: T[], index: number, delta: -1 | 1): void {
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
  }

  remove<T>(list: T[], index: number, what: string): void {
    if (!confirm(`Xoá ${what}?`)) return;
    list.splice(index, 1);
  }

  // ---------------------------------------------------------------------------
  // Lưu / xoá / đổi thứ tự
  // ---------------------------------------------------------------------------

  async save(): Promise<void> {
    const draft = this.draft();
    if (!draft || this.saving()) return;
    const fields = toFields(draft);
    if (!fields.title) return this.toast.error('Chưa nhập tiêu đề');
    if (!this.slugValid(fields.slug)) return this.toast.error('Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang');
    if (fields.is_published && fields.images.length === 0) return this.toast.error('Bài xuất bản cần ít nhất 1 ảnh (ảnh bìa)');

    this.saving.set(true);
    const existing = draft.id ? this.rows().find(r => r.id === draft.id) : null;
    const res = existing
      ? await this.siteAdmin.updatePost(existing.id, fields, existing.updated_at)
      : await this.siteAdmin.createPost({ ...fields, sort_order: Math.max(0, ...this.rows().map(r => r.sort_order)) + 1 });
    this.saving.set(false);

    if ('conflict' in res && res.conflict) {
      this.toast.error('Bài này vừa được người khác lưu. Tải lại trang để xem bản mới rồi sửa lại.');
      return;
    }
    if (res.error || !res.row) {
      this.toast.error(res.error ?? 'Lưu thất bại');
      return;
    }
    const row = res.row;
    this.rows.update(rows => (existing ? rows.map(r => (r.id === row.id ? row : r)) : [...rows, row]));
    this.openDraft(toDraft(row));
    this.toast.success(`Đã lưu: ${row.title}`);
  }

  async deletePost(row: StoryRow): Promise<void> {
    if (!confirm(`Xoá hẳn bài “${row.title}”? Không khôi phục được.`)) return;
    const { error } = await this.siteAdmin.deletePost(row.id);
    if (error) {
      this.toast.error(error);
      return;
    }
    this.rows.update(rows => rows.filter(r => r.id !== row.id));
    if (this.draft()?.id === row.id) this.openDraft(null);
    this.toast.success('Đã xoá bài');
  }

  async movePost(index: number, delta: -1 | 1): Promise<void> {
    const rows = [...this.rows()];
    const target = index + delta;
    if (target < 0 || target >= rows.length || this.reordering()) return;
    [rows[index], rows[target]] = [rows[target], rows[index]];
    this.reordering.set(true);
    const { stamps, error } = await this.siteAdmin.reorderPosts(rows.map(r => r.id));
    this.reordering.set(false);
    if (error || !stamps) {
      this.toast.error(error ?? 'Không đổi được thứ tự');
      return;
    }
    this.rows.set(rows.map((r, i) => ({ ...r, sort_order: i + 1, updated_at: stamps[r.id] ?? r.updated_at })));
  }
}
