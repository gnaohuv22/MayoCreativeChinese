import { Injectable } from '@angular/core';
import { getSupabase } from '../config/supabase.config';
import type { VocabCard, HskVersion, LessonInfo } from '../models/vocab-card.model';

@Injectable({ providedIn: 'root' })
export class VocabService {
  private readonly supabase = getSupabase();

  /** Fetch tất cả từ vựng cho 1 HSK level, có thể lọc theo phiên bản (2.0 / 3.0) */
  async getVocabByLevel(level: number, version?: HskVersion): Promise<VocabCard[]> {
    let query = this.supabase
      .from('vocab_cards')
      .select('*')
      .eq('hsk_level', level);

    if (version) {
      query = query.eq('hsk_version', version);
    }

    const { data, error } = await query.order('id', { ascending: true });

    if (error) {
      console.error(`Failed to fetch HSK ${level} (version: ${version ?? 'all'}) vocab:`, error);
      return [];
    }
    return data ?? [];
  }

  /** Fetch từ vựng theo Level và Phiên bản */
  async getVocabByLevelAndVersion(level: number, version: HskVersion): Promise<VocabCard[]> {
    return this.getVocabByLevel(level, version);
  }

  /** Fetch từ vựng cho 1 bài học cụ thể (HSK 3.0) */
  async getVocabByLesson(level: number, version: HskVersion, lessonNumber: number): Promise<VocabCard[]> {
    const { data, error } = await this.supabase
      .from('vocab_cards')
      .select('*')
      .eq('hsk_level', level)
      .eq('hsk_version', version)
      .eq('lesson_number', lessonNumber)
      .order('id', { ascending: true });

    if (error) {
      console.error(`Failed to fetch HSK ${level} Lesson ${lessonNumber}:`, error);
      return [];
    }
    return data ?? [];
  }

  /** Lấy danh sách các bài học (lessons) của 1 level HSK 3.0 */
  async getLessonsForLevel(level: number, version: HskVersion = '3.0'): Promise<LessonInfo[]> {
    const cards = await this.getVocabByLevel(level, version);
    if (!cards || cards.length === 0) return [];

    const lessonMap = new Map<number, { title: string; count: number }>();
    let unassignedCards = 0;

    for (const card of cards) {
      if (card.lesson_number != null && card.lesson_number > 0) {
        const existing = lessonMap.get(card.lesson_number);
        if (existing) {
          existing.count++;
          if (!existing.title && card.lesson_title) {
            existing.title = card.lesson_title;
          }
        } else {
          lessonMap.set(card.lesson_number, {
            title: card.lesson_title || `Bài ${card.lesson_number}`,
            count: 1,
          });
        }
      } else {
        unassignedCards++;
      }
    }

    const lessons: LessonInfo[] = [];
    const sortedLessonNumbers = Array.from(lessonMap.keys()).sort((a, b) => a - b);

    for (const num of sortedLessonNumbers) {
      const info = lessonMap.get(num)!;
      lessons.push({
        lessonNumber: num,
        lessonTitle: info.title,
        wordCount: info.count,
      });
    }

    // Nếu các thẻ chưa có lesson_number, tự động nhóm thành các bài mẫu (ví dụ mỗi bài 15-20 từ)
    // để UI HSK 3.0 theo bài luôn sẵn sàng hoạt động ngay cả với dataset ban đầu
    if (lessons.length === 0 && cards.length > 0) {
      const WORDS_PER_LESSON = 15;
      const totalLessons = Math.ceil(cards.length / WORDS_PER_LESSON);
      for (let i = 1; i <= totalLessons; i++) {
        const start = (i - 1) * WORDS_PER_LESSON;
        const end = Math.min(start + WORDS_PER_LESSON, cards.length);
        lessons.push({
          lessonNumber: i,
          lessonTitle: `Bài ${i}: Từ vựng phần ${i}`,
          wordCount: end - start,
        });
      }
    } else if (unassignedCards > 0) {
      lessons.push({
        lessonNumber: 0,
        lessonTitle: 'Từ vựng bổ sung / Chưa phân bài',
        wordCount: unassignedCards,
      });
    }

    return lessons;
  }

  /** Lấy từ vựng bổ sung từ HSK 2.0 lên HSK 3.0 */
  async getSupplementVocab(level: number): Promise<VocabCard[]> {
    const [cardsV2, cardsV3] = await Promise.all([
      this.getVocabByLevel(level, '2.0'),
      this.getVocabByLevel(level, '3.0'),
    ]);

    const v2Hanzi = new Set(cardsV2.map(c => c.hanzi.trim()));
    // Những từ có trong HSK 3.0 nhưng chưa có trong HSK 2.0
    const supplement = cardsV3.filter(c => !v2Hanzi.has(c.hanzi.trim()));
    return supplement;
  }

