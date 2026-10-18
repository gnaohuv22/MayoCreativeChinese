import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { getSupabase } from '../../../services/supabase.client';
import { SITE_SECTION_IDS, type SiteContent, type SiteSectionId } from '../models/site-content.model';

const CACHE_KEY = 'mcc_site_content';

interface CachedContent {
  content: Partial<SiteContent>;
  /** updated_at của từng khối lúc lưu cache */
  stamps: Partial<Record<SiteSectionId, string>>;
}

function readCache(): CachedContent | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedContent) : null;
  } catch {
    return null;
  }
}

function writeCache(cache: CachedContent): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Hết dung lượng / chế độ riêng tư: lần sau tải lại từ DB
  }
}

function isComplete(content: Partial<SiteContent>): content is SiteContent {
  return SITE_SECTION_IDS.every(id => content[id]);
}

/**
 * Nội dung trang chủ (public.site_sections). Hiện ngay bản cache trong trình duyệt,
 * rồi chỉ tải lại khối nào đã đổi (so updated_at) — khách quay lại chỉ tốn 1 request nhỏ.
 * Không đọc được DB → public/site-content.json (bản lúc tạo migration 028).
 */
@Injectable({ providedIn: 'root' })
export class SiteContentService {
  private readonly http = inject(HttpClient);
  private readonly cache = readCache();

  readonly content = signal<SiteContent | null>(this.cache && isComplete(this.cache.content) ? this.cache.content : null);
  private loading: Promise<void> | null = null;

  load(): Promise<void> {
    this.loading ??= this.refresh().catch(async err => {
      console.error('Không tải được nội dung trang chủ:', err);
      if (!this.content()) {
        this.content.set(await firstValueFrom(this.http.get<SiteContent>('site-content.json')));
      }
    });
    return this.loading;
  }

  /** Sau khi quản trị lưu: cập nhật luôn bản đang hiện + cache */
  applySaved(id: SiteSectionId, content: SiteContent[SiteSectionId], updatedAt: string): void {
    const cache = readCache() ?? { content: {}, stamps: {} };
    cache.content = { ...cache.content, [id]: content };
    cache.stamps = { ...cache.stamps, [id]: updatedAt };
    writeCache(cache);
    const current = this.content();
    if (current) this.content.set({ ...current, [id]: content });
  }

  private async refresh(): Promise<void> {
    const supabase = getSupabase();
    const cache = this.cache && isComplete(this.cache.content) ? this.cache : null;
    let stale: string[] = [...SITE_SECTION_IDS];

    if (cache) {
      const { data, error } = await supabase.from('site_sections').select('id, updated_at');
      if (error) throw error;
      stale = (data ?? []).filter(row => cache.stamps[row.id as SiteSectionId] !== row.updated_at).map(row => row.id);
      if (stale.length === 0) return;
    }

    const { data, error } = await supabase.from('site_sections').select('id, content, updated_at').in('id', stale);
    if (error) throw error;
    const next: CachedContent = { content: { ...cache?.content }, stamps: { ...cache?.stamps } };
    for (const row of data ?? []) {
      const id = row.id as SiteSectionId;
      next.content = { ...next.content, [id]: row.content };
      next.stamps[id] = row.updated_at;
    }
    if (!isComplete(next.content)) throw new Error('Thiếu khối nội dung trang chủ');
    writeCache(next);
    this.content.set(next.content);
  }
}
