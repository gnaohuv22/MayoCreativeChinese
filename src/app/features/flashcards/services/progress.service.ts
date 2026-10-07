import { Injectable, inject } from '@angular/core';
import { db } from '../db/progress.db';
import type { CardProgress, LevelStats, HskVersion, VocabCard } from '../models/vocab-card.model';
import { AuthService } from '../../../services/auth.service';
import { RemoteProgressStore } from './remote-progress.store';

/** Thông tin tối thiểu của 1 thẻ để tra cứu tiến độ học */
export type ProgressCardRef = Pick<VocabCard, 'id' | 'hanzi' | 'hsk_level' | 'collection'>;

/**
 * Bản ghi cũ (chưa có cardId, chỉ lưu Hán tự + cấp) có từ trước khi tách 4 bộ,
 * lúc đó chỉ bộ HSK 2.0 có dữ liệu → chỉ gán lại cho thẻ HSK 2.0.
 */
function acceptsLegacy(card: ProgressCardRef): boolean {
  return !card.collection || card.collection === 'hsk2';
}

/** Key duy nhất cho 1 thẻ trong progress map (id nếu có, fallback Hán tự + level) */
export function progressKey(card: ProgressCardRef): string {
  return card.id != null ? `id:${card.id}` : `h:${card.hanzi}_${card.hsk_level}`;
}

/**
 * Tiến độ học flashcard. Khách / nhân sự: lưu trong trình duyệt (IndexedDB).
 * Học viên đăng nhập: lưu theo tài khoản (RemoteProgressStore) — học trên máy nào cũng giữ được,
 * và không lẫn với người khác dùng chung máy ở lớp.
 */
