import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { VocabService } from '../../services/vocab.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { VOCAB_COLLECTIONS } from '../../models/vocab-card.model';
import type { VocabCollection, VocabGroupInfo, VocabScope } from '../../models/vocab-card.model';
import { NO_TOPIC_PARAM, scopeLevelLabel, scopeRoutes } from '../../utils/vocab-scope.util';

interface GroupCard extends VocabGroupInfo {
  studyRoute: string[];
  quizRoute: string[];
  listQuery: Record<string, string | number> | null;
}

/** Chọn bài học (HSK 3.0) hoặc chủ đề (Bổ sung 2.0 → 3.0) trong 1 cấp */
@Component({
  selector: 'app-vocab-lesson-picker',
  standalone: true,
  imports: [RouterLink, NavHeaderComponent, AppIconComponent],
  templateUrl: './vocab-lesson-picker.html',
  styleUrl: './vocab-lesson-picker.css',
})
export class VocabLessonPickerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private vocabService = inject(VocabService);

  scope = signal<VocabScope>({ collection: 'hsk3', levelParam: '1' });
  groups = signal<GroupCard[]>([]);
  totalWords = signal<number>(0);
  loading = signal(true);

  config = computed(() => VOCAB_COLLECTIONS[this.scope().collection]);
  isTopic = computed(() => this.config().grouping === 'topic');
  levelLabel = computed(() => scopeLevelLabel(this.scope()));
  allRoutes = computed(() => scopeRoutes(this.scope()));
  groupNoun = computed(() => (this.isTopic() ? 'chủ đề' : 'bài học'));

  async ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const collection = (this.route.snapshot.data['collection'] as VocabCollection) || 'hsk3';
      this.scope.set({ collection, levelParam: params.get('level') || '1' });
      await this.loadGroups();
    });
  }

  async loadGroups() {
    this.loading.set(true);
    try {
      const scope = this.scope();
      const list = await this.vocabService.getGroups(scope);
      this.groups.set(list.map(g => {
        const groupScope: VocabScope = this.isTopic()
          ? { ...scope, topic: g.key === NO_TOPIC_PARAM ? '' : g.key }
          : { ...scope, lesson: g.lessonNumber ?? 0 };
        const routes = scopeRoutes(groupScope);
        return { ...g, studyRoute: routes.study, quizRoute: routes.quiz, listQuery: routes.listQuery };
      }));
      this.totalWords.set(list.reduce((acc, g) => acc + g.wordCount, 0));
    } catch (e) {
      console.error('Failed to load groups', this.scope(), e);
    } finally {
      this.loading.set(false);
    }
  }

  /** Ô số thứ tự của nhóm */
  badge(group: GroupCard, index: number): string {
    if (!this.isTopic()) return group.lessonNumber ? String(group.lessonNumber) : '•';
    return group.key === NO_TOPIC_PARAM ? '•' : String(index + 1);
  }
}
