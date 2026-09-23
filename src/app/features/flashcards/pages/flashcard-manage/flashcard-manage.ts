import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VocabService } from '../../services/vocab.service';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { ImportPreviewComponent } from '../../components/import-preview/import-preview';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { ToastService } from '../../../../services/toast.service';
import type { VocabCard, ValidatedImportRow } from '../../models/vocab-card.model';
import { parseFile, validateRows } from '../../utils/file-parser.util';
import { downloadCsvTemplate, downloadXlsxTemplate, exportAsJson } from '../../utils/template-generator.util';

@Component({
  selector: 'app-flashcard-manage',
  standalone: true,
  imports: [FormsModule, NavHeaderComponent, ImportPreviewComponent, AppIconComponent],
  templateUrl: './flashcard-manage.html',
  styleUrl: './flashcard-manage.css',
})
export class FlashcardManageComponent implements OnInit {
  protected readonly Math = Math;
  private vocabService = inject(VocabService);
  private toastService = inject(ToastService);

  activeTab = signal<'add' | 'import' | 'browse'>('add');

  // Tab: Add
  newHanzi = signal('');
  newPinyin = signal('');
  newMeaning = signal('');
  newLevel = signal<number>(1);
  newExample = signal('');
  newExamplePinyin = signal('');
  newExampleMeaning = signal('');
  addStatus = signal<{ type: 'success' | 'error'; msg: string } | null>(null);
  addLoading = signal(false);

  // Tab: Import
  importFile = signal<File | null>(null);
  parsedRows = signal<ValidatedImportRow[]>([]);
  showPreview = signal(false);
  importing = signal(false);
  importStatus = signal<{ type: 'success' | 'error'; msg: string } | null>(null);
  dragOver = signal(false);

  // Tab: Browse
  browseLevel = signal<number>(0);
  browseCards = signal<VocabCard[]>([]);
  browseLoading = signal(false);
  searchQuery = signal('');
  selectedIds = signal<Set<number>>(new Set());

  // Pagination Signals
  currentPage = signal<number>(1);
  pageSize = signal<number>(15);

  // In-row editing state
  editingCardId = signal<number | null>(null);
  editingForm = {
    hanzi: '',
    pinyin: '',
    meaning: '',
    hsk_level: 1,
    example: '',
  };

