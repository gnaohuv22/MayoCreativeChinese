import { Injectable } from '@angular/core';
import { getSupabase, sessionError, writeErrorMessage } from '../../../services/supabase.client';
import type { SiteContent, SiteSectionId } from '../../landing/models/site-content.model';

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
}
