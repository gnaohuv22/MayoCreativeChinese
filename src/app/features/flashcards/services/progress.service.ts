import { Injectable, inject } from '@angular/core';
import { db } from '../db/progress.db';
import { VOCAB_COLLECTIONS, vocabWordKey } from '../models/vocab-card.model';
import type { CardProgress, LevelStats, HskVersion, VocabCard } from '../models/vocab-card.model';
import { AuthService } from '../../../services/auth.service';
import { RemoteProgressStore } from './remote-progress.store';
import { VocabService } from './vocab.service';

/** Thông tin tối thiểu của 1 thẻ để tra cứu tiến độ học (có pinyin thì dùng chung được tiến độ giữa các cấp) */
export type ProgressCardRef = Pick<VocabCard, 'id' | 'hanzi' | 'hsk_level' | 'collection'> & Partial<Pick<VocabCard, 'pinyin'>>;

/**
 * Bản ghi cũ (chưa có cardId, chỉ lưu Hán tự + cấp) có từ trước khi tách 4 bộ,
 * lúc đó chỉ bộ HSK 2.0 có dữ liệu → chỉ gán lại cho thẻ HSK 2.0.
 */
function acceptsLegacy(card: ProgressCardRef): boolean {
  return !card.collection || card.collection === 'hsk2';
}

/** Thẻ thuộc bộ tích luỹ: cùng 1 từ có mặt lại ở mọi cấp sau, mỗi cấp 1 id riêng */
function sharesAcrossLevels(card: ProgressCardRef): boolean {
  return card.id != null && !!card.pinyin && !!VOCAB_COLLECTIONS[card.collection ?? 'hsk2']?.cumulative;
}

/** Tiến độ đang hiện cho thẻ là của cùng từ ở cấp khác (chưa có bản ghi riêng) */
function isSharedProgress(card: ProgressCardRef, p: CardProgress | undefined): boolean {
  return p?.cardId != null && card.id != null && p.cardId !== card.id;
}

/**
 * Bộ tích luỹ (HSK 2.0): từ đã học ở cấp này tính là đã học ở các cấp khác của bộ.
 * Thẻ chưa có tiến độ riêng nhận bản ghi ôn gần nhất của cùng từ (cùng Hán tự + pinyin) ở cấp khác.
 * `wordKeys` = vocabWordKey theo cardId của các bản ghi.
 */
export function shareProgressAcrossLevels(
  cards: ProgressCardRef[],
  map: Map<string, CardProgress>,
  records: CardProgress[],
  wordKeys: Map<number, string>,
): void {
  const latest = new Map<string, CardProgress>();
  for (const p of records) {
    const key = p.cardId != null ? wordKeys.get(p.cardId) : undefined;
    if (!key) continue;
    const best = latest.get(key);
    if (!best || isNewer(p, best)) latest.set(key, p);
  }
  for (const card of cards) {
    if (!sharesAcrossLevels(card) || map.has(progressKey(card))) continue;
    const hit = latest.get(vocabWordKey({ collection: card.collection, hanzi: card.hanzi, pinyin: card.pinyin! }));
    if (hit) map.set(progressKey(card), { ...hit, hanzi: card.hanzi });
  }
}

function isNewer(a: CardProgress, b: CardProgress): boolean {
  const at = a.lastReviewed ?? 0;
  const bt = b.lastReviewed ?? 0;
  return at !== bt ? at > bt : a.reviewCount > b.reviewCount;
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
  private readonly vocab = inject(VocabService);

  /** id học viên đang đăng nhập (null = dùng IndexedDB) */
  private async studentId(): Promise<string | null> {
    await this.auth.ready;
    return this.auth.isLearner() ? this.auth.userId() : null;
  }

  /** Đã có tiến độ nào chưa (chưa có thì trang chọn cấp khỏi tải danh sách từ để tính %) */
  async hasAnyProgress(): Promise<boolean> {
    return (await this.allProgress()).length > 0;
  }

  /** Toàn bộ tiến độ của người đang học (tài khoản, hoặc trên máy này khi chưa đăng nhập) */
  async allProgress(): Promise<CardProgress[]> {
    const sid = await this.studentId();
    return sid ? [...(await this.remote.all(sid)).values()] : db.progress.toArray();
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
    const own = await this.getOwnCardProgress(card, hskVersion);
    if (own || !sharesAcrossLevels(card)) return own;
    return (await this.addSharedProgress([card], new Map())).get(progressKey(card));
  }

  /** Thẻ chưa có tiến độ riêng nhận tiến độ của cùng từ ở cấp khác (bộ tích luỹ) */
  private async addSharedProgress(cards: ProgressCardRef[], map: Map<string, CardProgress>): Promise<Map<string, CardProgress>> {
    const pending = cards.filter(c => sharesAcrossLevels(c) && !map.has(progressKey(c)));
    if (pending.length === 0) return map;
    const versions = new Set(pending.map(c => VOCAB_COLLECTIONS[c.collection ?? 'hsk2'].version));
    const sid = await this.studentId();
    const records = (sid ? [...(await this.remote.all(sid)).values()] : await db.progress.toArray())
      .filter(p => p.cardId != null && (!p.hskVersion || versions.has(p.hskVersion)));
    if (records.length === 0) return map;
    const wordKeys = await this.vocab.getWordKeys(records.map(p => p.cardId!));
    shareProgressAcrossLevels(pending, map, records, wordKeys);
    return map;
  }

  private async getOwnCardProgress(card: ProgressCardRef, hskVersion?: HskVersion): Promise<CardProgress | undefined> {
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
    if (existing && !isSharedProgress(card, existing)) {
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
        reviewCount: (existing?.reviewCount ?? 0) + 1,
        lastReviewed: Date.now(),
        bookmarked: existing?.bookmarked ?? false,
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
    if (existing && !isSharedProgress(card, existing)) {
      const newVal = !existing.bookmarked;
      await db.progress.update(existing.id!, {
        bookmarked: newVal,
        cardId: card.id ?? existing.cardId,
        hskVersion: hskVersion ?? existing.hskVersion,
      });
      return newVal;
    } else {
      const bookmarked = !(existing?.bookmarked ?? false);
      await db.progress.add({
        cardId: card.id,
        hanzi: card.hanzi,
        hskLevel: card.hsk_level,
        hskVersion,
        confidence: existing?.confidence ?? 0,
        reviewCount: existing?.reviewCount ?? 0,
        lastReviewed: existing?.lastReviewed,
        bookmarked,
      });
      return bookmarked;
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
      return this.addSharedProgress(cards, map);
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
    return this.addSharedProgress(cards, map);
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
