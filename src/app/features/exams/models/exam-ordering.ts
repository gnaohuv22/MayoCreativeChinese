/**
 * Dạng 'ordering' (sắp xếp từ thành câu).
 * Nội dung câu hỏi liệt kê từ theo số khoanh tròn: "① 那只猫  ② 桌子下面  ③ 睡觉  ④ 在".
 * Đáp án (của học viên và đáp án đúng) là chuỗi số theo thứ tự câu: "①④②③".
 */

export interface OrderingToken {
  /** Số khoanh tròn ①…⑳ */
  mark: string;
  text: string;
}

const MARK = /[①-⑳]/g;
const TOKEN = /([①-⑳])\s*([^①-⑳]*)/g;

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

/**
 * Ghép đáp án "①④②③" thành câu "那只猫在桌子下面睡觉".
 * Đáp án đúng có thể có nhiều cách xếp ngăn bởi '/', '|' hoặc ','.
 */
export function orderingSentence(
  answer: string | null | undefined,
  tokens: OrderingToken[],
): string {
  if (!answer || tokens.length === 0) return answer ?? '';
  const byMark = new Map(tokens.map((t) => [t.mark, t.text]));
  return answer
    .split(/[/|,]/)
    .map((alt) => {
      const marks = orderingMarks(alt);
      return marks.length ? marks.map((m) => byMark.get(m) ?? m).join('') : alt.trim();
    })
    .join(' / ');
}
