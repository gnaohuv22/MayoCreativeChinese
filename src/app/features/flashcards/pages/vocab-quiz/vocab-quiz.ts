import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { SpeakButtonComponent } from '../../components/speak-button/speak-button';
import { VocabService } from '../../services/vocab.service';
import { ProgressService } from '../../services/progress.service';
import { SpeechService } from '../../services/speech.service';
import { VOCAB_COLLECTIONS } from '../../models/vocab-card.model';
import type { VocabCard, VocabCollection, VocabScope } from '../../models/vocab-card.model';
import { scopeFromRoute, scopeRoutes, scopeTitle } from '../../utils/vocab-scope.util';
import { QUIZ_OPTION_COUNT, QUIZ_TYPES, QUIZ_TYPE_LABELS, buildQuiz } from '../../utils/quiz.util';
import type { QuizQuestion, QuizType } from '../../utils/quiz.util';

interface AnsweredQuestion {
  question: QuizQuestion;
  chosen: number;
  correct: boolean;
}

/** Số câu mỗi bài (0 = tất cả) */
const COUNT_OPTIONS = [10, 20, 30, 0];

/** Luyện tập trắc nghiệm kiểu Quizlet: các dạng câu trộn ngẫu nhiên, 4 đáp án */
@Component({
  selector: 'app-vocab-quiz',
  standalone: true,
  imports: [RouterLink, NavHeaderComponent, AppIconComponent, SpeakButtonComponent],
  templateUrl: './vocab-quiz.html',
  styleUrl: './vocab-quiz.css',
})
export class VocabQuizComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private vocabService = inject(VocabService);
  private progressService = inject(ProgressService);
  readonly speech = inject(SpeechService);

  readonly typeLabels = QUIZ_TYPE_LABELS;
  readonly allTypes = QUIZ_TYPES;
  readonly countOptions = COUNT_OPTIONS;
  readonly optionKeys = ['A', 'B', 'C', 'D'];

  scope = signal<VocabScope>({ collection: 'hsk2', levelParam: '1' });
  pageTitle = computed(() => `Trắc nghiệm ${scopeTitle(this.scope())}`);
  routes = computed(() => scopeRoutes(this.scope()));
  backLink = computed(() => this.routes().study.join('/'));

  cards = signal<VocabCard[]>([]);
  loading = signal(true);
  phase = signal<'setup' | 'playing' | 'result'>('setup');

  // Setup
  selectedTypes = signal<Set<QuizType>>(new Set(QUIZ_TYPES));
  questionCount = signal<number>(10);
  enoughCards = computed(() => this.cards().length >= QUIZ_OPTION_COUNT);

  // Playing
  questions = signal<QuizQuestion[]>([]);
  index = signal(0);
  chosen = signal<number | null>(null);
  answers = signal<AnsweredQuestion[]>([]);

  current = computed(() => this.questions()[this.index()] ?? null);
  revealed = computed(() => this.chosen() !== null);
  isLast = computed(() => this.index() >= this.questions().length - 1);
  correctCount = computed(() => this.answers().filter(a => a.correct).length);
  wrongAnswers = computed(() => this.answers().filter(a => !a.correct));
  scorePercent = computed(() => {
    const total = this.answers().length;
    return total ? Math.round((this.correctCount() / total) * 100) : 0;
  });

  ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const collection = (this.route.snapshot.data['collection'] as VocabCollection) || 'hsk2';
      this.scope.set(scopeFromRoute(collection, params));
      this.phase.set('setup');
      await this.loadCards();
    });
  }

  private async loadCards() {
    this.loading.set(true);
    try {
      const cards = await this.vocabService.getVocabForScope(this.scope());
      this.cards.set(cards);
      if (this.questionCount() && cards.length < this.questionCount()) this.questionCount.set(0);
    } catch (e) {
      console.error('Failed to load quiz cards', e);
    } finally {
      this.loading.set(false);
    }
  }

  toggleType(type: QuizType) {
    this.selectedTypes.update(set => {
      const next = new Set(set);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  countLabel(n: number): string {
    return n === 0 ? `Tất cả (${this.cards().length})` : `${n} câu`;
  }

  start(cards: VocabCard[] = this.cards(), count = this.questionCount() || cards.length) {
    // Đáp án nhiễu luôn lấy từ toàn bộ phạm vi, kể cả khi chỉ làm lại câu sai
    const questions = buildQuiz(cards, [...this.selectedTypes()], Math.min(count, cards.length), this.cards());
    if (questions.length === 0) return;
    this.questions.set(questions);
    this.answers.set([]);
    this.index.set(0);
    this.chosen.set(null);
    this.phase.set('playing');
  }

  retryWrong() {
    const wrong = this.wrongAnswers().map(a => a.question.card);
    this.start(wrong, wrong.length);
  }

  choose(optionIndex: number) {
    const q = this.current();
    if (!q || this.revealed()) return;
    const correct = optionIndex === q.answerIndex;
    this.chosen.set(optionIndex);
    this.answers.update(list => [...list, { question: q, chosen: optionIndex, correct }]);

    if (correct) {
      this.speech.speak(q.card.hanzi);
    } else {
      // Trả lời sai → đánh dấu "Khó" để hiện trong bộ lọc "Cần ôn lại" của flashcard
      this.progressService
        .updateConfidence(q.card, 1, VOCAB_COLLECTIONS[this.scope().collection].version)
        .catch(err => console.error('Failed to save quiz progress', err));
    }
  }

  next() {
    if (!this.revealed()) return;
    if (this.isLast()) {
      this.speech.stop();
      this.phase.set('result');
      return;
    }
    this.index.update(i => i + 1);
    this.chosen.set(null);
  }

  backToSetup() {
    this.speech.stop();
    this.phase.set('setup');
  }

  /** Nội dung câu hỏi (trừ dạng Nghe) */
  promptText(q: QuizQuestion): string {
    return q.type === 'meaning_hanzi' ? q.card.meaning : q.card.hanzi;
  }

  promptHint(q: QuizQuestion): string {
    switch (q.type) {
      case 'hanzi_meaning': return 'Chọn nghĩa đúng của từ';
      case 'meaning_hanzi': return 'Chọn chữ Hán đúng với nghĩa';
      case 'hanzi_pinyin': return 'Chọn phiên âm (thanh điệu) đúng';
    }
  }

  /** Đáp án dạng chữ Hán hiển thị cỡ lớn */
  isHanziOption(q: QuizQuestion): boolean {
    return q.type === 'meaning_hanzi';
  }

  optionState(i: number): 'correct' | 'wrong' | 'idle' | 'dim' {
    const q = this.current();
    if (!q || !this.revealed()) return 'idle';
    if (i === q.answerIndex) return 'correct';
    if (i === this.chosen()) return 'wrong';
    return 'dim';
  }

  @HostListener('window:keydown', ['$event'])
  onKey(event: KeyboardEvent) {
    if (this.phase() !== 'playing') return;
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

    const n = Number(event.key);
    if (n >= 1 && n <= QUIZ_OPTION_COUNT) {
      this.choose(n - 1);
    } else if (event.key === 'Enter' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    } else if (event.key.toLowerCase() === 'p') {
      this.speech.speak(this.current()?.card.hanzi);
    }
  }
}
