import { Injectable, signal } from '@angular/core';
import { getSupabase } from '../../../services/supabase.client';
import type { CourseDetail } from '../models/course-detail.model';

export interface CourseName {
  slug: string;
  name: string;
  is_published: boolean;
  /** Tab đối tượng (VD: Trẻ em | Người lớn) — thẻ khóa học trên trang chủ có thể mở sẵn 1 tab */
  audiences: string[] | null;
}

/** Trang chi tiết khóa học (public.site_courses, migration 031) */
@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly supabase = getSupabase();

  /**
   * slug + tên theo thứ tự, kể cả khóa đang ẩn (lớp học vẫn gắn khóa đã ẩn) — RPC site_course_names (032),
   * chỉ cho tài khoản đã đăng nhập. null = chưa tải xong
   */
  readonly names = signal<CourseName[] | null>(null);
  private loadingNames: Promise<void> | null = null;

  loadNames(): Promise<void> {
    this.loadingNames ??= (async () => {
      const { data, error } = await this.supabase.rpc('site_course_names');
      if (error) {
        console.error('Không tải được danh sách khóa học:', error);
        this.loadingNames = null;
        this.names.set([]);
        return;
      }
      this.names.set((data ?? []) as CourseName[]);
    })();
    return this.loadingNames;
  }

  /** Tải lại sau khi quản trị thêm / sửa / xoá khóa (dropdown ở /admin/site, form lớp học) */
  refreshNames(): void {
    this.loadingNames = null;
    void this.loadNames();
  }

  nameOf(slug: string | null | undefined): string {
    if (!slug) return '';
    // Chưa tải xong / khóa đã xoá: hiện slug còn hơn để trống
    return this.names()?.find(c => c.slug === slug)?.name || slug;
  }

  /** Khóa đã xuất bản theo slug; null = không có / đang ẩn; lỗi mạng / DB thì ném lỗi */
  async get(slug: string): Promise<CourseDetail | null> {
    const { data, error } = await this.supabase
      .from('site_courses')
      .select('slug, name, content')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...(data.content as Omit<CourseDetail, 'slug' | 'name'>), slug: data.slug, name: data.name };
  }
}
