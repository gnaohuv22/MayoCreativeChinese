import type { CourseBlock, CourseDetail, CourseInfoRow, CourseTrack, RichLine } from '../../../courses/models/course-detail.model';

/**
 * Bản nháp trang khóa học trong /admin/courses: dòng định dạng (RichLine[]) và danh sách
 * được giữ dạng chữ nhiều dòng để sửa trong ô văn bản, chuyển lại khi lưu.
 *   - mỗi dòng = 1 RichLine;  "- " ở đầu = gạch đầu dòng;  **chữ** = đậm;  _chữ_ = nghiêng
 */

export type DraftBlock =
  | { kind: 'heading' | 'subheading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; title: string; text: string }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'stage'; title: string; blocks: DraftBlock[] };

export type DraftBlockKind = DraftBlock['kind'];

export interface DraftInfoRow {
  label: string;
  /** Mỗi dòng 1 giá trị */
  text: string;
}

export interface DraftTrack {
  id: string;
  title: string;
  sessions: string;
  summary: string;
  blocks: DraftBlock[];
  info: DraftInfoRow[];
}

export interface CourseDraft {
  /** null = khóa mới chưa lưu */
  id: string | null;
  slug: string;
  /** Khóa mới: đường dẫn tự sinh theo tên cho tới khi người dùng tự sửa */
  slugTouched: boolean;
  is_published: boolean;
  name: string;
  goal: string;
  lead: { label: string; text: string }[];
  chipsText: string;
  stats: { value: string; label: string }[];
  blocks: DraftBlock[];
  info: DraftInfoRow[];
  tracks: DraftTrack[];
  audiencesText: string;
  audienceNote: string;
  bannerText: string;
  bannerSlug: string;
  /** Giữ nguyên giá trị cũ (không sửa trong khu quản trị) */
  cardId: string | null;
}

/** Dòng trong site_courses (khu quản trị) */
export interface CourseRow {
  id: string;
  slug: string;
  sort_order: number;
  is_published: boolean;
  name: string;
  content: Omit<CourseDetail, 'slug' | 'name'>;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Dòng định dạng ↔ chữ
// -----------------------------------------------------------------------------

/** **chữ** (không chứa ** bên trong) */
const BOLD = /^\*\*((?:(?!\*\*).)+)\*\*$/;
/** _chữ_ (không chứa _ bên trong) */
const ITALIC = /^_([^_]+)_$/;

/** Dòng thường nhưng trông giống cú pháp định dạng → thêm \ ở đầu để giữ nguyên */
function needsEscape(text: string): boolean {
  return text.startsWith('- ') || text.startsWith('\\') || BOLD.test(text) || ITALIC.test(text);
}

export function lineToText(l: RichLine): string {
  let t = l.text;
  if (l.italic) t = `_${t}_`;
  if (l.bold) t = `**${t}**`;
  if (!l.bold && !l.italic && needsEscape(t)) t = `\\${t}`;
  return (l.bullet ? '- ' : '') + t;
}

export function linesToText(lines: RichLine[]): string {
  return lines.map(lineToText).join('\n');
}

/** Một dòng chữ → RichLine; "\" ở đầu (sau "- " nếu có) = giữ nguyên, không định dạng */
export function textToLine(raw: string): RichLine {
  let t = raw.trim();
  let bullet = false;
  if (t.startsWith('- ')) {
    bullet = true;
    t = t.slice(2).trim();
  }
  let bold = false;
  let italic = false;
  if (t.startsWith('\\')) {
    t = t.slice(1);
  } else {
    const b = BOLD.exec(t);
    if (b) {
      bold = true;
      t = b[1];
    }
    const i = ITALIC.exec(t);
    if (i) {
      italic = true;
      t = i[1];
    }
  }
  return { text: t, ...(bold ? { bold } : {}), ...(italic ? { italic } : {}), ...(bullet ? { bullet } : {}) };
}

export function textToLines(text: string): RichLine[] {
  return text
    .split('\n')
    .filter(raw => raw.trim())
    .map(textToLine);
}

const splitLines = (text: string) => text.split('\n').map(l => l.trim()).filter(Boolean);

// -----------------------------------------------------------------------------
// Khóa học ↔ bản nháp
// -----------------------------------------------------------------------------

export function blockToDraft(b: CourseBlock): DraftBlock {
  switch (b.kind) {
    case 'heading':
    case 'subheading':
      return { kind: b.kind, text: b.text };
    case 'paragraph':
      return { kind: 'paragraph', text: linesToText(b.lines) };
    case 'list':
      return { kind: 'list', title: b.title ?? '', text: b.items.join('\n') };
    case 'table':
      return { kind: 'table', head: [...b.head], rows: b.rows.map(r => r.map(linesToText)) };
    case 'stage':
      return { kind: 'stage', title: b.title, blocks: b.blocks.map(blockToDraft) };
  }
}

export function draftToBlock(b: DraftBlock): CourseBlock {
  switch (b.kind) {
    case 'heading':
    case 'subheading':
      return { kind: b.kind, text: b.text.trim() };
    case 'paragraph':
      return { kind: 'paragraph', lines: textToLines(b.text) };
    case 'list':
      return { kind: 'list', ...(b.title.trim() ? { title: b.title.trim() } : {}), items: splitLines(b.text) };
    case 'table':
      return { kind: 'table', head: b.head.map(h => h.trim()), rows: b.rows.map(r => r.map(textToLines)) };
    case 'stage':
      return { kind: 'stage', title: b.title.trim(), blocks: b.blocks.map(draftToBlock) };
  }
}

const infoToDraft = (rows: CourseInfoRow[]): DraftInfoRow[] => rows.map(r => ({ label: r.label, text: r.value.join('\n') }));
const draftToInfo = (rows: DraftInfoRow[]): CourseInfoRow[] =>
  rows.filter(r => r.label.trim()).map(r => ({ label: r.label.trim(), value: splitLines(r.text) }));

function trackToDraft(t: CourseTrack): DraftTrack {
  return { id: t.id, title: t.title, sessions: t.sessions, summary: t.summary, blocks: t.blocks.map(blockToDraft), info: infoToDraft(t.info) };
}

function draftToTrack(t: DraftTrack): CourseTrack {
  return {
    id: t.id,
    info: draftToInfo(t.info),
    title: t.title.trim(),
    blocks: t.blocks.map(draftToBlock),
    summary: t.summary.trim(),
    sessions: t.sessions.trim(),
  };
}

export function rowToDraft(row: CourseRow): CourseDraft {
  const c = row.content;
  return {
    id: row.id,
    slug: row.slug,
    slugTouched: true,
    is_published: row.is_published,
    name: row.name,
    goal: c.goal ?? '',
    lead: (c.lead ?? []).map(l => ({ ...l })),
    chipsText: (c.chips ?? []).join('\n'),
    stats: (c.stats ?? []).map(s => ({ ...s })),
    blocks: (c.blocks ?? []).map(blockToDraft),
    info: infoToDraft(c.info ?? []),
    tracks: (c.tracks ?? []).map(trackToDraft),
    audiencesText: (c.audiences ?? []).join('\n'),
    audienceNote: c.audienceNote ?? '',
    bannerText: c.banner?.text ?? '',
    bannerSlug: c.banner?.slug ?? '',
    cardId: c.cardId ?? null,
  };
}

/** Mục sẽ bị bỏ khi lưu (thiếu nhãn / nội dung) — báo cho người sửa thay vì âm thầm bỏ */
export function droppedItem(d: CourseDraft): string | null {
  if (d.lead.some(l => l.label.trim() && !l.text.trim())) return 'Dòng giới thiệu có nhãn nhưng chưa có nội dung';
  const infoLists = [{ rows: d.info, where: 'Thông tin khóa học' }, ...d.tracks.map(t => ({ rows: t.info, where: `Thông tin chặng “${t.title || 'chưa có tên'}”` }))];
  for (const { rows, where } of infoLists) {
    if (rows.some(r => !r.label.trim() && r.text.trim())) return `${where}: có dòng chưa có nhãn`;
  }
  if (d.stats.some(s => !s.value.trim() && s.label.trim())) return 'Số liệu: có dòng chưa có con số';
  if (d.tracks.some(t => !t.title.trim())) return 'Có chặng chưa có tên';
  return null;
}

export function emptyDraft(): CourseDraft {
  return {
    id: null, slug: '', slugTouched: false, is_published: false, name: '', goal: '', lead: [], chipsText: '', stats: [],
    blocks: [], info: [], tracks: [], audiencesText: '', audienceNote: '', bannerText: '', bannerSlug: '', cardId: null,
  };
}

/** Nội dung lưu vào site_courses.content */
export function draftToContent(d: CourseDraft): CourseRow['content'] {
  const audiences = splitLines(d.audiencesText);
  return {
    goal: d.goal.trim(),
    info: draftToInfo(d.info),
    lead: d.lead.filter(l => l.text.trim()).map(l => ({ label: l.label.trim(), text: l.text.trim() })),
    chips: splitLines(d.chipsText),
    stats: d.stats.filter(s => s.value.trim() || s.label.trim()).map(s => ({ value: s.value.trim(), label: s.label.trim() })),
    blocks: d.blocks.map(draftToBlock),
    cardId: d.cardId,
    ...(d.tracks.length ? { tracks: d.tracks.map(draftToTrack) } : {}),
    ...(audiences.length ? { audiences } : {}),
    ...(d.audienceNote.trim() ? { audienceNote: d.audienceNote.trim() } : {}),
    ...(d.bannerText.trim() && d.bannerSlug ? { banner: { text: d.bannerText.trim(), slug: d.bannerSlug } } : {}),
  };
}
