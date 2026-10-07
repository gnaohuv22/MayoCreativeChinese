import { Component, ChangeDetectionStrategy, ElementRef, computed, inject, signal, viewChild, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
import { ToastService } from '../../../../services/toast.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { VISIBILITY_LABELS, type ContentVisibility } from '../../../../components/shared/visibility/content-visibility';
import { COURSE_DETAILS } from '../../../courses/data/course-details.data';
import { VOCAB_COLLECTIONS, VOCAB_COLLECTION_KEYS, parseLevelParam, type VocabCollection } from '../../../flashcards/models/vocab-card.model';
import { VocabService, levelVisibility, type VocabVisibilityMap } from '../../../flashcards/services/vocab.service';
import { ClassService } from '../../services/class.service';
import { ClassFormComponent } from '../../components/class-form/class-form';
import { StudentTableComponent } from '../../components/student-table/student-table';
import { StudentImportComponent } from '../../components/student-import/student-import';
import {
  CLASS_STATUS_LABELS,
  STAFF_ROLE_LABELS,
  STUDY_MODE_LABELS,
  type ClassAnnouncement,
  type ClassSuggestion,
  type ExamAttempt,
  type SchoolClass,
  type StaffDirectoryEntry,
  type Student,
  type StudentVocabProgress,
  type SuggestedExamInfo,
} from '../../models/class.model';
import { classStatusClass, formatDate, formatDateTime } from '../../utils/class-display.util';
import { vocabSuggestionLabel, vocabSuggestionParam } from '../../utils/suggestion.util';

type Tab = 'students' | 'announcements' | 'suggestions' | 'results' | 'info';

interface ResultRow {
  student: Student;
  /** exam_id → điểm cao nhất + số lần làm */
  best: Map<string, { score: number; total: number; passing: number | null; count: number }>;
  attempts: number;
  vocab: StudentVocabProgress | undefined;
}

/** /admin/classes/:id */
@Component({
  selector: 'app-class-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, AppIconComponent, ClassFormComponent, StudentTableComponent, StudentImportComponent],
  templateUrl: './class-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassDetailComponent {
  protected readonly auth = inject(AuthService);
  private readonly classService = inject(ClassService);
  private readonly vocabService = inject(VocabService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** Tham số route :id */
  readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map(p => p.get('id') ?? '')), { initialValue: '' });

  private readonly formDialog = viewChild.required<ElementRef<HTMLDialogElement>>('formDialog');
  private readonly importDialog = viewChild.required<ElementRef<HTMLDialogElement>>('importDialog');
  private readonly confirmDialog = viewChild.required<ElementRef<HTMLDialogElement>>('confirmDialog');

  protected readonly statusLabels = CLASS_STATUS_LABELS;
  protected readonly modeLabels = STUDY_MODE_LABELS;
  protected readonly roleLabels = STAFF_ROLE_LABELS;
  protected readonly visibilityLabels = VISIBILITY_LABELS;
  protected readonly statusClass = classStatusClass;
  protected readonly formatDate = formatDate;
  protected readonly formatDateTime = formatDateTime;
  protected readonly collections = VOCAB_COLLECTION_KEYS.map(k => ({ key: k, label: VOCAB_COLLECTIONS[k].shortLabel }));
  protected readonly vocabLabel = vocabSuggestionLabel;

  readonly tab = signal<Tab>('students');
  readonly cls = signal<SchoolClass | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly directory = signal<StaffDirectoryEntry[]>([]);
  readonly students = signal<Student[]>([]);
  readonly announcements = signal<ClassAnnouncement[]>([]);
  readonly suggestions = signal<ClassSuggestion[]>([]);
  readonly attempts = signal<ExamAttempt[]>([]);
  readonly vocabProgress = signal<StudentVocabProgress[]>([]);
  readonly exams = signal<SuggestedExamInfo[]>([]);
  readonly vocabVisibility = signal<VocabVisibilityMap>(new Map());
  readonly busy = signal(false);
  readonly formOpen = signal(false);
  readonly importOpen = signal(false);
  readonly confirmAction = signal<'archive' | 'restore' | 'delete' | null>(null);

  readonly courseName = computed(() => COURSE_DETAILS.find(c => c.slug === this.cls()?.course_slug)?.name ?? '');
  readonly activeStudents = computed(() => this.students().filter(s => s.status !== 'archived'));
  readonly archivedStudents = computed(() => this.students().filter(s => s.status === 'archived'));
  readonly showArchivedStudents = signal(false);
  readonly staffList = computed(() => {
    const byId = new Map(this.directory().map(d => [d.user_id, d]));
    return (this.cls()?.staff ?? [])
      .map(s => ({ ...s, name: byId.get(s.user_id)?.full_name || byId.get(s.user_id)?.username || 'Nhân sự' }))
      .sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === 'teacher' ? -1 : 1));
  });

  // Thông báo
  announcementForm = { id: '', title: '', body: '', pinned: false };
  readonly editingAnnouncement = signal(false);

  // Gợi ý
  readonly examToSuggest = signal('');
  readonly vocabCollection = signal<VocabCollection>('hsk2');
  readonly vocabParam = signal('');
  readonly vocabParams = computed(() => VOCAB_COLLECTIONS[this.vocabCollection()].levelParams);
  readonly unsuggestedExams = computed(() => {
    const taken = new Set(this.suggestions().map(s => s.exam_id));
    return this.exams().filter(e => !taken.has(e.id));
  });
  readonly suggestedExams = computed(() => this.suggestions().filter(s => s.kind === 'exam' && s.exam));
  readonly suggestedVocab = computed(() => this.suggestions().filter(s => s.kind === 'vocab'));

  // Kết quả
  readonly resultRows = computed<ResultRow[]>(() => {
    const vocab = new Map(this.vocabProgress().map(v => [v.student_id, v]));
    return this.activeStudents().map(student => {
      const best = new Map<string, { score: number; total: number; passing: number | null; count: number }>();
      let attempts = 0;
      for (const a of this.attempts()) {
        if (a.student_id !== student.user_id) continue;
        attempts++;
        const prev = best.get(a.exam_id);
        best.set(a.exam_id, {
          score: Math.max(prev?.score ?? 0, Number(a.score)),
          total: Number(a.total_score),
          passing: a.passing_score == null ? null : Number(a.passing_score),
          count: (prev?.count ?? 0) + 1,
        });
      }
      return { student, best, attempts, vocab: vocab.get(student.user_id) };
    });
  });
  readonly studentNames = computed(() => new Map(this.students().map(s => [s.user_id, s.full_name])));

  constructor() {
    effect(() => {
      const id = this.id();
      if (id) this.load(id);
    });
  }

  async load(id: string) {
    this.loading.set(true);
    const [res, directory] = await Promise.all([this.classService.getClass(id), this.classService.staffDirectory()]);
    this.directory.set(directory);
    this.cls.set(res.data);
    this.notFound.set(!res.data);
    this.loading.set(false);
    if (!res.data) return;
    await Promise.all([this.loadStudents(), this.loadAnnouncements(), this.loadSuggestions(), this.loadResults()]);
  }

  async reloadClass() {
    const res = await this.classService.getClass(this.id());
    if (res.data) this.cls.set(res.data);
  }

  async loadStudents() {
    const res = await this.classService.listStudents(this.id());
    this.students.set(res.data);
    if (res.error) this.toast.error(res.error);
  }

  async loadAnnouncements() {
    this.announcements.set(await this.classService.listAnnouncements(this.id()));
  }

  async loadSuggestions() {
    const [suggestions, exams, visibility] = await Promise.all([
      this.classService.listSuggestions(this.id()),
      this.classService.suggestableExams(),
      this.vocabService.getVisibility(),
    ]);
    this.suggestions.set(suggestions);
    this.exams.set(exams);
    this.vocabVisibility.set(visibility);
  }

  async loadResults() {
    const [attempts, vocab] = await Promise.all([this.classService.listAttempts(this.id()), this.classService.vocabProgress(this.id())]);
    this.attempts.set(attempts);
    this.vocabProgress.set(vocab);
  }

  async onStudentsChanged() {
    await Promise.all([this.loadStudents(), this.reloadClass()]);
  }

  // ---------------------------------------------------------------------------
  // Sửa / lưu trữ / xoá lớp
  // ---------------------------------------------------------------------------
  openEdit() {
    this.formOpen.set(true);
    this.formDialog().nativeElement.showModal();
  }

  closeEdit() {
    this.formDialog().nativeElement.close();
  }

  async onSaved() {
    this.closeEdit();
    this.toast.success('Đã lưu thông tin lớp.');
    await this.reloadClass();
  }

  openConfirm(action: 'archive' | 'restore' | 'delete') {
    this.confirmAction.set(action);
    this.confirmDialog().nativeElement.showModal();
  }

  async runConfirm() {
    const action = this.confirmAction();
    const c = this.cls();
    if (!action || !c) return;
    this.busy.set(true);
    const res = action === 'delete' ? await this.classService.deleteClass(c.id) : await this.classService.setArchived(c.id, action === 'archive');
    this.busy.set(false);
    if (res.error) {
      this.toast.error(res.error);
      return;
    }
    this.confirmDialog().nativeElement.close();
    if (action === 'delete') {
      this.toast.success(`Đã xoá lớp ${c.code}.`);
      await this.router.navigateByUrl('/admin/classes');
      return;
    }
    this.toast.success(action === 'archive' ? `Đã lưu trữ lớp ${c.code}.` : `Đã khôi phục lớp ${c.code}.`);
    await this.reloadClass();
  }

  // ---------------------------------------------------------------------------
  // Thêm học viên
  // ---------------------------------------------------------------------------
  openImport() {
    this.importOpen.set(true);
    this.importDialog().nativeElement.showModal();
  }

  closeImport() {
    this.importDialog().nativeElement.close();
  }

  /** Esc đóng hộp thoại → huỷ component (xoá mật khẩu vừa tạo khỏi bộ nhớ) */
  onImportClosed() {
    this.importOpen.set(false);
  }

  // ---------------------------------------------------------------------------
  // Thông báo
  // ---------------------------------------------------------------------------
  editAnnouncement(a: ClassAnnouncement) {
    this.announcementForm = { id: a.id, title: a.title, body: a.body, pinned: a.pinned };
    this.editingAnnouncement.set(true);
  }

  resetAnnouncement() {
    this.announcementForm = { id: '', title: '', body: '', pinned: false };
    this.editingAnnouncement.set(false);
  }

  async saveAnnouncement() {
    if (!this.announcementForm.title.trim()) return;
    this.busy.set(true);
    const res = await this.classService.saveAnnouncement({
      id: this.announcementForm.id || undefined,
      class_id: this.id(),
      title: this.announcementForm.title,
      body: this.announcementForm.body,
      pinned: this.announcementForm.pinned,
    });
    this.busy.set(false);
    if (res.error) {
      this.toast.error(res.error);
      return;
    }
    this.toast.success(this.announcementForm.id ? 'Đã lưu thông báo.' : 'Đã đăng thông báo.');
    this.resetAnnouncement();
    await this.loadAnnouncements();
  }

  async deleteAnnouncement(a: ClassAnnouncement) {
    if (!confirm(`Xoá thông báo "${a.title}"?`)) return;
    const res = await this.classService.deleteAnnouncement(a.id);
    if (res.error) {
      this.toast.error(res.error);
      return;
    }
    if (this.announcementForm.id === a.id) this.resetAnnouncement();
    await this.loadAnnouncements();
  }

  authorName(userId: string | null): string {
    const d = this.directory().find(x => x.user_id === userId);
    return d ? d.full_name || d.username : '';
  }

  // ---------------------------------------------------------------------------
  // Gợi ý
  // ---------------------------------------------------------------------------
  async addExamSuggestion() {
    const examId = this.examToSuggest();
    if (!examId) return;
    const res = await this.classService.suggestExam(this.id(), examId);
    if (res.error) {
      this.toast.error(res.error);
      return;
    }
    this.examToSuggest.set('');
    await this.loadSuggestions();
  }

  setVocabCollection(col: VocabCollection) {
    this.vocabCollection.set(col);
    this.vocabParam.set('');
  }

  async addVocabSuggestion() {
    const param = this.vocabParam();
    if (!param) return;
    const res = await this.classService.suggestVocab(this.id(), this.vocabCollection(), parseLevelParam(param));
    if (res.error) {
      this.toast.error(res.error);
      return;
    }
    this.vocabParam.set('');
    await this.loadSuggestions();
  }

  async removeSuggestion(s: ClassSuggestion) {
    const res = await this.classService.deleteSuggestion(s.id);
    if (res.error) {
      this.toast.error(res.error);
      return;
    }
    await this.loadSuggestions();
  }

  vocabVisibilityOf(s: ClassSuggestion): ContentVisibility {
    return s.collection ? levelVisibility(this.vocabVisibility(), s.collection, vocabSuggestionParam(s)) : 'public';
  }

  levelLabel(col: VocabCollection, param: string): string {
    return `${VOCAB_COLLECTIONS[col].levelPrefix} ${param}`;
  }

  visibilityChipClass(v: ContentVisibility): string {
    return {
      private: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
      staff: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
      students: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
      public: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    }[v];
  }

  // ---------------------------------------------------------------------------
  scoreClass(cell: { score: number; passing: number | null }): string {
    if (cell.passing == null) return 'text-brand-navy dark:text-white';
    return cell.score >= cell.passing ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
  }

  formatDuration(secs: number | null): string {
    if (!secs) return '';
    const m = Math.round(secs / 60);
    return `${m} phút`;
  }
}
