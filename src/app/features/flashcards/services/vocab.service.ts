import { Injectable, inject } from '@angular/core';
import { getSupabase, sessionError, writeErrorMessage } from '../../../services/supabase.client';
import { VOCAB_COLLECTIONS, collectionLevels, parseLevelParam, vocabEntryKey, vocabHanziKey } from '../models/vocab-card.model';
import type { VocabCard, VocabCollection, VocabGroupInfo, VocabScope } from '../models/vocab-card.model';
import type { ExistingVocabKeys } from '../utils/file-parser.util';
import { NO_TOPIC_PARAM, scopeLevels } from '../utils/vocab-scope.util';
import { RequestCache } from '../../../services/request-cache';
import { AuthService } from '../../../services/auth.service';
import { contentAccess, strictestVisibility } from '../../../components/shared/visibility/content-visibility';
import type { ContentAccess, ContentVisibility } from '../../../components/shared/visibility/content-visibility';

/** Supabase trả tối đa 1000 dòng / request */
const PAGE = 1000;

const VOCAB_COLUMNS = 'id, collection, hanzi, pinyin, meaning, hsk_level, hsk_version, lesson_number, lesson_title, topic, example, example_pinyin, example_meaning';

/** RLS chặn ghi thì Supabase không báo lỗi mà chỉ trả về 0 dòng */
const NO_ROW_ERROR = 'Không tìm thấy từ hoặc bạn không có quyền thực hiện thao tác này';

/** Từ vựng hiếm khi đổi; trang quản lý xoá cache sau mỗi lần ghi */
const CACHE_TTL_MS = 30 * 60 * 1000;

/** Khoá cache theo phạm vi — null/undefined = không lọc, khác với 0 / '' (chưa phân bài / chủ đề) */
function scopeKey(scope: VocabScope): string {
  const lesson = scope.lesson == null ? '*' : scope.lesson;
  const topic = scope.topic == null ? '*' : `t:${scope.topic}`;
  return `${scope.collection}|${scope.levelParam}|${lesson}|${topic}`;
}

const TONED = 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü';
const PLAIN = 'aaaaeeeeiiiioooouuuuvvvvv';

/** Chuẩn hoá giống cột pinyin_search: chữ thường, bỏ dấu thanh, bỏ khoảng trắng, ü → v */
export function plainPinyin(text: string): string {
  return [...text.toLowerCase().normalize('NFC')]
    .map(ch => {
      const i = TONED.indexOf(ch);
      return i >= 0 ? PLAIN[i] : ch;
    })
    .join('')
    .replace(/\s+/g, '');
}

/** Mức hiển thị theo `${collection}|${hsk_level}`; không có = công khai */
export type VocabVisibilityMap = Map<string, ContentVisibility>;

/** Mức hiển thị của 1 cấp trên trang (cấp gộp 7-9 lấy mức chặt nhất) */
export function levelVisibility(map: VocabVisibilityMap, collection: VocabCollection, levelParam: string): ContentVisibility {
  return strictestVisibility(parseLevelParam(levelParam).map(l => map.get(`${collection}|${l}`) ?? 'public'));
}

export type NewVocabCard = Omit<VocabCard, 'id' | 'created_at' | 'updated_at'> & { collection: VocabCollection };

@Injectable({ providedIn: 'root' })
export class VocabService {
  private readonly supabase = getSupabase();
  private readonly cache = new RequestCache(CACHE_TTL_MS);
  private readonly auth = inject(AuthService);

  /** Mức hiển thị của mọi (bộ, cấp) đã đặt */
  async getVisibility(): Promise<VocabVisibilityMap> {
    const { map } = await this.cache.get('visibility', async () => {
      const { data, error } = await this.supabase
        .from('vocab_level_visibility')
        .select('collection, hsk_level, visibility');
      if (error) console.error('Vocab visibility query failed:', error);
      const map: VocabVisibilityMap = new Map(
        (data ?? []).map(r => [`${r.collection}|${r.hsk_level}`, r.visibility as ContentVisibility]),
      );
      return { map, ok: !error };
    }, r => r.ok);
    return new Map(map);
  }

  /** Hàm tra quyền xem của người đang xem cho từng cấp (trang học viên) */
  async accessResolver(): Promise<(collection: VocabCollection, levelParam: string) => ContentAccess> {
    const [map] = await Promise.all([this.getVisibility(), this.auth.ready]);
    const isStaff = this.auth.can('content.read');
    return (collection, levelParam) => contentAccess(levelVisibility(map, collection, levelParam), isStaff);
  }

