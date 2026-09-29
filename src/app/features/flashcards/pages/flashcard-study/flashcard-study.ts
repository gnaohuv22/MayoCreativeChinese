import { Component, computed, inject, OnInit, signal, HostListener } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { VocabCardComponent } from '../../components/vocab-card/vocab-card';
import { VocabService } from '../../services/vocab.service';
import { ProgressService, progressKey } from '../../services/progress.service';
import { SpeechService } from '../../services/speech.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { VOCAB_COLLECTIONS } from '../../models/vocab-card.model';
import type { VocabCard, CardProgress, VocabCollection, VocabScope } from '../../models/vocab-card.model';
import { scopeFromRoute, scopeRoutes, scopeTitle } from '../../utils/vocab-scope.util';

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
  private speech = inject(SpeechService);

  scope = signal<VocabScope>({ collection: 'hsk2', levelParam: '1' });

  cards = signal<VocabCard[]>([]);
  progressMap = signal<Map<string, CardProgress>>(new Map());
  currentIndex = signal(0);
  flipped = signal(false);
  loading = signal(true);
  shuffled = signal(false);
  filter = signal<'all' | 'new' | 'hard' | 'bookmarked'>('all');
  isTransitioning = signal(false);
  readonly progressKey = progressKey;

  pageTitle = computed(() => scopeTitle(this.scope()));
  routes = computed(() => scopeRoutes(this.scope()));
  backLink = computed(() => this.routes().back.join('/'));
  backLabel = computed(() => this.routes().backLabel);

  filteredCards = computed(() => {
    const filter = this.filter();
    const cards = this.cards();
    const map = this.progressMap();

    if (filter === 'all') return cards;
    return cards.filter(card => {
      const p = map.get(progressKey(card));
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
    this.route.paramMap.subscribe(async params => {
      const collection = (this.route.snapshot.data['collection'] as VocabCollection) || 'hsk2';
      this.scope.set(scopeFromRoute(collection, params));
      await this.loadCards();
    });
  }

  async loadCards() {
    this.loading.set(true);
    try {
      const vocabList = await this.vocabService.getVocabForScope(this.scope());
      const progress = await this.progressService.getProgressForCards(vocabList);

      this.cards.set(vocabList);
      this.progressMap.set(progress);
      this.currentIndex.set(0);
      this.flipped.set(false);
      this.shuffled.set(false);
    } catch (error) {
      console.error('Error loading study cards:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private get version() {
    return VOCAB_COLLECTIONS[this.scope().collection].version;
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
      const hskLevel = card.hsk_level;
      const ver = this.version;
      const key = progressKey(card);

      await this.progressService.updateConfidence(card, confidence, ver);

      const existing = this.progressMap().get(key);
      const updated: CardProgress = existing
        ? {
            ...existing,
            confidence,
            reviewCount: existing.reviewCount + 1,
            lastReviewed: Date.now(),
          }
        : {
            cardId: card.id,
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
        newMap.set(key, updated);
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
      const hskLevel = card.hsk_level;
      const ver = this.version;
      const key = progressKey(card);

      const newBookmarked = await this.progressService.toggleBookmark(card, ver);

      const existing = this.progressMap().get(key);
      const updated: CardProgress = existing
        ? { ...existing, bookmarked: newBookmarked }
        : {
            cardId: card.id,
            hanzi: card.hanzi,
            hskLevel,
            hskVersion: ver,
            confidence: 0,
            reviewCount: 0,
            bookmarked: newBookmarked,
          };

      this.progressMap.update(map => {
        const newMap = new Map(map);
        newMap.set(key, updated);
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

  // Vuốt ngang trên thẻ để chuyển thẻ (điện thoại)
  private touchStart: { x: number; y: number } | null = null;

  onTouchStart(event: TouchEvent) {
    const t = event.touches[0];
    this.touchStart = { x: t.clientX, y: t.clientY };
  }

  onTouchEnd(event: TouchEvent) {
    if (!this.touchStart) return;
    const t = event.changedTouches[0];
    const dx = t.clientX - this.touchStart.x;
    const dy = t.clientY - this.touchStart.y;
    this.touchStart = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) this.nextCard();
    else this.prevCard();
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
    } else if (event.key.toLowerCase() === 'p') {
      this.speech.speak(this.currentCard()?.hanzi);
    }
  }
}