  filteredBrowseCards = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.browseCards();
    return this.browseCards().filter(
      c =>
        c.hanzi.toLowerCase().includes(query) ||
        c.pinyin.toLowerCase().includes(query) ||
        c.meaning.toLowerCase().includes(query)
    );
  });

  totalPages = computed(() => {
    const total = this.filteredBrowseCards().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  paginatedCards = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return this.filteredBrowseCards().slice(start, start + size);
  });

  ngOnInit() {
    this.loadBrowseCards();
  }

  // === Add Methods ===

  async submitCard() {
    const hanzi = this.newHanzi().trim();
    const pinyin = this.newPinyin().trim();
    const meaning = this.newMeaning().trim();

    if (!hanzi || !pinyin || !meaning) {
      this.addStatus.set({ type: 'error', msg: 'Vui lòng điền các trường bắt buộc (Hán tự, Pinyin, Nghĩa).' });
      return;
    }

    this.addLoading.set(true);
    try {
      const result = await this.vocabService.addCard({
        hanzi,
        pinyin,
        meaning,
        hsk_level: Number(this.newLevel()),
        example: this.newExample().trim() || undefined,
        example_pinyin: this.newExamplePinyin().trim() || undefined,
        example_meaning: this.newExampleMeaning().trim() || undefined,
      });

      if (result.success) {
        this.addStatus.set({ type: 'success', msg: `Đã thêm "${hanzi}" thành công!` });
        this.resetAddForm();
        this.loadBrowseCards();
      } else {
        this.addStatus.set({ type: 'error', msg: result.error ?? 'Có lỗi xảy ra.' });
      }
    } catch (e: any) {
      this.addStatus.set({ type: 'error', msg: e.message || 'Có lỗi xảy ra.' });
    } finally {
      this.addLoading.set(false);
      setTimeout(() => this.addStatus.set(null), 4000);
    }
  }

  private resetAddForm() {
    this.newHanzi.set('');
    this.newPinyin.set('');
    this.newMeaning.set('');
    this.newExample.set('');
    this.newExamplePinyin.set('');
    this.newExampleMeaning.set('');
  }

  // === Import Methods ===

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragOver.set(false);
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  private async processFile(file: File) {
    this.importFile.set(file);
    this.importStatus.set(null);

    try {
      const rawRows = await parseFile(file);

      // Collect all unique levels in the file to check for existing vocab
      const levels = new Set(rawRows.map(r => r.hsk_level));
      const allExisting = new Set<string>();

      for (const level of levels) {
        if (level >= 1 && level <= 9) {
          const existing = await this.vocabService.getExistingHanzi(level);
          existing.forEach(h => allExisting.add(`${h}_${level}`));
        }
      }

      // Build a level-aware existing set
      const existingForValidation = new Set(
        rawRows
          .filter(r => allExisting.has(`${r.hanzi}_${r.hsk_level}`))
          .map(r => r.hanzi)
      );

      const validated = validateRows(rawRows, existingForValidation);
      this.parsedRows.set(validated);
      this.showPreview.set(true);
    } catch (e: any) {
      this.importStatus.set({ type: 'error', msg: e.message || 'Không thể đọc file.' });
    }
  }

  async onImportConfirm(rows: ValidatedImportRow[]) {
    this.importing.set(true);
    try {
      const cards = rows.map(r => ({
        hanzi: r.row.hanzi,
        pinyin: r.row.pinyin,
        meaning: r.row.meaning,
        hsk_level: r.row.hsk_level,
        example: r.row.example,
        example_pinyin: r.row.example_pinyin,
        example_meaning: r.row.example_meaning,
      }));

      const result = await this.vocabService.addCards(cards);

      if (result.errors.length > 0) {
        this.importStatus.set({ type: 'error', msg: `Import: ${result.inserted} thành công, ${result.errors.length} lỗi.` });
      } else {
        this.importStatus.set({ type: 'success', msg: `Import thành công ${result.inserted} từ vựng!` });
      }

      this.showPreview.set(false);
      this.importFile.set(null);
      this.parsedRows.set([]);
      this.loadBrowseCards();
    } catch (e: any) {
      this.importStatus.set({ type: 'error', msg: e.message || 'Lỗi import.' });
    } finally {
      this.importing.set(false);
      setTimeout(() => this.importStatus.set(null), 5000);
    }
  }

  cancelImport() {
    this.showPreview.set(false);
    this.importFile.set(null);
    this.parsedRows.set([]);
  }

  downloadTemplate(type: 'csv' | 'xlsx') {
    if (type === 'csv') {
      downloadCsvTemplate();
    } else {
      downloadXlsxTemplate();
    }
  }

  // === Browse Methods ===

  async loadBrowseCards() {
    this.browseLoading.set(true);
    try {
      if (this.browseLevel() === 0) {
        // Load all cards — fetch each level
        const allCards: VocabCard[] = [];
        for (let i = 1; i <= 9; i++) {
          const cards = await this.vocabService.getVocabByLevel(i);
          allCards.push(...cards);
        }
        this.browseCards.set(allCards);
      } else {
        const cards = await this.vocabService.getVocabByLevel(this.browseLevel());
        this.browseCards.set(cards);
      }
    } catch (e) {
      console.error('Error loading browse cards:', e);
    } finally {
      this.browseLoading.set(false);
    }
  }

  setBrowseLevel(level: number) {
    this.browseLevel.set(level);
    this.selectedIds.set(new Set());
    this.currentPage.set(1);
    this.cancelEdit();
    this.loadBrowseCards();
  }

  toggleSelection(id: number) {
    const set = new Set(this.selectedIds());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.selectedIds.set(set);
  }

  async deleteSelected() {
    if (this.selectedIds().size === 0) return;
    const count = this.selectedIds().size;
    if (!confirm(`Bạn có chắc muốn xóa ${count} từ đã chọn?`)) return;

    try {
      await this.vocabService.deleteCards(Array.from(this.selectedIds()));
      this.selectedIds.set(new Set());
      this.toastService.success(`Đã xóa thành công ${count} từ vựng.`);
      this.loadBrowseCards();
    } catch (e: any) {
      console.error('Error deleting cards:', e);
      this.toastService.error(`Lỗi khi xóa từ: ${e.message}`);
    }
  }

  async deleteCard(id: number) {
    if (!confirm('Xóa từ vựng này?')) return;
    const res = await this.vocabService.deleteCard(id);
    if (res.success) {
      this.toastService.success('Đã xóa từ vựng thành công.');
      this.loadBrowseCards();
    } else {
      this.toastService.error(`Xóa thất bại: ${res.error}`);
    }
  }

  // === Pagination Methods ===

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.cancelEdit();
    }
  }

  prevPage() {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage() {
    this.goToPage(this.currentPage() + 1);
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
      range.push(i);
    }
    return range;
  }

  // === In-row Editing Methods ===

  startEdit(card: VocabCard) {
    if (!card.id) return;
    this.editingCardId.set(card.id);
    this.editingForm = {
      hanzi: card.hanzi,
      pinyin: card.pinyin,
      meaning: card.meaning,
      hsk_level: card.hsk_level,
      example: card.example || '',
    };
  }

  cancelEdit() {
    this.editingCardId.set(null);
  }

  async saveInlineEdit(id: number) {
    const { hanzi, pinyin, meaning, hsk_level, example } = this.editingForm;
    if (!hanzi.trim() || !pinyin.trim() || !meaning.trim()) {
      this.toastService.error('Vui lòng điền đủ Hán tự, Pinyin và Nghĩa.');
      return;
    }

    try {
      const res = await this.vocabService.updateCard(id, {
        hanzi: hanzi.trim(),
        pinyin: pinyin.trim(),
        meaning: meaning.trim(),
        hsk_level: Number(hsk_level),
        example: example.trim() || undefined,
      });

      if (res.success) {
        this.browseCards.update(list => list.map(c => c.id === id ? {
          ...c,
          hanzi: hanzi.trim(),
          pinyin: pinyin.trim(),
          meaning: meaning.trim(),
          hsk_level: Number(hsk_level),
          example: example.trim() || undefined,
        } : c));
        this.editingCardId.set(null);
        this.toastService.success(`Đã cập nhật từ vựng "${hanzi.trim()}" thành công!`);
      } else {
        this.toastService.error(`Cập nhật thất bại: ${res.error}`);
      }
    } catch (e: any) {
      this.toastService.error(`Lỗi: ${e.message}`);
    }
  }

  exportCurrentLevel() {
    const level = this.browseLevel();
    const cards = this.browseCards();
    const filename = level === 0 ? 'all_vocab.json' : `hsk${level}_vocab.json`;
    exportAsJson(cards, filename);
  }
}
