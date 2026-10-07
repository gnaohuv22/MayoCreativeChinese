import { ADVANCED_LEVELS, ADVANCED_LEVEL_PARAM, VOCAB_COLLECTIONS } from '../../flashcards/models/vocab-card.model';
import type { ClassSuggestion } from '../models/class.model';

/** levels [7, 8, 9] → "7-9" (cấp gộp), [3] → "3" — khớp tham số route flashcard */
export function vocabSuggestionParam(s: Pick<ClassSuggestion, 'levels'>): string {
  const levels = [...(s.levels ?? [])].sort((a, b) => a - b);
  if (levels.length === ADVANCED_LEVELS.length && levels.every((l, i) => l === ADVANCED_LEVELS[i])) return ADVANCED_LEVEL_PARAM;
  return String(levels[0] ?? 1);
}

/** "HSK 2.0 · HSK 3" */
export function vocabSuggestionLabel(s: Pick<ClassSuggestion, 'collection' | 'levels'>): string {
  if (!s.collection) return '';
  const config = VOCAB_COLLECTIONS[s.collection];
  return `${config.shortLabel} · ${config.levelPrefix} ${vocabSuggestionParam(s)}`;
}
