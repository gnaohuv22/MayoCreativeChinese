import { Injectable } from '@angular/core';
import { getSupabase } from '../../../services/supabase.client';
import type { CardProgress, HskVersion } from '../models/vocab-card.model';

interface ProgressRow {
  student_id?: string;
  card_id: number;
  hsk_level: number;
  hsk_version: string | null;
  confidence: number;
  review_count: number;
  bookmarked: boolean;
  last_reviewed: string | null;
}

/** Gom các lần chấm thẻ rồi ghi 1 lần — cả lớp dùng chung 1 IP, tránh vượt giới hạn request / phút */
const FLUSH_DELAY_MS = 4000;

function toProgress(row: ProgressRow, hanzi = ''): CardProgress {
  return {
    cardId: row.card_id,
    hanzi,
    hskLevel: row.hsk_level,
    hskVersion: (row.hsk_version as HskVersion | null) ?? undefined,
    confidence: row.confidence as CardProgress['confidence'],
    reviewCount: row.review_count,
    lastReviewed: row.last_reviewed ? Date.parse(row.last_reviewed) : undefined,
    bookmarked: row.bookmarked,
  };
}

function toRow(studentId: string, p: CardProgress): ProgressRow & { student_id: string } {
  return {
    student_id: studentId,
    card_id: p.cardId!,
    hsk_level: p.hskLevel,
    hsk_version: p.hskVersion ?? null,
    confidence: p.confidence,
    review_count: p.reviewCount,
    bookmarked: p.bookmarked,
    last_reviewed: p.lastReviewed ? new Date(p.lastReviewed).toISOString() : null,
  };
}

/**
 * Tiến độ flashcard của học viên lưu trên server (bảng student_card_progress, migration 019).
 * Đọc toàn bộ 1 lần vào bộ nhớ, ghi gom theo lô. Chỉ dùng khi đang đăng nhập tài khoản học viên.
 */
@Injectable({ providedIn: 'root' })
export class RemoteProgressStore {
  private readonly supabase = getSupabase();
  private studentId: string | null = null;
  private cache: Promise<Map<number, CardProgress>> | null = null;
  private readonly pending = new Map<number, CardProgress>();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Rời trang / chuyển tab → ghi ngay phần còn chờ
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void this.flush();
    });
  }

  /** Mọi tiến độ của học viên, key = card_id */
  async all(studentId: string): Promise<Map<number, CardProgress>> {
    if (this.studentId !== studentId) {
      this.pending.clear();
      this.studentId = studentId;
      this.cache = null;
    }
    this.cache ??= this.load().catch(err => {
      this.cache = null;
      throw err;
    });
    return this.cache;
  }

  private async load(): Promise<Map<number, CardProgress>> {
    const map = new Map<number, CardProgress>();
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await this.supabase
        .from('student_card_progress')
        .select('card_id, hsk_level, hsk_version, confidence, review_count, bookmarked, last_reviewed')
        .order('card_id')
        .range(from, from + PAGE - 1);
      if (error) throw new Error(error.message);
      for (const row of (data ?? []) as ProgressRow[]) map.set(row.card_id, toProgress(row));
      if (!data || data.length < PAGE) break;
    }
    return map;
  }

  /** Cập nhật bộ nhớ ngay, ghi server sau (gom lô) */
  async save(studentId: string, progress: CardProgress): Promise<void> {
    if (progress.cardId == null) return;
    const map = await this.all(studentId);
    map.set(progress.cardId, progress);
    this.pending.set(progress.cardId, progress);
    if (this.pending.size >= 100) {
      await this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => void this.flush(), FLUSH_DELAY_MS);
    }
  }

  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    const studentId = this.studentId;
    if (!studentId || this.pending.size === 0) return;
    const batch = [...this.pending.values()];
    this.pending.clear();
    const { error } = await this.supabase.from('student_card_progress').upsert(batch.map(p => toRow(studentId, p)));
    if (error) {
      console.error('Lưu tiến độ flashcard thất bại:', error);
      // Giữ lại để lần sau ghi lại (trừ khi đã có bản mới hơn)
      for (const p of batch) if (!this.pending.has(p.cardId!)) this.pending.set(p.cardId!, p);
      this.flushTimer ??= setTimeout(() => void this.flush(), FLUSH_DELAY_MS * 4);
    }
  }

  /** Thay toàn bộ tiến độ (khôi phục từ file, xoá hết) */
  async replaceAll(studentId: string, records: CardProgress[]): Promise<number> {
    this.pending.clear();
    const rows = records.filter(r => r.cardId != null).map(r => toRow(studentId, r));
    const del = await this.supabase.from('student_card_progress').delete().eq('student_id', studentId);
    if (del.error) throw new Error(del.error.message);
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await this.supabase.from('student_card_progress').upsert(rows.slice(i, i + 500));
      if (error) throw new Error(error.message);
    }
    this.cache = null;
    return rows.length;
  }

  /**
   * Gộp tiến độ trên máy (IndexedDB) vào tài khoản: thẻ chưa có trên tài khoản thì thêm,
   * thẻ đã có thì giữ bản ôn nhiều lần hơn. Trả về số thẻ được ghi.
   */
  async merge(studentId: string, local: CardProgress[]): Promise<number> {
    const map = await this.all(studentId);
    const rows: CardProgress[] = [];
    for (const p of local) {
      if (p.cardId == null) continue;
      const existing = map.get(p.cardId);
      if (existing && existing.reviewCount >= p.reviewCount && (existing.bookmarked || !p.bookmarked)) continue;
      const merged: CardProgress = existing
        ? { ...(existing.reviewCount >= p.reviewCount ? existing : p), bookmarked: existing.bookmarked || p.bookmarked }
        : p;
      rows.push(merged);
    }
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await this.supabase.from('student_card_progress').upsert(rows.slice(i, i + 500).map(r => toRow(studentId, r)));
      if (error) throw new Error(error.message);
    }
    for (const r of rows) map.set(r.cardId!, r);
    return rows.length;
  }
}
