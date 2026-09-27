import type { VocabCard } from '../models/vocab-card.model';

/** Các dạng câu hỏi trắc nghiệm */
export type QuizType = 'hanzi_meaning' | 'meaning_hanzi' | 'hanzi_pinyin';

export const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
  hanzi_meaning: 'Hán tự → nghĩa',
  meaning_hanzi: 'Nghĩa → Hán tự',
  hanzi_pinyin: 'Hán tự → pinyin',
};

export const QUIZ_TYPES = Object.keys(QUIZ_TYPE_LABELS) as QuizType[];

/** Số đáp án mỗi câu */
export const QUIZ_OPTION_COUNT = 4;

export interface QuizQuestion {
  type: QuizType;
  card: VocabCard;
  options: string[];
  answerIndex: number;
}

type Rng = () => number;

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function norm(value: string | null | undefined): string {
  return (value ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
}

function sameText(a: string, b: string): boolean {
  return norm(a).toLowerCase() === norm(b).toLowerCase();
}

/** Giá trị hiển thị ở đáp án cho từng dạng câu */
function answerOf(type: QuizType, card: VocabCard): string {
  switch (type) {
    case 'hanzi_meaning':
      return norm(card.meaning);
    case 'hanzi_pinyin':
      return norm(card.pinyin);
    default:
      return norm(card.hanzi);
  }
}

// --- Pinyin tone variants -------------------------------------------------

const TONE_VOWELS: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

/** Ký tự có dấu thanh → [nguyên âm gốc, thanh 1-4] (cả chữ hoa) */
const MARKED = new Map<string, { base: string; upper: boolean }>();
for (const [base, marks] of Object.entries(TONE_VOWELS)) {
  marks.forEach(m => {
    MARKED.set(m, { base, upper: false });
    MARKED.set(m.toUpperCase(), { base, upper: true });
  });
}

/**
 * Các biến thể đổi thanh điệu của 1 pinyin (dùng làm đáp án nhiễu cho dạng Hán tự → pinyin).
 * VD "nǐ hǎo" → "nī hǎo", "ní hǎo", "nì hǎo", "nǐ hāo", …
 */
export function pinyinToneVariants(pinyin: string): string[] {
  const chars = [...norm(pinyin)];
  const variants = new Set<string>();

  chars.forEach((ch, idx) => {
    const info = MARKED.get(ch);
    if (!info) return;
    for (const mark of TONE_VOWELS[info.base]) {
      const replacement = info.upper ? mark.toUpperCase() : mark;
      if (replacement === ch) continue;
      const copy = [...chars];
      copy[idx] = replacement;
      variants.add(copy.join(''));
    }
  });

  variants.delete(norm(pinyin));
  return [...variants];
}

// --- Question building ----------------------------------------------------

/**
 * Tạo 1 câu hỏi cho `card`, lấy đáp án nhiễu từ `pool`.
 * Trả về null nếu không đủ đáp án nhiễu khác nhau.
 */
export function buildQuestion(type: QuizType, card: VocabCard, pool: readonly VocabCard[], rng: Rng = Math.random): QuizQuestion | null {
  const answer = answerOf(type, card);
  if (!answer) return null;

  const distractors: string[] = [];
  const taken = (v: string) => sameText(v, answer) || distractors.some(d => sameText(d, v));

  // Hán tự → pinyin: ưu tiên đổi thanh điệu của chính từ đó (luyện thanh điệu)
  if (type === 'hanzi_pinyin') {
    for (const v of shuffle(pinyinToneVariants(answer), rng)) {
      if (distractors.length >= QUIZ_OPTION_COUNT - 1) break;
      if (!taken(v)) distractors.push(v);
    }
  }

  for (const other of shuffle(pool, rng)) {
    if (distractors.length >= QUIZ_OPTION_COUNT - 1) break;
    if (other === card || (other.id != null && other.id === card.id)) continue;
    // Không lấy từ cùng chữ / cùng nghĩa làm đáp án nhiễu (có thể cũng đúng)
    if (sameText(other.hanzi, card.hanzi)) continue;
    if (type !== 'hanzi_meaning' && sameText(other.meaning, card.meaning)) continue;
    const value = answerOf(type, other);
    if (value && !taken(value)) distractors.push(value);
  }

  if (distractors.length < QUIZ_OPTION_COUNT - 1) return null;

  const options = shuffle([answer, ...distractors], rng);
  return { type, card, options, answerIndex: options.indexOf(answer) };
}

/**
 * Tạo bài trắc nghiệm: chọn ngẫu nhiên `count` từ trong `cards`, mỗi câu 1 dạng ngẫu nhiên trong `types`.
 * Đáp án nhiễu lấy từ `pool` (mặc định = cards). Câu nào không đủ đáp án nhiễu thì thử dạng khác, rồi bỏ qua.
 */
export function buildQuiz(
  cards: readonly VocabCard[],
  types: readonly QuizType[],
  count: number,
  pool: readonly VocabCard[] = cards,
  rng: Rng = Math.random
): QuizQuestion[] {
  if (types.length === 0) return [];
  const questions: QuizQuestion[] = [];

  for (const card of shuffle(cards, rng)) {
    if (questions.length >= count) break;
    for (const type of shuffle(types, rng)) {
      const q = buildQuestion(type, card, pool, rng);
      if (q) {
        questions.push(q);
        break;
      }
    }
  }
  return questions;
}
