import { Injectable } from '@angular/core';
import { db } from '../db/progress.db';
import type { CardProgress, LevelStats, HskVersion, VocabCard } from '../models/vocab-card.model';

/** Thông tin tối thiểu của 1 thẻ để tra cứu tiến độ học */
export type ProgressCardRef = Pick<VocabCard, 'id' | 'hanzi' | 'hsk_level'>;

/** Key duy nhất cho 1 thẻ trong progress map (id nếu có, fallback Hán tự + level) */
export function progressKey(card: ProgressCardRef): string {
  return card.id != null ? `id:${card.id}` : `h:${card.hanzi}_${card.hsk_level}`;
}

@Injectable({ providedIn: 'root' })
export class ProgressService {

  /** Lấy tất cả progress cho 1 HSK level, có thể lọc theo version */
  async getProgress(hskLevel: number, hskVersion?: HskVersion): Promise<CardProgress[]> {
    let items = await db.progress.where('hskLevel').equals(hskLevel).toArray();
    if (hskVersion) {
      items = items.filter(p => !p.hskVersion || p.hskVersion === hskVersion);
    }
    return items;
  }

  /**
   * Lấy progress cho 1 thẻ cụ thể.
   * Ưu tiên khớp theo cardId; nếu chưa có thì dùng bản ghi cũ (chỉ lưu hanzi) chưa gắn cardId.
   */
  async getCardProgress(card: ProgressCardRef, hskVersion?: HskVersion): Promise<CardProgress | undefined> {
    if (card.id != null) {
      const byId = await db.progress.where('cardId').equals(card.id).first();
      if (byId) return byId;
    }
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

  /** Thống kê progress cho 1 level (cần truyền totalCards từ Supabase) */
  async getLevelStats(hskLevel: number, totalCards: number, hskVersion?: HskVersion): Promise<LevelStats> {
    const progress = await this.getProgress(hskLevel, hskVersion);
    return {
      level: hskLevel,
      totalCards,
      reviewed: progress.filter(p => p.reviewCount > 0).length,
      mastered: progress.filter(p => p.confidence >= 2).length,
      bookmarked: progress.filter(p => p.bookmarked).length,
      hskVersion,
    };
  }

  /**
   * Lấy progress cho danh sách thẻ, key = progressKey(card).
   * Bản ghi cũ (chưa có cardId) chỉ được gán cho thẻ đầu tiên cùng Hán tự để tránh 2 nghĩa dùng chung tiến độ.
   */
  async getProgressForCards(cards: ProgressCardRef[], hskVersion?: HskVersion): Promise<Map<string, CardProgress>> {
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
    const all = await db.progress.toArray();
    return JSON.stringify(all, null, 2);
  }

  /** Import progress từ JSON backup */
  async importProgress(json: string): Promise<number> {
    const data: CardProgress[] = JSON.parse(json);
    // Clear existing and replace
    await db.progress.clear();
    await db.progress.bulkAdd(data.map(d => {
      const { id, ...rest } = d;
      return rest as CardProgress;
    }));
    return data.length;
  }

  /** Reset progress cho 1 level */
  async resetLevel(hskLevel: number, hskVersion?: HskVersion): Promise<void> {
    const items = await this.getProgress(hskLevel, hskVersion);
    const ids = items.map(i => i.id!).filter(Boolean);
    await db.progress.bulkDelete(ids);
  }

  /** Reset tất cả progress */
  async resetAll(): Promise<void> {
    await db.progress.clear();
  }
}
