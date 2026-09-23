import { Component, computed, inject, OnInit, signal, HostListener } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { VocabCardComponent } from '../../components/vocab-card/vocab-card';
import { VocabService } from '../../services/vocab.service';
import { ProgressService } from '../../services/progress.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import type { VocabCard, CardProgress, HskVersion, VocabCollection } from '../../models/vocab-card.model';

@Component({
  selector: 'app-flashcard-study',
  standalone: true,
  imports: [NavHeaderComponent, VocabCardComponent, RouterLink, AppIconComponent],
  templateUrl: './flashcard-study.html',
  styleUrl: './flashcard-study.css',
})
export class FlashcardStudyComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private vocabService = inject(VocabService);
  private progressService = inject(ProgressService);

  collection = signal<VocabCollection>('hsk2');
  level = signal<string>('1');
  lessonNumber = signal<number | null>(null);

  cards = signal<VocabCard[]>([]);
  progressMap = signal<Map<string, CardProgress>>(new Map());
  currentIndex = signal(0);
  flipped = signal(false);
  loading = signal(true);
  shuffled = signal(false);
  filter = signal<'all' | 'new' | 'hard' | 'bookmarked'>('all');
  isTransitioning = signal(false);

  pageTitle = computed(() => {
    const col = this.collection();
    const lvl = this.level();
    const les = this.lessonNumber();

    if (col === 'hsk3') {
      return les ? `NEW HSK ${lvl} — Bài ${les}` : `NEW HSK ${lvl} (Tất cả)`;
    }
    if (col === 'supplement') {
      return `HSK ${lvl} (Bổ sung 2.0 → 3.0)`;
    }
    if (col === 'combined') {
      return `HSK ${lvl} (Tổng hợp 1-9)`;
    }
    return `HSK ${lvl} (2.0)`;
  });

  backLink = computed(() => {
    const col = this.collection();
    const lvl = this.level();
    if (col === 'hsk3') {
      return `/flashcards/hsk3/${lvl}`;
    }
    return `/flashcards/${col}`;
  });

  backLabel = computed(() => {
    if (this.collection() === 'hsk3') {
      return 'Chọn bài học';
    }
    return 'Chọn cấp độ';
  });

  listRoute = computed<string[]>(() => {
    const col = this.collection();
    const lvl = this.level();
    const les = this.lessonNumber();
    if (col === 'hsk3') {
      return ['/flashcards/hsk3', lvl, 'list'];
    }
    return ['/flashcards', col, lvl, 'list'];
  });

  filteredCards = computed(() => {
    const filter = this.filter();
    const cards = this.cards();
    const map = this.progressMap();

    if (filter === 'all') return cards;
    return cards.filter(card => {
      const p = map.get(card.hanzi);
      if (filter === 'new') return !p || p.reviewCount === 0;
      if (filter === 'hard') return p && (p.confidence === 1 || (p.reviewCount > 0 && p.confidence === 0));
      if (filter === 'bookmarked') return p?.bookmarked === true;
      return true;
    });
  });

  currentCard = computed(() => {
    const list = this.filteredCards();
    const idx = this.currentIndex();
    return list.length > 0 && idx < list.length ? list[idx] : null;
  });

  async ngOnInit() {
    this.route.data.subscribe(data => {
      if (data['collection']) {
        this.collection.set(data['collection']);
      }
    });

    this.route.paramMap.subscribe(async params => {
      const lvl = params.get('level') || '1';
      this.level.set(lvl);

      const lesParam = params.get('lesson');
      if (lesParam) {
        this.lessonNumber.set(Number(lesParam));
      } else {
        this.lessonNumber.set(null);
      }

      await this.loadCards();
    });
  }

  async loadCards() {
    this.loading.set(true);
    const col = this.collection();
    const lvl = Number(this.level());
    const les = this.lessonNumber();

    try {
      let vocabList: VocabCard[] = [];
      let ver: HskVersion | undefined;

      if (col === 'hsk2') {
        ver = '2.0';
        vocabList = await this.vocabService.getVocabByLevel(lvl, '2.0');
      } else if (col === 'hsk3') {
        ver = '3.0';
        if (les != null && les > 0) {
          vocabList = await this.vocabService.getVocabByLesson(lvl, '3.0', les);
          // Fallback nếu lesson chưa được đánh số trong DB nhưng getLessonsForLevel chia tự động
          if (vocabList.length === 0) {
            const allLvl = await this.vocabService.getVocabByLevel(lvl, '3.0');
            const WORDS_PER_LESSON = 15;
            const start = (les - 1) * WORDS_PER_LESSON;
            const end = start + WORDS_PER_LESSON;
            vocabList = allLvl.slice(start, end);
          }
        } else {
          vocabList = await this.vocabService.getVocabByLevel(lvl, '3.0');
        }
      } else if (col === 'supplement') {
        ver = '3.0';
        vocabList = await this.vocabService.getSupplementVocab(lvl);
      } else {
        // combined / hsk1_9
        ver = undefined;
        vocabList = await this.vocabService.getVocabByLevel(lvl);
      }

      const progress = await this.progressService.getProgressMap(lvl, ver);

      this.cards.set(vocabList);
      this.progressMap.set(progress);
      this.currentIndex.set(0);
      this.flipped.set(false);
    } catch (error) {
      console.error('Error loading study cards:', error);
    } finally {
      this.loading.set(false);
    }
  }

  flipCard() {
    if (this.isTransitioning()) return;
    this.flipped.update(f => !f);
  }

  nextCard() {
    if (this.isTransitioning()) return;
    if (this.currentIndex() >= this.filteredCards().length - 1) return;

    if (this.flipped()) {
      this.isTransitioning.set(true);
      this.flipped.set(false);
      setTimeout(() => {
        this.currentIndex.update(i => i + 1);
        this.isTransitioning.set(false);
      }, 320);
    } else {
      this.currentIndex.update(i => i + 1);
    }
  }

  prevCard() {
    if (this.isTransitioning()) return;
    if (this.currentIndex() <= 0) return;

    if (this.flipped()) {
      this.isTransitioning.set(true);
      this.flipped.set(false);
      setTimeout(() => {
        this.currentIndex.update(i => i - 1);
        this.isTransitioning.set(false);
      }, 320);
    } else {
      this.currentIndex.update(i => i - 1);
    }
  }

  async rateCard(confidence: 0 | 1 | 2 | 3) {
    if (this.isTransitioning()) return;
    const card = this.currentCard();
    if (!card) return;

    try {
      const hskLevel = Number(this.level());
      const col = this.collection();
      const ver: HskVersion | undefined = col === 'hsk2' ? '2.0' : col === 'hsk3' ? '3.0' : undefined;

      await this.progressService.updateConfidence(card.hanzi, hskLevel, confidence, ver);
      
      const existing = this.progressMap().get(card.hanzi);
      const updated: CardProgress = existing
        ? {
            ...existing,
            confidence,
            reviewCount: existing.reviewCount + 1,
            lastReviewed: Date.now(),
          }
        : {
            hanzi: card.hanzi,
            hskLevel,
            hskVersion: ver,
            confidence,
            reviewCount: 1,
            lastReviewed: Date.now(),
            bookmarked: false,
          };

      this.progressMap.update(map => {
        const newMap = new Map(map);
        newMap.set(card.hanzi, updated);
        return newMap;
      });

      if (this.currentIndex() < this.filteredCards().length - 1) {
        this.nextCard();
      } else {
        this.flipped.set(false);
      }
    } catch (e) {
      console.error('Error rating card', e);
    }
  }

  async toggleBookmark() {
    const card = this.currentCard();
    if (!card) return;
    try {
      const hskLevel = Number(this.level());
      const col = this.collection();
      const ver: HskVersion | undefined = col === 'hsk2' ? '2.0' : col === 'hsk3' ? '3.0' : undefined;

      const newBookmarked = await this.progressService.toggleBookmark(card.hanzi, hskLevel, ver);
      
      const existing = this.progressMap().get(card.hanzi);
      const updated: CardProgress = existing
        ? { ...existing, bookmarked: newBookmarked }
        : {
            hanzi: card.hanzi,
            hskLevel,
            hskVersion: ver,
            confidence: 0,
            reviewCount: 0,
            bookmarked: newBookmarked,
          };

      this.progressMap.update(map => {
        const newMap = new Map(map);
        newMap.set(card.hanzi, updated);
        return newMap;
      });
    } catch (e) {
      console.error('Error toggling bookmark', e);
    }
  }

  toggleShuffle() {
    if (this.isTransitioning()) return;
    const currentIsShuffled = this.shuffled();
    this.cards.update(cards => {
      const newCards = [...cards];
      if (!currentIsShuffled) {
        for (let i = newCards.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
        }
      } else {
        newCards.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
      }
      return newCards;
    });
    this.shuffled.set(!currentIsShuffled);
    this.currentIndex.set(0);
    this.flipped.set(false);
  }

  setFilter(f: 'all' | 'new' | 'hard' | 'bookmarked') {
    this.filter.set(f);
    this.currentIndex.set(0);
    this.flipped.set(false);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      this.nextCard();
    } else if (event.key === 'ArrowLeft') {
      this.prevCard();
    } else if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      this.flipCard();
    } else if (event.key.toLowerCase() === 'b') {
      this.toggleBookmark();
    }
  }
}
