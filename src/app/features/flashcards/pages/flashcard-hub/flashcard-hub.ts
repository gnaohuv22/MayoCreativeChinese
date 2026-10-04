import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { VocabService } from '../../services/vocab.service';
import { ProgressService } from '../../services/progress.service';
import { exportProgressJson } from '../../utils/template-generator.util';
import { ToastService } from '../../../../services/toast.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { ComingSoonBadgeComponent } from '../../../../components/shared/badge/coming-soon-badge';
import { ADVANCED_LEVEL_PARAM, parseLevelParam } from '../../models/vocab-card.model';
import type { VocabCollection } from '../../models/vocab-card.model';

export interface CollectionCardItem {
  key: VocabCollection;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  /** num = tham số route `:level` ('1'…'9' hoặc '7-9'); count = số từ học được (0 = "Sắp ra mắt") */
  levels: { num: number | string; label: string; count: number; staffOnly: boolean }[];
  route: string;
  totalCards: number;
  highlightText?: string;
}

@Component({
  selector: 'app-flashcard-hub',
  standalone: true,
  imports: [RouterLink, NavHeaderComponent, AppIconComponent, ComingSoonBadgeComponent],
  templateUrl: './flashcard-hub.html',
  styleUrl: './flashcard-hub.css',
})
export class FlashcardHubComponent implements OnInit {
  private vocabService = inject(VocabService);
  private progressService = inject(ProgressService);
  private toast = inject(ToastService);

  loading = signal(true);
  collections = signal<CollectionCardItem[]>([]);
  totalWordsInSystem = signal(0);

  async ngOnInit() {
    this.loading.set(true);
    try {
      // 4 bộ độc lập — đếm theo từng cấp để làm mờ cấp chưa có từ
      const keys: VocabCollection[] = ['hsk2', 'hsk3', 'combined', 'supplement'];
      const [access, ...counts] = await Promise.all([
        this.vocabService.accessResolver(),
        ...keys.map(c => this.vocabService.getLevelCounts(c)),
      ]);
      const [countsV2, countsV3, countsCombined, countsSupplement] = counts;
      // Cấp bản nháp / nội bộ (với khách) tính như chưa có từ
      const levelsOf = (collection: VocabCollection, counts: Map<number, number>, params: (number | string)[], label: (p: number | string) => string) =>
        params.map(num => {
          const levelAccess = access(collection, String(num));
          const count = parseLevelParam(String(num)).reduce((sum, l) => sum + (counts.get(l) ?? 0), 0);
          return { num, label: label(num), count: levelAccess === 'locked' ? 0 : count, staffOnly: levelAccess === 'staff' };
        });
      const sumOf = (levels: { count: number }[]) => levels.reduce((a, l) => a + l.count, 0);
      const levelsV2 = levelsOf('hsk2', countsV2, [1, 2, 3, 4, 5, 6], i => `HSK ${i}`);
      const levelsV3 = levelsOf('hsk3', countsV3, [1, 2, 3, 4, 5, 6, 7, 8, 9], i => `NEW HSK ${i}`);
      const levelsCombined = levelsOf('combined', countsCombined, [1, 2, 3, 4, 5, 6, ADVANCED_LEVEL_PARAM], i => `HSK ${i}`);
      const levelsSupplement = levelsOf('supplement', countsSupplement, [3, 4, 5, 6], i => `HSK ${i}`);
      const totalV2 = sumOf(levelsV2);
      const totalV3 = sumOf(levelsV3);
      const totalCombined = sumOf(levelsCombined);
      const totalSupplement = sumOf(levelsSupplement);
      this.totalWordsInSystem.set(totalV2 + totalV3 + totalCombined + totalSupplement);

      const items: CollectionCardItem[] = [
        {
          key: 'hsk2',
          title: 'Từ Vựng HSK 2.0',
          badge: 'HSK 2.0',
          badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          description: 'Hệ thống từ vựng 6 cấp độ (HSK 1 đến HSK 6) theo tiêu chuẩn đánh giá năng lực 6 cấp cũ. Phù hợp cho ôn luyện thi HSK format cũ.',
          levels: levelsV2,
          route: '/flashcards/hsk2',
          totalCards: totalV2,
        },
        {
          key: 'hsk3',
          title: 'Từ Vựng HSK 3.0',
          badge: 'NEW HSK',
          badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
          description: 'Chuẩn 9 cấp độ mới phân chia theo bài học của giáo trình NEW HSK 3.0, giúp tiếp thu từ vựng theo ngữ cảnh thực tế.',
          levels: levelsV3,
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
          levels: levelsCombined,
          route: '/flashcards/combined',
          totalCards: totalCombined,
        },
        {
          key: 'supplement',
          title: 'Bổ Sung HSK 2.0 → 3.0',
          badge: 'Nâng cấp',
          badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          description: 'Tập hợp từ vựng mới cần học thêm khi nâng cấp từ chuẩn HSK 2.0 lên chuẩn HSK 3.0 cho các cấp độ 3 đến 6, chia theo chủ đề.',
          levels: levelsSupplement,
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
      this.toast.error('Không sao lưu được tiến độ học tập.');
    }
  }

  /** Khôi phục từ file sao lưu — tạm thời, tới khi có tài khoản học viên */
  async importProgress(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // cho phép chọn lại cùng file
    if (!file) return;
    if (!confirm('Khôi phục sẽ thay thế toàn bộ tiến độ học hiện tại trên trình duyệt này. Tiếp tục?')) return;
    try {
      const count = await this.progressService.importProgress(await file.text());
      this.toast.success(`Đã khôi phục tiến độ của ${count} từ.`);
    } catch (err) {
      this.toast.error(err instanceof Error ? err.message : 'Không khôi phục được tiến độ.');
    }
  }
}
