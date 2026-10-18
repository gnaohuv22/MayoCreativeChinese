import { Injectable, signal } from '@angular/core';
import { getSupabase } from '../../../services/supabase.client';
import type { CourseDetail } from '../models/course-detail.model';

export interface CourseName {
  slug: string;
  name: string;
  /** Tab đối tượng (VD: Trẻ em | Người lớn) — thẻ khóa học trên trang chủ có thể mở sẵn 1 tab */
  audiences: string[] | null;
}

/** Trang chi tiết khóa học (public.site_courses, migration 031) */
@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly supabase = getSupabase();

  /** slug + tên theo thứ tự (chọn khóa cho lớp học, link từ thẻ khóa học); null = chưa tải xong */
  readonly names = signal<CourseName[] | null>(null);
  private loadingNames: Promise<void> | null = null;

  loadNames(): Promise<void> {
    this.loadingNames ??= (async () => {
      const { data, error } = await this.supabase.from('site_courses').select('slug, name, audiences:content->audiences').order('sort_order').order('created_at');
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

  nameOf(slug: string | null | undefined): string {
    return (slug && this.names()?.find(c => c.slug === slug)?.name) || '';
  }

  /** Khóa đã xuất bản theo slug; null = không có / đang ẩn */
  async get(slug: string): Promise<CourseDetail | null> {
    const { data, error } = await this.supabase
      .from('site_courses')
      .select('slug, name, content')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();
    if (error || !data) return null;
    return { ...(data.content as Omit<CourseDetail, 'slug' | 'name'>), slug: data.slug, name: data.name };
  }
}
