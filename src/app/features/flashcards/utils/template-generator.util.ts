import type { VocabCard } from '../models/vocab-card.model';

const TEMPLATE_HEADERS = ['hanzi', 'pinyin', 'meaning', 'hsk_level', 'example', 'example_pinyin', 'example_meaning'];

const EXAMPLE_ROWS = [
  ['你好', 'nǐ hǎo', 'xin chào', '1', '你好，我叫小明。', 'Nǐ hǎo, wǒ jiào Xiǎo Míng.', 'Xin chào, tôi tên là Tiểu Minh.'],
  ['谢谢', 'xiè xie', 'cảm ơn', '1', '谢谢你的帮助。', 'Xiè xie nǐ de bāng zhù.', 'Cảm ơn sự giúp đỡ của bạn.'],
];

/** Download a CSV template file */
export function downloadCsvTemplate(): void {
  const lines = [
    TEMPLATE_HEADERS.join(','),
    ...EXAMPLE_ROWS.map(row => row.map(cell => `"${cell}"`).join(',')),
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