@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly auth = inject(AuthService);
  private readonly remote = inject(RemoteProgressStore);

  /** id học viên đang đăng nhập (null = dùng IndexedDB) */
  private async studentId(): Promise<string | null> {
    await this.auth.ready;
    return this.auth.isStudent() ? this.auth.userId() : null;
  }

  /** Học viên: có tiến độ cũ trên máy này (từ trước khi đăng nhập) để đưa lên tài khoản */
  async localRecordCount(): Promise<number> {
    return db.progress.count();
  }

  /** Học viên: gộp tiến độ trên máy vào tài khoản, rồi xoá bản trên máy */
  async uploadLocalProgress(): Promise<number> {
    const sid = await this.studentId();
    if (!sid) return 0;
    const count = await this.remote.merge(sid, await db.progress.toArray());
    await db.progress.clear();
    return count;
  }

  /** Học viên đang đăng nhập (để trang hub đổi nút sao lưu / khôi phục) */
  async isAccountBacked(): Promise<boolean> {
    return (await this.studentId()) !== null;
  }

  /**
   * Lấy progress cho 1 thẻ cụ thể.
   * Ưu tiên khớp theo cardId; nếu chưa có thì dùng bản ghi cũ (chỉ lưu hanzi) chưa gắn cardId.
   */
  async getCardProgress(card: ProgressCardRef, hskVersion?: HskVersion): Promise<CardProgress | undefined> {
    const sid = await this.studentId();
    if (sid) {
      const hit = card.id != null ? (await this.remote.all(sid)).get(card.id) : undefined;
      return hit ? { ...hit, hanzi: card.hanzi } : undefined;
    }
    if (card.id != null) {
      const byId = await db.progress.where('cardId').equals(card.id).first();
      if (byId) return byId;
    }
    if (!acceptsLegacy(card)) return undefined;
    const legacy = (await db.progress.where('[hanzi+hskLevel]').equals([card.hanzi, card.hsk_level]).toArray())
      .filter(p => p.cardId == null);
    if (hskVersion) {
      return legacy.find(p => p.hskVersion === hskVersion) || legacy.find(p => !p.hskVersion);
    }
    return legacy[0];
  }

  /** Cập nhật confidence cho 1 thẻ (upsert) */
  async updateConfidence(card: ProgressCardRef, confidence: 0 | 1 | 2 | 3, hskVersion?: HskVersion): Promise<void> {
    const existing = await this.getCardProgress(card, hskVersion);
    const sid = await this.studentId();
    if (sid) {
      await this.remote.save(sid, {
        cardId: card.id,
        hanzi: card.hanzi,
        hskLevel: card.hsk_level,
        hskVersion: hskVersion ?? existing?.hskVersion,
        confidence,
        reviewCount: (existing?.reviewCount ?? 0) + 1,
        lastReviewed: Date.now(),
        bookmarked: existing?.bookmarked ?? false,
      });
      return;
    }
    if (existing) {
      await db.progress.update(existing.id!, {
        confidence,
        cardId: card.id ?? existing.cardId,
        hskVersion: hskVersion ?? existing.hskVersion,
        reviewCount: existing.reviewCount + 1,
        lastReviewed: Date.now(),
      });
    } else {
      await db.progress.add({
        cardId: card.id,
        hanzi: card.hanzi,
        hskLevel: card.hsk_level,
        hskVersion,
        confidence,
        reviewCount: 1,
        lastReviewed: Date.now(),
        bookmarked: false,
      });
    }
  }

  /** Toggle bookmark cho 1 thẻ (upsert) */
  async toggleBookmark(card: ProgressCardRef, hskVersion?: HskVersion): Promise<boolean> {
    const existing = await this.getCardProgress(card, hskVersion);
    const sid = await this.studentId();
    if (sid) {
      const bookmarked = !(existing?.bookmarked ?? false);
      await this.remote.save(sid, {
        cardId: card.id,
        hanzi: card.hanzi,
        hskLevel: card.hsk_level,
        hskVersion: hskVersion ?? existing?.hskVersion,
        confidence: existing?.confidence ?? 0,
        reviewCount: existing?.reviewCount ?? 0,
        lastReviewed: existing?.lastReviewed,
        bookmarked,
      });
      return bookmarked;
    }
    if (existing) {
      const newVal = !existing.bookmarked;
      await db.progress.update(existing.id!, {
        bookmarked: newVal,
        cardId: card.id ?? existing.cardId,
        hskVersion: hskVersion ?? existing.hskVersion,
      });
      return newVal;
    } else {
      await db.progress.add({
        cardId: card.id,
        hanzi: card.hanzi,
        hskLevel: card.hsk_level,
        hskVersion,
        confidence: 0,
        reviewCount: 0,
        bookmarked: true,
      });
      return true;
    }
  }

  /** Thống kê tiến độ cho 1 tập thẻ */
  async getStatsForCards(cards: ProgressCardRef[]): Promise<LevelStats> {
    const progress = [...(await this.getProgressForCards(cards)).values()];
    return {
      totalCards: cards.length,
      reviewed: progress.filter(p => p.reviewCount > 0).length,
      // "Đã thuộc" = bấm nút Thuộc (3); "Biết" (2) vẫn cần ôn
      mastered: progress.filter(p => p.confidence === 3).length,
      bookmarked: progress.filter(p => p.bookmarked).length,
    };
  }

  /**
   * Lấy progress cho danh sách thẻ, key = progressKey(card).
   * Bản ghi cũ (chưa có cardId) chỉ được gán cho thẻ đầu tiên cùng Hán tự để tránh 2 nghĩa dùng chung tiến độ.
   */
  async getProgressForCards(cards: ProgressCardRef[], hskVersion?: HskVersion): Promise<Map<string, CardProgress>> {
    const sid = await this.studentId();
    if (sid) {
      const all = await this.remote.all(sid);
      const map = new Map<string, CardProgress>();
      for (const card of cards) {
        const hit = card.id != null ? all.get(card.id) : undefined;
        if (hit) map.set(progressKey(card), { ...hit, hanzi: card.hanzi });
      }
      return map;
    }
    const levels = [...new Set(cards.map(c => c.hsk_level))];
    const all = (await db.progress.where('hskLevel').anyOf(levels).toArray())
      .filter(p => !hskVersion || !p.hskVersion || p.hskVersion === hskVersion);

    const byCardId = new Map<number, CardProgress>();
    const legacy = new Map<string, CardProgress>();
    for (const p of all) {
      if (p.cardId != null) byCardId.set(p.cardId, p);
      else if (!legacy.has(`${p.hanzi}_${p.hskLevel}`)) legacy.set(`${p.hanzi}_${p.hskLevel}`, p);
    }

    const map = new Map<string, CardProgress>();
    for (const card of cards) {
      const hit = card.id != null ? byCardId.get(card.id) : undefined;
      if (hit) {
        map.set(progressKey(card), hit);
        continue;
      }
      if (!acceptsLegacy(card)) continue;
      const legacyKey = `${card.hanzi}_${card.hsk_level}`;
      const old = legacy.get(legacyKey);
      if (old) {
        map.set(progressKey(card), old);
        legacy.delete(legacyKey);
      }
    }
    return map;
  }

  /** Export toàn bộ progress dưới dạng JSON */
  async exportProgress(): Promise<string> {
    const sid = await this.studentId();
    const all = sid ? [...(await this.remote.all(sid)).values()] : await db.progress.toArray();
    return JSON.stringify(all, null, 2);
  }

  /**
   * Khôi phục progress từ file sao lưu (thay thế toàn bộ tiến độ hiện tại).
   * Kiểm tra file trước, và xoá + ghi trong 1 transaction — file lỗi không làm mất tiến độ cũ.
   * Học viên đăng nhập: thay tiến độ trên tài khoản.
   */
  async importProgress(json: string): Promise<number> {
    const records = parseProgressBackup(json);
    const sid = await this.studentId();
    if (sid) return this.remote.replaceAll(sid, records);
    await db.transaction('rw', db.progress, async () => {
      await db.progress.clear();
      await db.progress.bulkAdd(records);
    });
    return records.length;
  }

  /** Reset tất cả progress */
  async resetAll(): Promise<void> {
    const sid = await this.studentId();
    if (sid) {
      await this.remote.replaceAll(sid, []);
      return;
    }
    await db.progress.clear();
  }
}

/** Đọc file sao lưu tiến độ; ném lỗi (tiếng Việt, hiện cho học viên) nếu file không hợp lệ. Bỏ `id` để Dexie cấp mới. */
export function parseProgressBackup(json: string): CardProgress[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('File không đúng định dạng JSON.');
  }
  if (!Array.isArray(data) || !data.every(isCardProgress)) {
    throw new Error('File không phải bản sao lưu tiến độ Flashcard.');
  }
  return data.map(({ id, ...rest }) => rest);
}

function isCardProgress(x: unknown): x is CardProgress {
  const p = x as CardProgress;
  return !!p && typeof p === 'object'
    && typeof p.hanzi === 'string'
    && typeof p.hskLevel === 'number'
    && [0, 1, 2, 3].includes(p.confidence)
    && typeof p.reviewCount === 'number'
    && typeof p.bookmarked === 'boolean';
}