  /** Đổi mức hiển thị các cấp của 1 bộ (bộ HSK 1-9: cấp 7-9 đổi cùng nhau) */
  async setVisibility(collection: VocabCollection, levels: number[], visibility: ContentVisibility): Promise<{ error?: string }> {
    this.cache.clear();
    const expired = await sessionError();
    if (expired) return { error: expired };
    const { error } = await this.supabase.rpc('set_vocab_visibility', {
      p_collection: collection,
      p_levels: levels,
      p_visibility: visibility,
    });
    return error ? { error: writeErrorMessage(error) } : {};
  }

  /** Query có sẵn bộ lọc theo phạm vi (bộ + cấp + bài / chủ đề) */
  private scopedQuery(scope: VocabScope, columns = VOCAB_COLUMNS, options?: { count: 'exact' }) {
    const levels = scopeLevels(scope);
    let q = this.supabase
      .from('vocab_cards')
      .select(columns, options)
      .eq('collection', scope.collection);

    q = levels.length > 1 ? q.in('hsk_level', levels) : q.eq('hsk_level', levels[0]);

    if (scope.lesson != null) {
      q = scope.lesson > 0 ? q.eq('lesson_number', scope.lesson) : q.is('lesson_number', null);
    }
    if (scope.topic != null) {
      q = scope.topic ? q.eq('topic', scope.topic) : q.is('topic', null);
    }
    return q;
  }

  /** Lấy toàn bộ dòng, tự chia trang 1000 dòng */
  private async fetchAll<T>(build: () => any): Promise<T[]> {
    return (await this.fetchAllChecked<T>(build)).rows;
  }

  /** Như fetchAll, kèm cờ ok = false khi có trang lỗi (kết quả thiếu, không nên cache) */
  private async fetchAllChecked<T>(build: () => any): Promise<{ rows: T[]; ok: boolean }> {
    const rows: T[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await build().range(from, from + PAGE - 1);
      if (error) {
        console.error('Vocab query failed:', error);
        return { rows, ok: false };
      }
      rows.push(...(data ?? []));
      if (!data || data.length < PAGE) break;
    }
    return { rows, ok: true };
  }

  /** fetchAllChecked có cache; trả bản sao mảng để trang gọi tự do sắp xếp */
  private async cachedRows<T>(key: string, build: () => any): Promise<T[]> {
    const { rows } = await this.cache.get(key, () => this.fetchAllChecked<T>(build), r => r.ok);
    return [...rows];
  }

