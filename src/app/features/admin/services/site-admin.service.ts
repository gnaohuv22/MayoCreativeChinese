import { Injectable } from '@angular/core';
import { getSupabase, sessionError, writeErrorMessage } from '../../../services/supabase.client';
import type { SiteContent, SiteSectionId } from '../../landing/models/site-content.model';
import type { StoryRow } from '../../posts/models/student-story.model';
import type { CourseRow } from '../pages/admin-courses/course-draft';

/** Cột sửa được của site_courses (migration 031) — slug cố định sau khi tạo */
export type CourseFields = Pick<CourseRow, 'name' | 'is_published' | 'content'>;
const COURSE_COLUMNS = 'id, slug, sort_order, is_published, name, content, updated_at';

/** Cột người dùng sửa được của site_posts (migration 030) */
export type StoryFields = Omit<StoryRow, 'id' | 'updated_at' | 'sort_order'>;
const STORY_COLUMNS = 'id, slug, sort_order, is_published, category, title, excerpt, images, body, updated_at';

export interface SiteSectionRow<K extends SiteSectionId = SiteSectionId> {
  id: K;
  content: SiteContent[K];
  updated_at: string;
}

/** Cạnh dài tối đa của ảnh tải lên (px) — ảnh trang chủ không cần lớn hơn */
const MAX_IMAGE_EDGE = 1600;

/** File gốc lớn hơn mức này thì từ chối luôn (ảnh điện thoại thường < 15 MB) */
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
/** Giới hạn của bucket site-media (028) */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Thu nhỏ + chuyển WebP để trang chủ tải nhanh. Safari không mã hoá được WebP → JPEG từ cùng
 * ảnh đã thu nhỏ; chỉ khi trình duyệt không đọc được ảnh (VD: HEIC) mới giữ file gốc.
 */
async function shrinkImage(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const encode = (type: string) => new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, 0.85));
  const webp = await encode('image/webp');
  if (webp?.type === 'image/webp') return webp;
  return (await encode('image/jpeg')) ?? file;
}

/** Sửa nội dung trang chủ (public.site_sections, quyền site.manage — migration 028) */
@Injectable({ providedIn: 'root' })
export class SiteAdminService {
  private readonly supabase = getSupabase();

  async loadAll(): Promise<{ rows?: SiteSectionRow[]; error?: string }> {
    const { data, error } = await this.supabase.from('site_sections').select('id, content, updated_at');
    if (error) return { error: error.message };
    return { rows: (data ?? []) as SiteSectionRow[] };
  }

  /**
   * Lưu 1 khối. Chỉ ghi khi updated_at còn khớp lúc tải: người khác vừa lưu thì báo conflict
   * thay vì ghi đè mất phần họ sửa.
   */
  async save<K extends SiteSectionId>(
    id: K,
    content: SiteContent[K],
    expectedUpdatedAt: string,
  ): Promise<{ updatedAt?: string; conflict?: boolean; error?: string }> {
    const lost = await sessionError();
    if (lost) return { error: lost };
    const { data, error } = await this.supabase
      .from('site_sections')
      .update({ content })
      .eq('id', id)
      .eq('updated_at', expectedUpdatedAt)
      .select('updated_at');
    if (error) return { error: writeErrorMessage(error) };
    if (!data?.length) return { conflict: true };
    return { updatedAt: data[0].updated_at };
  }

