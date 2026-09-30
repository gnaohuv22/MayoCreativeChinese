import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { SpeakButtonComponent } from '../../components/speak-button/speak-button';
import { VocabExamplesComponent } from '../../components/vocab-examples/vocab-examples';
import { VocabService } from '../../services/vocab.service';
import { VOCAB_COLLECTIONS } from '../../models/vocab-card.model';
import type { VocabCard, VocabCollection, VocabGroupInfo, VocabScope } from '../../models/vocab-card.model';
import { NO_TOPIC_PARAM, scopeLevelLabel, scopeRoutes } from '../../utils/vocab-scope.util';

@Component({
  selector: 'app-vocab-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavHeaderComponent, AppIconComponent, SpeakButtonComponent, VocabExamplesComponent],
  templateUrl: './vocab-list.html',
  styleUrl: './vocab-list.css',
})
export class VocabListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private vocabService = inject(VocabService);

  /** Phạm vi đang xem (cả cấp, hoặc 1 bài / 1 chủ đề qua query `?lesson=` / `?topic=`) */
  scope = signal<VocabScope>({ collection: 'hsk2', levelParam: '1' });
  groups = signal<VocabGroupInfo[]>([]);

  config = computed(() => VOCAB_COLLECTIONS[this.scope().collection]);
  levelLabel = computed(() => scopeLevelLabel(this.scope()));
  routes = computed(() => scopeRoutes(this.scope()));
  /** Giá trị ô chọn bài / chủ đề ('all' = cả cấp) */
  groupValue = computed(() => {
    const s = this.scope();
    if (s.lesson != null) return String(s.lesson);
    if (s.topic != null) return s.topic || NO_TOPIC_PARAM;
    return 'all';
  });

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

  ngOnInit() {
    combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, query]) => {
      const collection = (this.route.snapshot.data['collection'] as VocabCollection) || 'hsk2';
      const levelParam = params.get('level') || VOCAB_COLLECTIONS[collection].levelParams[0];
      const levelChanged = levelParam !== this.scope().levelParam || collection !== this.scope().collection;

      const lesson = query.get('lesson');
      const topic = query.get('topic');
      this.scope.set({
        collection,
        levelParam,
        lesson: lesson != null ? Number(lesson) : null,
        topic: topic != null ? (topic === NO_TOPIC_PARAM ? '' : topic) : null,
      });
      this.currentPage.set(1);
      if (levelChanged || this.groups().length === 0) this.loadGroups();
      this.loadData();
    });
  }

  async loadGroups() {
    if (!this.config().grouping) {
      this.groups.set([]);
      return;
    }
    try {
      const { collection, levelParam } = this.scope();
      this.groups.set(await this.vocabService.getGroups({ collection, levelParam }));
    } catch (e) {
      console.error('Failed to load groups for list view:', e);
    }
  }

  async loadData() {
    this.loading.set(true);
    try {
      const res = await this.vocabService.getVocabPaginated({
        scope: this.scope(),
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

  onGroupChange(value: string) {
    const { collection, levelParam } = this.scope();
    const grouping = this.config().grouping;
    this.scope.set({
      collection,
      levelParam,
      lesson: grouping === 'lesson' && value !== 'all' ? Number(value) : null,
      topic: grouping === 'topic' && value !== 'all' ? (value === NO_TOPIC_PARAM ? '' : value) : null,
    });
    this.currentPage.set(1);
    this.loadData();
  }

  /** Nhãn ngắn cho cột chủ đề: "Chủ đề 1: 学校… / Trường học…" → "Chủ đề 1" */
  topicLabel(topic: string): string {
    const firstLine = topic.split('\n')[0].trim();
    const head = firstLine.split(':')[0].trim();
    return head || firstLine;
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
