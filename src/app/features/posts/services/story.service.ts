import { Injectable, signal } from '@angular/core';
import { getSupabase } from '../../../services/supabase.client';
import { EMPTY_IMAGE, type StoryImage, type StorySummary, type StudentStory } from '../models/student-story.model';

/** Câu chuyện học viên đã xuất bản (public.site_posts, migration 030) */
@Injectable({ providedIn: 'root' })
export class StoryService {
  private readonly supabase = getSupabase();

  /** Danh sách thẻ bài theo thứ tự; null = chưa tải xong */
  readonly summaries = signal<StorySummary[] | null>(null);
  private loading: Promise<void> | null = null;

  loadSummaries(): Promise<void> {
    this.loading ??= (async () => {
      const { data, error } = await this.supabase
        .from('site_posts')
        .select('slug, category, title, excerpt, cover:images->0')
        .eq('is_published', true)
        .order('sort_order')
        .order('created_at');
      if (error) {
        console.error('Không tải được câu chuyện học viên:', error);
        this.loading = null;
        this.summaries.set([]);
        return;
      }
      this.summaries.set(
        (data ?? []).map(row => ({ ...row, cover: (row.cover as StoryImage | null) ?? EMPTY_IMAGE }) as StorySummary),
      );
    })();
    return this.loading;
  }

  /** Bài đầy đủ theo slug; null = không có / chưa xuất bản; lỗi mạng / DB thì ném lỗi */
  async get(slug: string): Promise<StudentStory | null> {
    const { data, error } = await this.supabase
      .from('site_posts')
      .select('slug, category, title, excerpt, images, body')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const images = data.images as StoryImage[];
    return { ...data, images, cover: images[0] ?? EMPTY_IMAGE } as StudentStory;
  }
}
