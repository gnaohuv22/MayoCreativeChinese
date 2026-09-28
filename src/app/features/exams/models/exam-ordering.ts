/**
 * Dạng 'ordering' (sắp xếp từ thành câu).
 * Nội dung câu hỏi liệt kê từ theo số khoanh tròn: "① 那只猫  ② 桌子下面  ③ 睡觉  ④ 在".
 * Học viên trả lời bằng chuỗi số theo thứ tự câu: "①④②③". Đáp án đúng có thể viết
 * "①④②③", "1423", "1-4-2-3" hoặc cả câu "那只猫在桌子下面睡觉"; nhiều cách xếp ngăn bởi '/', '|' hoặc "hoặc".
 */

export interface OrderingToken {
  /** Số khoanh tròn ①…⑳ */
  mark: string;
  text: string;
}

const MARK = /[①-⑳]/g;
const TOKEN = /([①-⑳])\s*([^①-⑳]*)/g;
/** Không tách theo ',' vì dấu phẩy có thể ngăn các số: "1,4,2,3" */
const ALTERNATIVES = /\/|\||hoặc/i;
/** Dấu câu / khoảng trắng bỏ qua khi so câu */
const IGNORED = /[\s。，、！？!?,.;；:："“”'‘’…]/g;

/** Tách các từ trong nội dung câu hỏi; trả về [] nếu nội dung không theo dạng ① … ② … */
export function parseOrderingTokens(content: string | null | undefined): OrderingToken[] {
  if (!content) return [];
  const tokens: OrderingToken[] = [];
  for (const [, mark, text] of content.matchAll(TOKEN)) {
    const word = text.trim();
    if (word && !tokens.some((t) => t.mark === mark)) tokens.push({ mark, text: word });
  }
  return tokens;
}

/** Các số khoanh tròn trong 1 đáp án, theo thứ tự */
export function orderingMarks(answer: string | null | undefined): string[] {
  return answer?.match(MARK) ?? [];
}

/** Các cách xếp được chấp nhận của 1 đáp án */
export function orderingAlternatives(answer: string | null | undefined): string[] {
  return (answer ?? '')
    .split(ALTERNATIVES)
    .map((alt) => alt.trim())
    .filter(Boolean);
}

/**
 * Đưa 1 cách xếp về chuỗi số khoanh tròn: "1423", "1-4-2-3", "那只猫在桌子下面睡觉" → "①④②③".
 * Không nhận ra được thì trả về chính chuỗi đó (bỏ khoảng trắng, chữ thường) để so khớp nguyên văn.
 */
export function toOrderingMarks(
  answer: string | null | undefined,
  tokens: OrderingToken[],
): string {
  const text = (answer ?? '').trim();
  const marks = orderingMarks(text);
  if (marks.length) return marks.join('');
  return (
    fromNumbers(text, tokens) ??
    fromSentence(text, tokens) ??
    text.replace(/\s+/g, '').toLowerCase()
  );
}

/** Câu trả lời của học viên có khớp 1 trong các cách xếp của đáp án đúng không */
export function orderingAnswerMatches(
  userAnswer: string | null | undefined,
  correctAnswer: string | null | undefined,
  tokens: OrderingToken[],
): boolean {
  const user = toOrderingMarks(userAnswer, tokens);
  if (!user) return false;
  return orderingAlternatives(correctAnswer).some((alt) => toOrderingMarks(alt, tokens) === user);
}

/**
 * Ghép đáp án thành câu: "①④②③" (hoặc "1423") → "那只猫在桌子下面睡觉".
 * Nhiều cách xếp được nối bằng " / ".
 */
export function orderingSentence(
  answer: string | null | undefined,
  tokens: OrderingToken[],
): string {
  if (!answer || tokens.length === 0) return answer ?? '';
  const byMark = new Map(tokens.map((t) => [t.mark, t.text]));
  return orderingAlternatives(answer)
    .map((alt) => {
      const marks = orderingMarks(toOrderingMarks(alt, tokens));
      return marks.length ? marks.map((m) => byMark.get(m) ?? m).join('') : alt;
    })
    .join(' / ');
}

/** "1423" (mỗi chữ số 1 từ) hoặc "1-4-2-3" / "1 4 2 3" / "1,4,2,3" (ngăn cách, cho phép số ≥ 10) */
function fromNumbers(text: string, tokens: OrderingToken[]): string | null {
  if (!/^[\d\s,.\-–>→]+$/.test(text)) return null;
  const nums = /^\d+$/.test(text) ? [...text].map(Number) : (text.match(/\d+/g) ?? []).map(Number);
  const max = tokens.length || 20;
  if (nums.length === 0 || nums.some((n) => n < 1 || n > max)) return null;
  return nums.map((n) => String.fromCharCode(0x2460 + n - 1)).join('');
}

/** Cả câu "那只猫在桌子下面睡觉" → ghép lại đúng các từ đã cho (thử mọi cách tách khi có từ trùng tiền tố) */
function fromSentence(text: string, tokens: OrderingToken[]): string | null {
  const target = text.replace(IGNORED, '');
  const words = tokens.map((t) => ({ mark: t.mark, text: t.text.replace(IGNORED, '') }));
  if (!target || words.length === 0) return null;

  const used = new Set<string>();
  const order: string[] = [];
  const walk = (pos: number): boolean => {
    if (pos === target.length) return used.size === words.length;
    for (const w of words) {
      if (used.has(w.mark) || !w.text || !target.startsWith(w.text, pos)) continue;
      used.add(w.mark);
      order.push(w.mark);
      if (walk(pos + w.text.length)) return true;
      used.delete(w.mark);
      order.pop();
    }
    return false;
  };
  return walk(0) ? order.join('') : null;
}
