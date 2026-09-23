import { Injectable } from '@angular/core';
import { db } from '../db/progress.db';
import type { CardProgress, LevelStats } from '../models/vocab-card.model';

@Injectable({ providedIn: 'root' })
export class ProgressService {

  /** Lấy tất cả progress cho 1 HSK level */
  async getProgress(hskLevel: number): Promise<CardProgress[]> {
    return db.progress.where('hskLevel').equals(hskLevel).toArray();
  }

  /** Lấy progress cho 1 thẻ cụ thể */
  async getCardProgress(hanzi: string, hskLevel: number): Promise<CardProgress | undefined> {
    return db.progress.where('[hanzi+hskLevel]').equals([hanzi, hskLevel]).first();
  }

  /** Cập nhật confidence cho 1 thẻ (upsert) */
  async updateConfidence(hanzi: string, hskLevel: number, confidence: 0 | 1 | 2 | 3): Promise<void> {
    const existing = await this.getCardProgress(hanzi, hskLevel);
    if (existing) {
      await db.progress.update(existing.id!, {
        confidence,
        reviewCount: existing.reviewCount + 1,
        lastReviewed: Date.now(),
      });
    } else {
      await db.progress.add({
        hanzi,
        hskLevel,
        confidence,
        reviewCount: 1,
        lastReviewed: Date.now(),
        bookmarked: false,
      });
    }
  }

  /** Toggle bookmark cho 1 thẻ (upsert) */
  async toggleBookmark(hanzi: string, hskLevel: number): Promise<boolean> {
    const existing = await this.getCardProgress(hanzi, hskLevel);
    if (existing) {
      const newVal = !existing.bookmarked;
      await db.progress.update(existing.id!, { bookmarked: newVal });
      return newVal;
    } else {
      await db.progress.add({
        hanzi,
        hskLevel,
        confidence: 0,
        reviewCount: 0,
        bookmarked: true,
      });
      return true;
    }
  }

  /** Thống kê progress cho 1 level (cần truyền totalCards từ Supabase) */
  async getLevelStats(hskLevel: number, totalCards: number): Promise<LevelStats> {
    const progress = await this.getProgress(hskLevel);
    return {
      level: hskLevel,
      totalCards,
      reviewed: progress.filter(p => p.reviewCount > 0).length,
      mastered: progress.filter(p => p.confidence >= 2).length,
      bookmarked: progress.filter(p => p.bookmarked).length,
    };
  }

  /** Lấy progress map cho 1 level (hanzi → CardProgress) */
  async getProgressMap(hskLevel: number): Promise<Map<string, CardProgress>> {
    const progress = await this.getProgress(hskLevel);
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
  async resetLevel(hskLevel: number): Promise<void> {
    await db.progress.where('hskLevel').equals(hskLevel).delete();
  }

  /** Reset tất cả progress */
  async resetAll(): Promise<void> {
    await db.progress.clear();
  }
}
