import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VocabService, type NewVocabCard } from '../../services/vocab.service';
import { ImportPreviewComponent } from '../../components/import-preview/import-preview';
import { DuplicateConfirmComponent, type DuplicateHanziItem } from '../../components/duplicate-confirm/duplicate-confirm';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { VocabVisibilityComponent } from '../../components/vocab-visibility/vocab-visibility';
import { ToastService } from '../../../../services/toast.service';
import { AuthService } from '../../../../services/auth.service';
import { VOCAB_COLLECTIONS, VOCAB_COLLECTION_KEYS, collectionLevels, vocabEntryKey } from '../../models/vocab-card.model';
import type { ParsedImportRow, VocabCard, ValidatedImportRow, VocabCollection } from '../../models/vocab-card.model';
import { parseFile, validateRows } from '../../utils/file-parser.util';
import { downloadCsvTemplate, downloadXlsxTemplate, exportAsJson } from '../../utils/template-generator.util';

/** Dữ liệu cho hộp thoại xác nhận thêm từ cùng Hán tự khác nghĩa */
interface DupDialogState {
  items: DuplicateHanziItem[];
  collection: VocabCollection;
  totalCount: number;
  onConfirmAll: () => Promise<void>;
  onSkip?: () => Promise<void>;
}

@Component({
  selector: 'app-flashcard-manage',
  standalone: true,
  imports: [FormsModule, ImportPreviewComponent, DuplicateConfirmComponent, AppIconComponent, VocabVisibilityComponent],
  templateUrl: './flashcard-manage.html',
  styleUrl: './flashcard-manage.css',
})
export class FlashcardManageComponent implements OnInit {
  protected readonly Math = Math;
  private vocabService = inject(VocabService);
  private toastService = inject(ToastService);
  private readonly auth = inject(AuthService);
  protected readonly canDelete = computed(() => this.auth.can('content.delete'));

  activeTab = signal<'add' | 'import' | 'browse' | 'visibility'>('add');

  /** 4 bộ từ vựng độc lập */
  readonly collections = VOCAB_COLLECTION_KEYS.map(key => VOCAB_COLLECTIONS[key]);
  readonly allLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  dupDialog = signal<DupDialogState | null>(null);
  dupBusy = signal(false);

  // Tab: Add
  newCollection = signal<VocabCollection>('hsk2');
  newHanzi = signal('');
  newPinyin = signal('');
  newMeaning = signal('');
  newLevel = signal<number>(1);
  newLessonNumber = signal<number | null>(null);
  newLessonTitle = signal<string>('');
  newTopic = signal<string>('');
  newExample = signal('');
  newExamplePinyin = signal('');
  newExampleMeaning = signal('');
  addStatus = signal<{ type: 'success' | 'error'; msg: string } | null>(null);
  addLoading = signal(false);

  // Tab: Import
  importCollection = signal<VocabCollection>('hsk2');
  private rawImportRows: ParsedImportRow[] = [];
  importFile = signal<File | null>(null);
  parsedRows = signal<ValidatedImportRow[]>([]);
  showPreview = signal(false);
  importing = signal(false);
  importStatus = signal<{ type: 'success' | 'error'; msg: string } | null>(null);
  dragOver = signal(false);

  // Tab: Browse
  browseCollection = signal<VocabCollection | 'all'>('all');
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
  editingForm = this.emptyEditForm();

  filteredBrowseCards = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.browseCards();