  /** Đếm số từ cho từng HSK level (tùy chọn theo version) */
  async getLevelCounts(version?: HskVersion): Promise<Map<number, number>> {
    const counts = new Map<number, number>();
    const maxLevel = version === '2.0' ? 6 : 9;

    for (let level = 1; level <= maxLevel; level++) {
      let query = this.supabase
        .from('vocab_cards')
        .select('*', { count: 'exact', head: true })
        .eq('hsk_level', level);

      if (version) {
        query = query.eq('hsk_version', version);
      }

      const { count, error } = await query;

      if (!error && count !== null) {
        counts.set(level, count);
      } else {
        counts.set(level, 0);
      }
    }
    return counts;
  }

  /** Truy vấn danh sách từ vựng có phân trang cho Table View */
  async getVocabPaginated(params: {
    level?: number;
    version?: HskVersion;
    lessonNumber?: number;
    query?: string;
    page: number;
    pageSize: number;
  }): Promise<{ data: VocabCard[]; total: number }> {
    const { level, version, lessonNumber, query, page, pageSize } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = this.supabase
      .from('vocab_cards')
      .select('*', { count: 'exact' });

    if (level && level > 0) {
      q = q.eq('hsk_level', level);
    }
    if (version) {
      q = q.eq('hsk_version', version);
    }
    if (lessonNumber != null && lessonNumber > 0) {
      q = q.eq('lesson_number', lessonNumber);
    }
    if (query && query.trim()) {
      const clean = query.trim();
      q = q.or(`hanzi.ilike.%${clean}%,pinyin.ilike.%${clean}%,meaning.ilike.%${clean}%`);
    }

    const { data, count, error } = await q
      .order('hsk_level', { ascending: true })
      .order('lesson_number', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('getVocabPaginated failed:', error);
      return { data: [], total: 0 };
    }

    return {
      data: data ?? [],
      total: count ?? 0,
    };
  }

  /** Thêm 1 từ vựng (admin/ops) */
  async addCard(card: Omit<VocabCard, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase
      .from('vocab_cards')
      .insert(card);

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: `Từ "${card.hanzi}" đã tồn tại trong HSK ${card.hsk_level}` };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  /** Thêm nhiều từ vựng (batch import) */
  async addCards(cards: Omit<VocabCard, 'id' | 'created_at' | 'updated_at'>[]): Promise<{ inserted: number; errors: string[] }> {
    const errors: string[] = [];
    let inserted = 0;

    // Use upsert to handle duplicates gracefully
    const { data, error } = await this.supabase
      .from('vocab_cards')
      .upsert(cards, { onConflict: 'hanzi,hsk_level,hsk_version', ignoreDuplicates: false })
      .select();

    if (error) {
      // Fallback nếu constraint chưa được cập nhật trong DB
      const fallback = await this.supabase
        .from('vocab_cards')
        .upsert(cards, { onConflict: 'hanzi,hsk_level', ignoreDuplicates: false })
        .select();

      if (fallback.error) {
        errors.push(fallback.error.message);
      } else {
        inserted = fallback.data?.length ?? 0;
      }
    } else {
      inserted = data?.length ?? 0;
    }

    return { inserted, errors };
  }

  /** Cập nhật 1 từ vựng (admin/ops) */
  async updateCard(id: number, changes: Partial<VocabCard>): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase
      .from('vocab_cards')
      .update(changes)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  /** Xoá 1 từ vựng (admin/ops) */
  async deleteCard(id: number): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase
      .from('vocab_cards')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  /** Xoá nhiều từ vựng (admin/ops) */
  async deleteCards(ids: number[]): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase
      .from('vocab_cards')
      .delete()
      .in('id', ids);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  /** Tìm kiếm từ vựng */
  async searchVocab(query: string, level?: number, version?: HskVersion): Promise<VocabCard[]> {
    let q = this.supabase
      .from('vocab_cards')
      .select('*')
      .or(`hanzi.ilike.%${query}%,pinyin.ilike.%${query}%,meaning.ilike.%${query}%`);

    if (level) {
      q = q.eq('hsk_level', level);
    }
    if (version) {
      q = q.eq('hsk_version', version);
    }

    const { data, error } = await q.order('hsk_level').order('id').limit(200);
    if (error) {
      console.error('Search failed:', error);
      return [];
    }
    return data ?? [];
  }

  /** Lấy danh sách hanzi đã tồn tại cho 1 level và version (dùng cho duplicate check khi import) */
  async getExistingHanzi(level: number, version?: HskVersion): Promise<Set<string>> {
    let q = this.supabase
      .from('vocab_cards')
      .select('hanzi')
      .eq('hsk_level', level);

    if (version) {
      q = q.eq('hsk_version', version);
    }

    const { data, error } = await q;
    if (error) return new Set();
    return new Set((data ?? []).map(r => r.hanzi));
  }

  /** Lấy danh sách compound keys (hanzi_level_version) để check trùng lặp chính xác */
  async getExistingVocabKeys(level?: number): Promise<Set<string>> {
    let q = this.supabase
      .from('vocab_cards')
      .select('hanzi, hsk_level, hsk_version');

    if (level && level > 0) {
      q = q.eq('hsk_level', level);
    }

    const { data, error } = await q;
    if (error) return new Set();

    return new Set(
      (data ?? []).map(r => `${r.hanzi.trim()}_${r.hsk_level}_${r.hsk_version || '2.0'}`)
    );
  }
}
