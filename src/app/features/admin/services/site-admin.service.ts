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

/** Thu nhỏ + chuyển WebP để trang chủ tải nhanh; trình duyệt không hỗ trợ thì giữ file gốc */
async function toWebp(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.85));
    return blob?.type === 'image/webp' ? blob : file;
  } catch {
    return file;
  }
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
    const blob = await toWebp(file);
    const ext = blob.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() ?? 'jpg').toLowerCase();
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

  /** Đổi tên chuyên mục cho mọi bài đang dùng; trả về updated_at mới theo id bài */
  async renameCategory(from: string, to: string): Promise<{ stamps?: Record<string, string>; error?: string }> {
    const lost = await sessionError();
    if (lost) return { error: lost };
    const { data, error } = await this.supabase.from('site_posts').update({ category: to }).eq('category', from).select('id, updated_at');
    if (error) return { error: writeErrorMessage(error) };
    return { stamps: Object.fromEntries((data ?? []).map(r => [r.id, r.updated_at])) };
  }

  /** Đánh lại thứ tự theo mảng id; trả về updated_at mới của từng bài (trigger đổi updated_at) */
  async reorderPosts(ids: string[]): Promise<{ stamps?: Record<string, string>; error?: string }> {
    const lost = await sessionError();
    if (lost) return { error: lost };
    const results = await Promise.all(
      ids.map((id, i) => this.supabase.from('site_posts').update({ sort_order: i + 1 }).eq('id', id).select('id, updated_at').single()),
    );
    const failed = results.find(r => r.error);
    if (failed?.error) return { error: writeErrorMessage(failed.error) };
    return { stamps: Object.fromEntries(results.map(r => [r.data!.id, r.data!.updated_at])) };
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

  async reorderCourses(ids: string[]): Promise<{ stamps?: Record<string, string>; error?: string }> {
    const lost = await sessionError();
    if (lost) return { error: lost };
    const results = await Promise.all(
      ids.map((id, i) => this.supabase.from('site_courses').update({ sort_order: i + 1 }).eq('id', id).select('id, updated_at').single()),
    );
    const failed = results.find(r => r.error);
    if (failed?.error) return { error: writeErrorMessage(failed.error) };
    return { stamps: Object.fromEntries(results.map(r => [r.data!.id, r.data!.updated_at])) };
  }
}

/** Trùng đường dẫn (unique slug) → câu dễ hiểu */
function postErrorMessage(error: { code?: string; message: string }): string {
  if (error.code === '23505') return 'Đường dẫn này đã có bài khác dùng';
  if (error.code === '23514') return 'Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang';
  return writeErrorMessage(error);
}
