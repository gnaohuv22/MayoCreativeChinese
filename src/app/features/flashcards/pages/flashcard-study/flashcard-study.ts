import { Component, computed, inject, OnInit, signal, HostListener } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { VocabCardComponent } from '../../components/vocab-card/vocab-card';
import { VocabService } from '../../services/vocab.service';
import { ProgressService } from '../../services/progress.service';
import type { VocabCard, CardProgress } from '../../models/vocab-card.model';

@Component({
  selector: 'app-flashcard-study',
  standalone: true,
  imports: [NavHeaderComponent, VocabCardComponent, RouterLink],
  templateUrl: './flashcard-study.html',
  styleUrl: './flashcard-study.css',
})
export class FlashcardStudyComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private vocabService = inject(VocabService);
  private progressService = inject(ProgressService);

  level = signal<string>('1');
  cards = signal<VocabCard[]>([]);
  progressMap = signal<Map<string, CardProgress>>(new Map());
  currentIndex = signal(0);
  flipped = signal(false);
  loading = signal(true);
  shuffled = signal(false);
  filter = signal<'all' | 'new' | 'hard' | 'bookmarked'>('all');
  isTransitioning = signal(false);

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
    this.route.paramMap.subscribe(async params => {
      const lvl = params.get('level') || '1';
      this.level.set(lvl);
      this.loading.set(true);

      try {
        const vocabList = await this.vocabService.getVocabByLevel(Number(lvl));
        const progress = await this.progressService.getProgressMap(Number(lvl));

        this.cards.set(vocabList);
        this.progressMap.set(progress);
        this.currentIndex.set(0);
        this.flipped.set(false);
      } catch (error) {
        console.error('Error loading study page:', error);
      } finally {
        this.loading.set(false);
      }
    });
  }

  flipCard() {
    if (this.isTransitioning()) return;
    this.flipped.update(f => !f);
  }

  /**
   * Chuyển sang thẻ kế tiếp.
   * Nếu đang ở mặt sau (flipped), lật thẻ về mặt trước trước,
   * đợi hiệu ứng lật thẻ kết thúc (320ms) rồi mới chuyển từ vựng.
   */
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

  /**
   * Chuyển về thẻ trước đó.
   * Nếu đang ở mặt sau, lật lại trước khi chuyển từ vựng.
   */
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
      await this.progressService.updateConfidence(card.hanzi, hskLevel, confidence);
      
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

      // Tự động chuyển thẻ kế tiếp với animation lật mượt mà
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
      const newBookmarked = await this.progressService.toggleBookmark(card.hanzi, hskLevel);
      
      const existing = this.progressMap().get(card.hanzi);
      const updated: CardProgress = existing
        ? { ...existing, bookmarked: newBookmarked }
        : {
            hanzi: card.hanzi,
            hskLevel,
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
