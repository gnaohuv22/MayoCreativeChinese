import { Injectable } from '@angular/core';
import { getSupabase } from '../config/supabase.config';
import type { VocabCard } from '../models/vocab-card.model';

@Injectable({ providedIn: 'root' })
export class VocabService {
  private readonly supabase = getSupabase();

  /** Fetch tất cả từ vựng cho 1 HSK level */
  async getVocabByLevel(level: number): Promise<VocabCard[]> {
    const { data, error } = await this.supabase
      .from('vocab_cards')
      .select('*')
      .eq('hsk_level', level)
      .order('id', { ascending: true });

    if (error) {
      console.error(`Failed to fetch HSK ${level} vocab:`, error);
      return [];
    }
    return data ?? [];
  }

  /** Đếm số từ cho từng HSK level */
  async getLevelCounts(): Promise<Map<number, number>> {
    const counts = new Map<number, number>();
    for (let level = 1; level <= 9; level++) {
      const { count, error } = await this.supabase
        .from('vocab_cards')
        .select('*', { count: 'exact', head: true })
        .eq('hsk_level', level);

      if (!error && count !== null) {
        counts.set(level, count);
      } else {
        counts.set(level, 0);
      }
    }
    return counts;
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
      .upsert(cards, { onConflict: 'hanzi,hsk_level', ignoreDuplicates: false })
      .select();

    if (error) {
      errors.push(error.message);
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
  async searchVocab(query: string, level?: number): Promise<VocabCard[]> {
    let q = this.supabase
      .from('vocab_cards')
      .select('*')
      .or(`hanzi.ilike.%${query}%,pinyin.ilike.%${query}%,meaning.ilike.%${query}%`);

    if (level) {
      q = q.eq('hsk_level', level);
    }

    const { data, error } = await q.order('hsk_level').order('id').limit(200);
    if (error) {
      console.error('Search failed:', error);
      return [];
    }
    return data ?? [];
  }

  /** Lấy danh sách hanzi đã tồn tại cho 1 level (dùng cho duplicate check khi import) */
  async getExistingHanzi(level: number): Promise<Set<string>> {
    const { data, error } = await this.supabase
      .from('vocab_cards')
      .select('hanzi')
      .eq('hsk_level', level);

    if (error) return new Set();
    return new Set((data ?? []).map(r => r.hanzi));
  }
}