  /** Toàn bộ từ trong 1 phạm vi, theo thứ tự cấp → bài → nhập */
  async getVocabForScope(scope: VocabScope): Promise<VocabCard[]> {
    return this.cachedRows<VocabCard>(`cards:${scopeKey(scope)}`, () =>
      this.scopedQuery(scope)
        .order('hsk_level', { ascending: true })
        .order('lesson_number', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true })
    );
  }

  /** Thông tin tối thiểu để tính tiến độ học (không tải cả ví dụ) */
  async getCardRefsForScope(scope: VocabScope): Promise<Pick<VocabCard, 'id' | 'hanzi' | 'hsk_level' | 'collection'>[]> {
    return this.cachedRows(`refs:${scopeKey(scope)}`, () => this.scopedQuery(scope, 'id, hanzi, hsk_level, collection').order('id'));
  }

  /** Số từ theo từng cấp của 1 bộ */
  async getLevelCounts(collection: VocabCollection): Promise<Map<number, number>> {
    const { counts } = await this.cache.get(`counts:${collection}`, async () => {
      const levels = collectionLevels(collection);
      const results = await Promise.all(levels.map(level =>
        this.supabase
          .from('vocab_cards')
          .select('id', { count: 'exact', head: true })
          .eq('collection', collection)
          .eq('hsk_level', level)
      ));
      const counts = new Map<number, number>();
      results.forEach((res, i) => counts.set(levels[i], res.error ? 0 : res.count ?? 0));
      return { counts, ok: results.every(res => !res.error) };
    }, r => r.ok);
    return new Map(counts);
  }

  /**
   * Danh sách nhóm trong 1 cấp: bài học (HSK 3.0) hoặc chủ đề (Bổ sung).
   * Từ chưa gán bài / chủ đề gom vào nhóm cuối cùng.
   */
  async getGroups(scope: VocabScope): Promise<VocabGroupInfo[]> {
    const grouping = VOCAB_COLLECTIONS[scope.collection].grouping;
    if (!grouping) return [];
    const base: VocabScope = { collection: scope.collection, levelParam: scope.levelParam };

    const rows = await this.cachedRows<Pick<VocabCard, 'id' | 'lesson_number' | 'lesson_title' | 'topic'>>(`groups:${scopeKey(base)}`, () =>
      this.scopedQuery(base, 'id, lesson_number, lesson_title, topic').order('id')
    );

    const groups = new Map<string, VocabGroupInfo>();
    let unassigned = 0;

    for (const r of rows) {
      if (grouping === 'lesson') {
        const n = r.lesson_number;
        if (n == null || n <= 0) { unassigned++; continue; }
        const g = groups.get(String(n));
        if (g) {
          g.wordCount++;
          if (g.title === `Bài ${n}` && r.lesson_title) g.title = r.lesson_title;
        } else {
          groups.set(String(n), { key: String(n), lessonNumber: n, title: r.lesson_title || `Bài ${n}`, wordCount: 1 });
        }
      } else {
        const t = r.topic?.trim();
        if (!t) { unassigned++; continue; }
        const g = groups.get(t);
        if (g) g.wordCount++;
        else groups.set(t, { key: t, title: t, wordCount: 1 });
      }
    }

    // Bài học theo số bài; chủ đề theo thứ tự nhập
    const list = [...groups.values()];
    if (grouping === 'lesson') list.sort((a, b) => a.lessonNumber! - b.lessonNumber!);

    if (unassigned > 0) {
      list.push(grouping === 'lesson'
        ? { key: '0', lessonNumber: 0, title: 'Chưa phân bài', wordCount: unassigned }
        : { key: NO_TOPIC_PARAM, title: 'Chưa phân chủ đề', wordCount: unassigned });
    }
    return list;
  }

  /** Bảng tra cứu có phân trang */
  async getVocabPaginated(params: {
    scope: VocabScope;
    query?: string;
    page: number;
    pageSize: number;
  }): Promise<{ data: VocabCard[]; total: number }> {
    const { scope, query, page, pageSize } = params;
    const from = (page - 1) * pageSize;

    let q = this.scopedQuery(scope, VOCAB_COLUMNS, { count: 'exact' });
    if (query && query.trim()) {
      const clean = query.trim().replace(/[,()]/g, ' ');
      const filters = [`hanzi.ilike.%${clean}%`, `pinyin.ilike.%${clean}%`, `meaning.ilike.%${clean}%`];
      // Pinyin không dấu / không cách: "mama", "ma ma" đều tìm được māma (cột pinyin_search, migration 018)
      const plain = plainPinyin(clean);
      if (plain) filters.push(`pinyin_search.ilike.%${plain}%`);
      q = q.or(filters.join(','));
    }

    const { data, count, error } = await q
      .order('hsk_level', { ascending: true })
      .order('lesson_number', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('getVocabPaginated failed:', error);
      return { data: [], total: 0 };
    }
    return { data: (data ?? []) as unknown as VocabCard[], total: count ?? 0 };
  }

  /** Trang quản lý: toàn bộ từ của 1 bộ (hoặc tất cả), lọc theo cấp (0 = mọi cấp) */
  async getVocabForManage(collection: VocabCollection | 'all', level: number): Promise<VocabCard[]> {
    return this.fetchAll<VocabCard>(() => {
      let q = this.supabase.from('vocab_cards').select(VOCAB_COLUMNS);
      if (collection !== 'all') q = q.eq('collection', collection);
      if (level > 0) q = q.eq('hsk_level', level);
      return q.order('collection').order('hsk_level').order('id');
    });
  }

  /** Các từ đã có cùng Hán tự trong cùng bộ + cấp (để hỏi xác nhận khi thêm nghĩa mới) */
  async findSameHanzi(collection: VocabCollection, level: number, hanzi: string): Promise<VocabCard[]> {
    const { data, error } = await this.supabase
      .from('vocab_cards')
      .select(VOCAB_COLUMNS)
      .eq('collection', collection)
      .eq('hsk_level', level)
      .eq('hanzi', hanzi.trim())
      .order('id');
    if (error) {
      console.error('findSameHanzi failed:', error);
      return [];
    }
    return data ?? [];
  }

  /** Thêm 1 từ vựng (admin/ops) */
  async addCard(card: NewVocabCard): Promise<{ success: boolean; error?: string }> {
    this.cache.clear();
    const expired = await sessionError();
    if (expired) return { success: false, error: expired };
    const { error } = await this.supabase
      .from('vocab_cards')
      .insert(this.withVersion(card));

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: `Từ "${card.hanzi}" (${card.pinyin} — ${card.meaning}) đã có trong ${VOCAB_COLLECTIONS[card.collection].shortLabel} cấp ${card.hsk_level}` };
      }
      return { success: false, error: writeErrorMessage(error) };
    }
    return { success: true };
  }

  /** Thêm nhiều từ vựng (batch import). Trùng hoàn toàn → bỏ qua, không ghi đè */
  async addCards(cards: NewVocabCard[]): Promise<{ inserted: number; errors: string[] }> {
    this.cache.clear();
    const expired = await sessionError();
    if (expired) return { inserted: 0, errors: [expired] };
    const errors: string[] = [];
    let inserted = 0;

    // Bỏ các dòng trùng hoàn toàn trong cùng lô (Postgres không cho upsert 1 key 2 lần trong 1 lệnh)
    const seen = new Set<string>();
    const unique = cards.filter(c => {
      const key = vocabEntryKey(c);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map(c => this.withVersion(c));

    for (let i = 0; i < unique.length; i += 500) {
      const { data, error } = await this.supabase
        .from('vocab_cards')
        .upsert(unique.slice(i, i + 500), { onConflict: 'collection,hsk_level,hanzi,pinyin,meaning', ignoreDuplicates: true })
        .select('id');

      if (error) errors.push(writeErrorMessage(error));
      else inserted += data?.length ?? 0;
    }

    return { inserted, errors };
  }

  /** Cập nhật 1 từ vựng (admin/ops) */
  async updateCard(id: number, changes: Partial<VocabCard>): Promise<{ success: boolean; error?: string }> {
    this.cache.clear();
    const expired = await sessionError();
    if (expired) return { success: false, error: expired };
    const payload = changes.collection ? this.withVersion(changes as NewVocabCard) : changes;
    const { data, error } = await this.supabase
      .from('vocab_cards')
      .update(payload)
      .eq('id', id)
      .select('id');

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Đã có từ giống hệt (Hán tự + pinyin + nghĩa) trong cùng bộ và cấp.' };
      }
      return { success: false, error: writeErrorMessage(error) };
    }
    if (!data?.length) return { success: false, error: NO_ROW_ERROR };
    return { success: true };
  }

  /** Xoá 1 từ vựng (admin/ops) */
  async deleteCard(id: number): Promise<{ success: boolean; error?: string }> {
    this.cache.clear();
    const expired = await sessionError();
    if (expired) return { success: false, error: expired };
    const { data, error } = await this.supabase
      .from('vocab_cards')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) {
      return { success: false, error: writeErrorMessage(error) };
    }
    if (!data?.length) return { success: false, error: NO_ROW_ERROR };
    return { success: true };
  }

  /** Xoá nhiều từ vựng (admin/ops) */
  async deleteCards(ids: number[]): Promise<{ success: boolean; error?: string }> {
    this.cache.clear();
    const expired = await sessionError();
    if (expired) return { success: false, error: expired };
    const { data, error } = await this.supabase
      .from('vocab_cards')
      .delete()
      .in('id', ids)
      .select('id');

    if (error) {
      return { success: false, error: writeErrorMessage(error) };
    }
    if (!data?.length) return { success: false, error: NO_ROW_ERROR };
    return { success: true };
  }

  /** Các từ đã có trong 1 bộ (các cấp cho trước) để kiểm tra trùng khi import */
  async getExistingVocabKeys(collection: VocabCollection, levels: number[]): Promise<ExistingVocabKeys> {
    const keys: ExistingVocabKeys = { entries: new Set(), hanzi: new Map() };
    if (levels.length === 0) return keys;

    const rows = await this.fetchAll<Pick<VocabCard, 'collection' | 'hanzi' | 'pinyin' | 'meaning' | 'hsk_level'>>(() =>
      this.supabase
        .from('vocab_cards')
        .select('collection, hanzi, pinyin, meaning, hsk_level')
        .eq('collection', collection)
        .in('hsk_level', levels)
        .order('id')
    );

    for (const r of rows) {
      keys.entries.add(vocabEntryKey(r));
      const hk = vocabHanziKey(r);
      const list = keys.hanzi.get(hk) ?? [];
      list.push({ pinyin: r.pinyin, meaning: r.meaning });
      keys.hanzi.set(hk, list);
    }
    return keys;
  }

  /** hsk_version luôn đi theo bộ (giữ cột cũ đồng bộ) */
  private withVersion<T extends { collection: VocabCollection }>(card: T): T & { hsk_version: string } {
    return { ...card, hsk_version: VOCAB_COLLECTIONS[card.collection].version };
  }
}