    if (!query) return list;
    return list.filter(
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

  levelsOf(collection: VocabCollection | 'all'): number[] {
    return collection === 'all' ? this.allLevels : collectionLevels(collection);
  }

  collectionLabel(collection: VocabCollection | null | undefined): string {
    return VOCAB_COLLECTIONS[collection || 'hsk2'].shortLabel;
  }

  // === Add Methods ===

  setNewCollection(collection: VocabCollection) {
    this.newCollection.set(collection);
    const levels = collectionLevels(collection);
    if (!levels.includes(Number(this.newLevel()))) this.newLevel.set(levels[0]);
  }

  async submitCard() {
    const hanzi = this.newHanzi().trim();
    const pinyin = this.newPinyin().trim();
    const meaning = this.newMeaning().trim();

    if (!hanzi || !pinyin || !meaning) {
      this.showAddStatus('error', 'Vui lòng điền các trường bắt buộc (Hán tự, Pinyin, Nghĩa).');
      return;
    }

    const collection = this.newCollection();
    const card: NewVocabCard = {
      collection,
      hanzi,
      pinyin,
      meaning,
      hsk_level: Number(this.newLevel()),
      lesson_number: collection === 'hsk3' && this.newLessonNumber() ? Number(this.newLessonNumber()) : null,
      lesson_title: collection === 'hsk3' ? this.newLessonTitle().trim() || null : null,
      topic: collection === 'supplement' ? this.newTopic().trim() || null : null,
      example: cleanMultiline(this.newExample()),
      example_pinyin: cleanMultiline(this.newExamplePinyin()),
      example_meaning: cleanMultiline(this.newExampleMeaning()),
    };

    this.addLoading.set(true);
    try {
      // Cùng Hán tự trong cùng bộ + cấp: trùng hoàn toàn → báo lỗi; khác pinyin/nghĩa → hỏi xác nhận
      const same = await this.vocabService.findSameHanzi(collection, card.hsk_level, hanzi);
      const key = vocabEntryKey(card);
      if (same.some(c => vocabEntryKey(c) === key)) {
        this.showAddStatus('error', `"${hanzi}" (${pinyin} — ${meaning}) đã có trong ${this.collectionLabel(collection)} cấp ${card.hsk_level}.`);
        return;
      }
      if (same.length > 0) {
        this.dupDialog.set({
          items: [{ hanzi, pinyin, meaning, level: card.hsk_level, existing: same.map(c => ({ pinyin: c.pinyin, meaning: c.meaning })) }],
          collection,
          totalCount: 1,
          onConfirmAll: () => this.insertCard(card),
        });
        return;
      }
      await this.insertCard(card);
    } catch (e: any) {
      this.showAddStatus('error', e.message || 'Có lỗi xảy ra.');
    } finally {
      this.addLoading.set(false);
    }
  }

  private async insertCard(card: NewVocabCard) {
    const result = await this.vocabService.addCard(card);
    if (result.success) {
      this.showAddStatus('success', `Đã thêm "${card.hanzi}" (${card.meaning}) vào ${this.collectionLabel(card.collection)}!`);
      this.resetAddForm();
      this.loadBrowseCards();
    } else {
      this.showAddStatus('error', result.error ?? 'Có lỗi xảy ra.');
    }
  }

  private showAddStatus(type: 'success' | 'error', msg: string) {
    this.addStatus.set({ type, msg });
    setTimeout(() => this.addStatus.set(null), 4000);
  }

  private resetAddForm() {
    this.newHanzi.set('');
    this.newPinyin.set('');
    this.newMeaning.set('');
    this.newExample.set('');
    this.newExamplePinyin.set('');
    this.newExampleMeaning.set('');
    // Giữ bộ, cấp, bài, chủ đề để nhập liên tiếp nhiều từ cùng nhóm
  }

  // === Duplicate dialog ===

  async confirmDupAll() {
    await this.closeDupWith(d => d.onConfirmAll());
  }

  async confirmDupSkip() {
    await this.closeDupWith(d => d.onSkip?.() ?? Promise.resolve());
  }

  cancelDup() {
    if (this.dupBusy()) return;
    this.dupDialog.set(null);
  }

  private async closeDupWith(action: (d: DupDialogState) => Promise<void>) {
    const d = this.dupDialog();
    if (!d) return;
    this.dupBusy.set(true);
    try {
      await action(d);
    } finally {
      this.dupBusy.set(false);
      this.dupDialog.set(null);
    }
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
    input.value = '';
  }

  private async processFile(file: File) {
    this.importFile.set(file);
    this.importStatus.set(null);

    try {
      this.rawImportRows = await parseFile(file);
      await this.validateImport();
      this.showPreview.set(true);
    } catch (e: any) {
      this.importStatus.set({ type: 'error', msg: e.message || 'Không thể đọc file.' });
    }
  }

  /** Kiểm tra các dòng với dữ liệu hiện có của bộ đang chọn */
  private async validateImport() {
    const collection = this.importCollection();
    const allowed = collectionLevels(collection);
    const levels = [...new Set(this.rawImportRows.map(r => r.hsk_level))].filter(l => allowed.includes(l));
    const existing = await this.vocabService.getExistingVocabKeys(collection, levels);
    this.parsedRows.set(validateRows(this.rawImportRows, existing, collection));
  }

  async setImportCollection(collection: VocabCollection) {
    this.importCollection.set(collection);
    if (this.rawImportRows.length === 0) return;
    try {
      await this.validateImport();
    } catch (e: any) {
      this.importStatus.set({ type: 'error', msg: e.message || 'Không thể kiểm tra dữ liệu.' });
    }
  }

  onImportConfirm(rows: ValidatedImportRow[]) {
    const flagged = rows.filter(r => r.sameHanziMatches?.length);
    if (flagged.length === 0) {
      this.runImport(rows);
      return;
    }

    this.dupDialog.set({
      items: flagged.map(r => ({
        hanzi: r.row.hanzi,
        pinyin: r.row.pinyin,
        meaning: r.row.meaning,
        level: r.row.hsk_level,
        existing: r.sameHanziMatches!,
      })),
      collection: this.importCollection(),
      totalCount: rows.length,
      onConfirmAll: () => this.runImport(rows),
      onSkip: () => this.runImport(rows.filter(r => !r.sameHanziMatches?.length)),
    });
  }

  private async runImport(rows: ValidatedImportRow[]) {
    const collection = this.importCollection();
    this.importing.set(true);
    try {
      const cards: NewVocabCard[] = rows.map(r => ({
        collection,
        hanzi: r.row.hanzi,
        pinyin: r.row.pinyin,
        meaning: r.row.meaning,
        hsk_level: r.row.hsk_level,
        lesson_number: collection === 'hsk3' ? r.row.lesson_number ?? null : null,
        lesson_title: collection === 'hsk3' ? r.row.lesson_title ?? null : null,
        topic: collection === 'supplement' ? r.row.topic ?? null : null,
        example: r.row.example ?? null,
        example_pinyin: r.row.example_pinyin ?? null,
        example_meaning: r.row.example_meaning ?? null,
      }));

      const result = cards.length > 0 ? await this.vocabService.addCards(cards) : { inserted: 0, errors: [] };

      if (result.errors.length > 0) {
        this.importStatus.set({ type: 'error', msg: `Import: ${result.inserted} thành công, lỗi: ${result.errors[0]}` });
      } else {
        this.importStatus.set({ type: 'success', msg: `Đã thêm ${result.inserted} từ vựng vào ${this.collectionLabel(collection)}!` });
      }

      this.cancelImport();
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
    this.rawImportRows = [];
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
      this.browseCards.set(await this.vocabService.getVocabForManage(this.browseCollection(), this.browseLevel()));
    } catch (e) {
      console.error('Error loading browse cards:', e);
    } finally {
      this.browseLoading.set(false);
    }
  }

  setBrowseCollection(collection: VocabCollection | 'all') {
    this.browseCollection.set(collection);
    if (this.browseLevel() && !this.levelsOf(collection).includes(this.browseLevel())) {
      this.browseLevel.set(0);
    }
    this.selectedIds.set(new Set());
    this.currentPage.set(1);
    this.cancelEdit();
    this.loadBrowseCards();
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
      const res = await this.vocabService.deleteCards(Array.from(this.selectedIds()));
      if (!res.success) {
        this.toastService.error(`Lỗi khi xóa từ: ${res.error}`);
        return;
      }
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

  private emptyEditForm() {
    return {
      collection: 'hsk2' as VocabCollection,
      hanzi: '',
      pinyin: '',
      meaning: '',
      hsk_level: 1,
      lesson_number: null as number | null,
      topic: '',
      example: '',
      example_pinyin: '',
      example_meaning: '',
    };
  }

  startEdit(card: VocabCard) {
    if (!card.id) return;
    this.editingCardId.set(card.id);
    this.editingForm = {
      collection: card.collection || 'hsk2',
      hanzi: card.hanzi,
      pinyin: card.pinyin,
      meaning: card.meaning,
      hsk_level: card.hsk_level,
      lesson_number: card.lesson_number ?? null,
      topic: card.topic || '',
      example: card.example || '',
      example_pinyin: card.example_pinyin || '',
      example_meaning: card.example_meaning || '',
    };
  }

  cancelEdit() {
    this.editingCardId.set(null);
  }

  async saveInlineEdit(id: number) {
    const f = this.editingForm;
    if (!f.hanzi.trim() || !f.pinyin.trim() || !f.meaning.trim()) {
      this.toastService.error('Vui lòng điền đủ Hán tự, Pinyin và Nghĩa.');
      return;
    }
    if (!collectionLevels(f.collection).includes(Number(f.hsk_level))) {
      this.toastService.error(`${this.collectionLabel(f.collection)} không có cấp ${f.hsk_level}.`);
      return;
    }

    const changes: Partial<VocabCard> & { collection: VocabCollection } = {
      collection: f.collection,
      hanzi: f.hanzi.trim(),
      pinyin: f.pinyin.trim(),
      meaning: f.meaning.trim(),
      hsk_level: Number(f.hsk_level),
      lesson_number: f.collection === 'hsk3' && f.lesson_number ? Number(f.lesson_number) : null,
      topic: f.collection === 'supplement' ? f.topic.trim() || null : null,
      example: cleanMultiline(f.example),
      example_pinyin: cleanMultiline(f.example_pinyin),
      example_meaning: cleanMultiline(f.example_meaning),
    };

    try {
      const res = await this.vocabService.updateCard(id, changes);

      if (res.success) {
        this.browseCards.update(list => list.map(c => (c.id === id ? { ...c, ...changes } : c)));
        this.editingCardId.set(null);
        this.toastService.success(`Đã cập nhật từ vựng "${changes.hanzi}" thành công!`);
      } else {
        this.toastService.error(`Cập nhật thất bại: ${res.error}`);
      }
    } catch (e: any) {
      this.toastService.error(`Lỗi: ${e.message}`);
    }
  }

  exportCurrentLevel() {
    const col = this.browseCollection();
    const level = this.browseLevel();
    const filename = `${col === 'all' ? 'all' : col}_${level === 0 ? 'all-levels' : `hsk${level}`}_vocab.json`;
    exportAsJson(this.browseCards(), filename);
  }
}

/** Giữ xuống dòng (nhiều ví dụ), bỏ khoảng trắng thừa từng dòng */
function cleanMultiline(value: string): string | null {
  const text = value.split(/\r?\n/).map(l => l.trim()).join('\n').trim();
  return text || null;
}
