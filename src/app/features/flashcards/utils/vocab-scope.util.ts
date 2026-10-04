import type { ParamMap } from '@angular/router';
import { VOCAB_COLLECTIONS, parseLevelParam } from '../models/vocab-card.model';
import type { HskVersion, VocabCollection, VocabScope } from '../models/vocab-card.model';

/** Tham số route cho nhóm "chưa phân chủ đề" (tên chủ đề rỗng không đưa lên URL được) */
export const NO_TOPIC_PARAM = '_';

/** Đọc phạm vi từ vựng từ route: data.collection + :level (+ :lesson / :topic) */
export function scopeFromRoute(collection: VocabCollection, params: ParamMap): VocabScope {
  const lesson = params.get('lesson');
  const topic = params.get('topic');
  return {
    collection,
    levelParam: params.get('level') || VOCAB_COLLECTIONS[collection].levelParams[0],
    lesson: lesson != null ? Number(lesson) : null,
    topic: topic != null ? (topic === NO_TOPIC_PARAM ? '' : topic) : null,
  };
}

export function scopeLevels(scope: VocabScope): number[] {
  return parseLevelParam(scope.levelParam);
}

/** "NEW HSK 3", "HSK 7-9" */
export function scopeLevelLabel(scope: Pick<VocabScope, 'collection' | 'levelParam'>): string {
  return `${VOCAB_COLLECTIONS[scope.collection].levelPrefix} ${scope.levelParam}`;
}

/**
 * Nhãn cấp hiển thị cho thẻ từ vựng:
 * - Combined cấp 7..9: "HSK 7-9"
 * - HSK 3.0 (collection hsk3): "NEW HSK n"
 * - Các bộ khác: "HSK n"
 */
export function vocabCardLevelLabel(card: {
  collection?: VocabCollection;
  hsk_level: number;
  hsk_version?: HskVersion;
}): string {
  if (card.collection === 'combined' && card.hsk_level >= 7) {
    return 'HSK 7-9';
  }
  const isHsk3 = card.collection === 'hsk3' || (card.hsk_version === '3.0' && card.collection !== 'combined' && card.collection !== 'supplement');
  const prefix = isHsk3 ? 'NEW HSK' : 'HSK';
  return `${prefix} ${card.hsk_level}`;
}

/** Tên nhóm đang chọn: "Bài 3", "Chủ đề: Gia đình", hoặc null nếu học cả cấp */
export function scopeGroupLabel(scope: VocabScope): string | null {
  if (scope.lesson != null) return scope.lesson > 0 ? `Bài ${scope.lesson}` : 'Chưa phân bài';
  if (scope.topic != null) return scope.topic || 'Chưa phân chủ đề';
  return null;
}

/** Tiêu đề trang, VD "NEW HSK 3 — Bài 2" */
export function scopeTitle(scope: VocabScope): string {
  const group = scopeGroupLabel(scope);
  const level = scopeLevelLabel(scope);
  if (group) return `${level} — ${group}`;
  if (VOCAB_COLLECTIONS[scope.collection].grouping) return `${level} (Tất cả)`;
  return `${level} (${VOCAB_COLLECTIONS[scope.collection].shortLabel})`;
}

export interface ScopeRoutes {
  study: string[];
  quiz: string[];
  list: string[];
  listQuery: Record<string, string | number> | null;
  back: string[];
  backLabel: string;
}

/** Các đường dẫn liên quan tới 1 phạm vi (flashcard / trắc nghiệm / bảng / quay lại) */
export function scopeRoutes(scope: VocabScope): ScopeRoutes {
  const { collection, levelParam } = scope;
  const grouping = VOCAB_COLLECTIONS[collection].grouping;
  const base = ['/flashcards', collection, levelParam];
  const list = [...base, 'list'];

  if (!grouping) {
    return {
      study: base,
      quiz: [...base, 'quiz'],
      list,
      listQuery: null,
      back: ['/flashcards', collection],
      backLabel: 'Chọn cấp độ',
    };
  }

  let study: string[];
  let listQuery: Record<string, string | number> | null = null;
  if (scope.lesson != null) {
    study = [...base, 'lesson', String(scope.lesson)];
    listQuery = { lesson: scope.lesson };
  } else if (scope.topic != null) {
    study = [...base, 'topic', scope.topic || NO_TOPIC_PARAM];
    listQuery = { topic: scope.topic || NO_TOPIC_PARAM };
  } else {
    study = [...base, 'all'];
  }

  return {
    study,
    quiz: [...study, 'quiz'],
    list,
    listQuery,
    back: base,
    backLabel: grouping === 'lesson' ? 'Chọn bài học' : 'Chọn chủ đề',
  };
}
