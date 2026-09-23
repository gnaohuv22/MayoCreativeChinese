import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { HskBadgeComponent } from '../../../../components/shared/badge/hsk-badge';
import { VocabService } from '../../services/vocab.service';
import type { VocabCard, HskVersion, VocabCollection, LessonInfo } from '../../models/vocab-card.model';

@Component({
  selector: 'app-vocab-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavHeaderComponent, AppIconComponent, HskBadgeComponent],
  templateUrl: './vocab-list.html',
  styleUrl: './vocab-list.css',
})
export class VocabListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private vocabService = inject(VocabService);

  collection = signal<VocabCollection>('hsk2');
  level = signal<number>(1);
  lessonNumber = signal<number | undefined>(undefined);
  lessons = signal<LessonInfo[]>([]);

  // Search & Pagination
  searchQuery = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(20);
  pageSizeOptions = [10, 20, 50, 100];

  words = signal<VocabCard[]>([]);
  totalWords = signal<number>(0);
  loading = signal<boolean>(true);

  // Computed
  totalPages = computed(() => {
    const total = this.totalWords();
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / size));
  });

  rangeStart = computed(() => {
    if (this.totalWords() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  rangeEnd = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.totalWords());
  });

  versionForQuery = computed<HskVersion | undefined>(() => {
    const col = this.collection();
    if (col === 'hsk2') return '2.0';
    if (col === 'hsk3' || col === 'supplement') return '3.0';
    return undefined;
  });

  async ngOnInit() {
    this.route.data.subscribe(data => {
      if (data['collection']) {
        this.collection.set(data['collection']);
      }
    });

    this.route.paramMap.subscribe(params => {
      const lvl = Number(params.get('level') || '1');
      this.level.set(lvl);

      this.route.queryParamMap.subscribe(qParams => {
        const lessonParam = qParams.get('lesson');
        if (lessonParam) {
          this.lessonNumber.set(Number(lessonParam));
        } else {
          this.lessonNumber.set(undefined);
        }
        this.loadLessons();
        this.loadData();
      });
    });
  }

  async loadLessons() {
    if (this.collection() === 'hsk3') {
      try {
        const list = await this.vocabService.getLessonsForLevel(this.level(), '3.0');
        this.lessons.set(list);
      } catch (e) {
        console.error('Failed to load lessons for list view:', e);
      }
    }
  }

  async loadData() {
    this.loading.set(true);
    try {
      const res = await this.vocabService.getVocabPaginated({
        level: this.level(),
        version: this.versionForQuery(),
        lessonNumber: this.lessonNumber(),
        query: this.searchQuery(),
        page: this.currentPage(),
        pageSize: this.pageSize(),
      });

      this.words.set(res.data);
      this.totalWords.set(res.total);
    } catch (e) {
      console.error('Error loading paginated vocab:', e);
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadData();
  }

  onPageSizeChange(newSize: number) {
    this.pageSize.set(Number(newSize));
    this.currentPage.set(1);
    this.loadData();
  }

  onLessonChange(newLesson: string) {
    if (newLesson === 'all' || !newLesson) {
      this.lessonNumber.set(undefined);
    } else {
      this.lessonNumber.set(Number(newLesson));
    }
    this.currentPage.set(1);
    this.loadData();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getFlashcardRoute(): string[] {
    const col = this.collection();
    const lvl = String(this.level());
    const lesson = this.lessonNumber();

    if (col === 'hsk3') {
      if (lesson != null && lesson > 0) {
        return ['/flashcards/hsk3', lvl, 'lesson', String(lesson)];
      }
      return ['/flashcards/hsk3', lvl, 'all'];
    }
    return ['/flashcards', col, lvl];
  }
}
