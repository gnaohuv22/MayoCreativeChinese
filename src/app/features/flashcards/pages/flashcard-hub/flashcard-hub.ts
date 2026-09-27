import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { VocabService } from '../../services/vocab.service';
import { ProgressService } from '../../services/progress.service';
import { exportProgressJson } from '../../utils/template-generator.util';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { HskBadgeComponent } from '../../../../components/shared/badge/hsk-badge';
import { ADVANCED_LEVEL_PARAM } from '../../models/vocab-card.model';
import type { VocabCollection } from '../../models/vocab-card.model';

export interface CollectionCardItem {
  key: VocabCollection;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  /** num = tham số route `:level` ('1'…'9' hoặc '7-9') */
  levels: { num: number | string; label: string }[];
  route: string;
  totalCards: number;
  highlightText?: string;
}

@Component({
  selector: 'app-flashcard-hub',
  standalone: true,
  imports: [RouterLink, NavHeaderComponent, AppIconComponent],
  templateUrl: './flashcard-hub.html',
  styleUrl: './flashcard-hub.css',
})
export class FlashcardHubComponent implements OnInit {
  private vocabService = inject(VocabService);
  private progressService = inject(ProgressService);

  loading = signal(true);
  collections = signal<CollectionCardItem[]>([]);
  totalWordsInSystem = signal(0);

  async ngOnInit() {
    this.loading.set(true);
    try {
      // 4 bộ độc lập — mỗi bộ đếm từ của riêng nó
      const [totalV2, totalV3, totalCombined, totalSupplement] = await Promise.all(
        (['hsk2', 'hsk3', 'combined', 'supplement'] as VocabCollection[]).map(c => this.vocabService.getCollectionCount(c))
      );
      this.totalWordsInSystem.set(totalV2 + totalV3 + totalCombined + totalSupplement);

      const items: CollectionCardItem[] = [
        {
          key: 'hsk2',
          title: 'Từ Vựng HSK 2.0',
          badge: 'HSK 2.0',
          badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          description: 'Hệ thống từ vựng 6 cấp độ (HSK 1 đến HSK 6) theo tiêu chuẩn đánh giá năng lực 6 cấp cũ. Phù hợp cho ôn luyện thi HSK format cũ.',
          levels: [1, 2, 3, 4, 5, 6].map(i => ({ num: i, label: `HSK ${i}` })),
          route: '/flashcards/hsk2',
          totalCards: totalV2,
        },
        {
          key: 'hsk3',
          title: 'Từ Vựng HSK 3.0',
          badge: 'NEW HSK',
          badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
          description: 'Chuẩn 9 cấp độ mới phân chia theo bài học của giáo trình NEW HSK 3.0, giúp tiếp thu từ vựng theo ngữ cảnh thực tế.',
          levels: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => ({ num: i, label: `NEW HSK ${i}` })),
          route: '/flashcards/hsk3',
          totalCards: totalV3,
          highlightText: 'Chia theo bài học & giáo trình',
        },
        {
          key: 'combined',
          title: 'Từ Vựng HSK 1 - 9',
          badge: 'Toàn diện',
          badgeColor: 'bg-brand-pink/10 text-brand-pink border-brand-pink/20',
          description: 'Kho từ vựng HSK tổng hợp đầy đủ từ cấp độ sơ cấp 1 đến cao cấp 9 theo Tiêu chuẩn phân cấp trình độ giáo dục Trung văn quốc tế.',
          levels: [
            ...[1, 2, 3, 4, 5, 6].map(i => ({ num: i, label: `HSK ${i}` })),
            { num: ADVANCED_LEVEL_PARAM, label: `HSK ${ADVANCED_LEVEL_PARAM}` },
          ],
          route: '/flashcards/combined',
          totalCards: totalCombined,
        },
        {
          key: 'supplement',
          title: 'Bổ Sung HSK 2.0 → 3.0',
          badge: 'Nâng cấp',
          badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          description: 'Tập hợp từ vựng mới cần học thêm khi nâng cấp từ chuẩn HSK 2.0 lên chuẩn HSK 3.0 cho các cấp độ 3 đến 6, chia theo chủ đề.',
          levels: [3, 4, 5, 6].map(i => ({ num: i, label: `HSK ${i}` })),
          route: '/flashcards/supplement',
          totalCards: totalSupplement,
          highlightText: 'Chia theo chủ đề • HSK 3, 4, 5, 6',
        },
      ];

      this.collections.set(items);
    } catch (err) {
      console.error('Error loading collections in hub', err);
    } finally {
      this.loading.set(false);
    }
  }

  async exportProgress() {
    try {
      const data = await this.progressService.exportProgress();
      exportProgressJson(data);
    } catch (err) {
      console.error('Error exporting progress', err);
    }
  }
}
