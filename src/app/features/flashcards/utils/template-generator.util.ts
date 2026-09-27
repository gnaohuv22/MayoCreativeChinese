import type { VocabCard } from '../models/vocab-card.model';

/**
 * Mẫu import. Bộ từ vựng (HSK 2.0 / 3.0 / 1-9 / Bổ sung) chọn trên trang import, không nằm trong file.
 * - lesson_number, lesson_title: dùng cho bộ HSK 3.0 (chia theo bài)
 * - topic: dùng cho bộ Bổ sung 2.0 → 3.0 (chia theo chủ đề)
 * - Nhiều ví dụ: xuống dòng trong ô (Alt+Enter trong Excel); dòng thứ N của 3 cột ví dụ là 1 ví dụ
 */
const TEMPLATE_HEADERS = [
  'hanzi',
  'pinyin',
  'meaning',
  'hsk_level',
  'lesson_number',
  'lesson_title',
  'topic',
  'example',
  'example_pinyin',
  'example_meaning',
];

const EXAMPLE_ROWS = [
  ['你好', 'nǐ hǎo', 'xin chào', '1', '1', 'Bài 1: Lời chào', '', '你好，我叫小明。', 'Nǐ hǎo, wǒ jiào Xiǎo Míng.', 'Xin chào, tôi tên là Tiểu Minh.'],
  ['对', 'duì', 'đúng', '1', '2', 'Bài 2: Trả lời', '', '你说得对。\n对，我是老师。', 'Nǐ shuō de duì.\nDuì, wǒ shì lǎoshī.', 'Bạn nói đúng.\nĐúng, tôi là giáo viên.'],
  ['对', 'duì', 'đối với', '1', '2', 'Bài 2: Trả lời', '', '他对我很好。', 'Tā duì wǒ hěn hǎo.', 'Anh ấy đối với tôi rất tốt.'],
  ['快递', 'kuàidì', 'chuyển phát nhanh', '3', '', '', 'Mua sắm', '我的快递到了。', 'Wǒ de kuàidì dào le.', 'Hàng chuyển phát của tôi đến rồi.'],
];

/** Download a CSV template file */
export function downloadCsvTemplate(): void {
  const lines = [
    TEMPLATE_HEADERS.join(','),
    ...EXAMPLE_ROWS.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  triggerDownload(blob, 'flashcard-template.csv');
}

/** Download an XLSX template file (dynamic import) */
export async function downloadXlsxTemplate(): Promise<void> {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...EXAMPLE_ROWS]);

  // Set column widths
  ws['!cols'] = [
    { wch: 10 }, // hanzi
    { wch: 15 }, // pinyin
    { wch: 20 }, // meaning
    { wch: 10 }, // hsk_level
    { wch: 14 }, // lesson_number
    { wch: 20 }, // lesson_title
    { wch: 18 }, // topic
    { wch: 30 }, // example
    { wch: 30 }, // example_pinyin
    { wch: 30 }, // example_meaning
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Flashcards');
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, 'flashcard-template.xlsx');
}

/** Export vocab cards as JSON download */
export function exportAsJson(cards: VocabCard[], filename: string): void {
  const exportData = cards.map(({ id, created_at, updated_at, ...rest }) => rest);
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json;charset=utf-8' });
  triggerDownload(blob, filename);
}

/** Export progress data as JSON download */
export function exportProgressJson(jsonStr: string): void {
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  triggerDownload(blob, `flashcard-progress-${new Date().toISOString().slice(0, 10)}.json`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
