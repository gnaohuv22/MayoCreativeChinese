import { Injectable } from '@angular/core';
import { db } from '../db/progress.db';
import type { CardProgress, LevelStats, HskVersion } from '../models/vocab-card.model';

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

  /** Lấy progress cho 1 thẻ cụ thể */
  async getCardProgress(hanzi: string, hskLevel: number, hskVersion?: HskVersion): Promise<CardProgress | undefined> {
    const items = await db.progress.where('[hanzi+hskLevel]').equals([hanzi, hskLevel]).toArray();
    if (hskVersion) {
      return items.find(p => p.hskVersion === hskVersion) || items[0];
    }
    return items[0];
  }

  /** Cập nhật confidence cho 1 thẻ (upsert) */
  async updateConfidence(
    hanzi: string,
    hskLevel: number,
    confidence: 0 | 1 | 2 | 3,
    hskVersion?: HskVersion
  ): Promise<void> {
    const existing = await this.getCardProgress(hanzi, hskLevel, hskVersion);
    if (existing) {
      await db.progress.update(existing.id!, {
        confidence,
        hskVersion: hskVersion ?? existing.hskVersion,
        reviewCount: existing.reviewCount + 1,
        lastReviewed: Date.now(),
      });
    } else {
      await db.progress.add({
        hanzi,
        hskLevel,
        hskVersion,
        confidence,
        reviewCount: 1,
        lastReviewed: Date.now(),
        bookmarked: false,
      });
    }
  }

  /** Toggle bookmark cho 1 thẻ (upsert) */
  async toggleBookmark(hanzi: string, hskLevel: number, hskVersion?: HskVersion): Promise<boolean> {
    const existing = await this.getCardProgress(hanzi, hskLevel, hskVersion);
    if (existing) {
      const newVal = !existing.bookmarked;
      await db.progress.update(existing.id!, {
        bookmarked: newVal,
        hskVersion: hskVersion ?? existing.hskVersion,
      });
      return newVal;
    } else {
      await db.progress.add({
        hanzi,
        hskLevel,
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

  /** Lấy progress map cho 1 level (hanzi → CardProgress) */
  async getProgressMap(hskLevel: number, hskVersion?: HskVersion): Promise<Map<string, CardProgress>> {
    const progress = await this.getProgress(hskLevel, hskVersion);
    const map = new Map<string, CardProgress>();
    for (const p of progress) {
      map.set(p.hanzi, p);
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