  async uploadImage(file: File, folder: string): Promise<{ url?: string; error?: string }> {
    if (!file.type.startsWith('image/')) return { error: 'File này không phải ảnh' };
    const lost = await sessionError();
    if (lost) return { error: lost };
    if (file.size > MAX_SOURCE_BYTES) return { error: 'Ảnh quá lớn (tối đa 25 MB)' };
    const blob = await shrinkImage(file);
    if (blob.size > MAX_UPLOAD_BYTES) return { error: 'Ảnh sau khi nén vẫn lớn hơn 5 MB, hãy chọn ảnh nhỏ hơn' };
    const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() ?? 'jpg').toLowerCase();
    const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const { error } = await this.supabase.storage
      .from('site-media')
      .upload(path, blob, { contentType: blob.type || file.type, cacheControl: '31536000' });
    if (error) return { error: writeErrorMessage(error) };
    return { url: this.supabase.storage.from('site-media').getPublicUrl(path).data.publicUrl };
  }

  // ---------------------------------------------------------------------------
  // Câu chuyện học viên (public.site_posts)
  // ---------------------------------------------------------------------------

  async listPosts(): Promise<{ rows?: StoryRow[]; error?: string }> {
    const { data, error } = await this.supabase.from('site_posts').select(STORY_COLUMNS).order('sort_order').order('created_at');
    if (error) return { error: error.message };
    return { rows: (data ?? []) as StoryRow[] };
  }

  async createPost(fields: StoryFields & { sort_order: number }): Promise<{ row?: StoryRow; error?: string }> {
    const lost = await sessionError();
    if (lost) return { error: lost };
    const { data, error } = await this.supabase.from('site_posts').insert(fields).select(STORY_COLUMNS).single();
    if (error) return { error: postErrorMessage(error) };
    return { row: data as StoryRow };
  }

  /** Như save(): chỉ ghi khi updated_at còn khớp, người khác vừa lưu thì báo conflict */
  async updatePost(id: string, fields: StoryFields, expectedUpdatedAt: string): Promise<{ row?: StoryRow; conflict?: boolean; error?: string }> {
    const lost = await sessionError();
    if (lost) return { error: lost };
    const { data, error } = await this.supabase
      .from('site_posts')
      .update(fields)
      .eq('id', id)
      .eq('updated_at', expectedUpdatedAt)
      .select(STORY_COLUMNS);
    if (error) return { error: postErrorMessage(error) };
    if (!data?.length) return { conflict: true };
    return { row: data[0] as StoryRow };
  }

  async deletePost(id: string): Promise<{ error?: string }> {
    const lost = await sessionError();
    if (lost) return { error: lost };
    const { error } = await this.supabase.from('site_posts').delete().eq('id', id);
    return error ? { error: writeErrorMessage(error) } : {};
  }

  /** Đổi tên chuyên mục cho mọi bài đang dùng (RPC 032: 1 transaction, 1 dòng nhật ký) */
  async renameCategory(from: string, to: string): Promise<{ error?: string }> {
    const lost = await sessionError();
    if (lost) return { error: lost };
    const { error } = await this.supabase.rpc('rename_story_category', { p_from: from, p_to: to });
    return error ? { error: writeErrorMessage(error) } : {};
  }

  /** Đánh lại thứ tự theo mảng id (RPC 032: 1 transaction, updated_at không đổi) */
  reorderPosts(ids: string[]): Promise<{ error?: string }> {
    return this.reorder('reorder_site_posts', ids);
  }

  private async reorder(fn: 'reorder_site_posts' | 'reorder_site_courses', ids: string[]): Promise<{ error?: string }> {
    const lost = await sessionError();
    if (lost) return { error: lost };
    const { error } = await this.supabase.rpc(fn, { p_ids: ids });
    return error ? { error: writeErrorMessage(error) } : {};
  }

  // ---------------------------------------------------------------------------
  // Trang chi tiết khóa học (public.site_courses)
  // ---------------------------------------------------------------------------

  async listCourses(): Promise<{ rows?: CourseRow[]; error?: string }> {
    const { data, error } = await this.supabase.from('site_courses').select(COURSE_COLUMNS).order('sort_order').order('created_at');
    if (error) return { error: error.message };
    return { rows: (data ?? []) as CourseRow[] };
  }

  async createCourse(fields: CourseFields & { slug: string; sort_order: number }): Promise<{ row?: CourseRow; error?: string }> {
    const lost = await sessionError();
    if (lost) return { error: lost };
    const { data, error } = await this.supabase.from('site_courses').insert(fields).select(COURSE_COLUMNS).single();
    if (error) return { error: postErrorMessage(error) };
    return { row: data as CourseRow };
  }

  async updateCourse(id: string, fields: CourseFields, expectedUpdatedAt: string): Promise<{ row?: CourseRow; conflict?: boolean; error?: string }> {
    const lost = await sessionError();
    if (lost) return { error: lost };
    const { data, error } = await this.supabase
      .from('site_courses')
      .update(fields)
      .eq('id', id)
      .eq('updated_at', expectedUpdatedAt)
      .select(COURSE_COLUMNS);
    if (error) return { error: writeErrorMessage(error) };
    if (!data?.length) return { conflict: true };
    return { row: data[0] as CourseRow };
  }

  async deleteCourse(id: string): Promise<{ error?: string }> {
    const lost = await sessionError();
    if (lost) return { error: lost };
    const { error } = await this.supabase.from('site_courses').delete().eq('id', id);
    return error ? { error: writeErrorMessage(error) } : {};
  }

  reorderCourses(ids: string[]): Promise<{ error?: string }> {
    return this.reorder('reorder_site_courses', ids);
  }
}

/** Trùng đường dẫn (unique slug) → câu dễ hiểu */
function postErrorMessage(error: { code?: string; message: string }): string {
  if (error.code === '23505') return 'Đường dẫn này đã có bài khác dùng';
  if (error.code === '23514') return 'Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang';
  return writeErrorMessage(error);
}
