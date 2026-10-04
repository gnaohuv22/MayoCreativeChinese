import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { VocabService } from '../../services/vocab.service';
import { ProgressService } from '../../services/progress.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { ComingSoonBadgeComponent } from '../../../../components/shared/badge/coming-soon-badge';
import { StaffOnlyBadgeComponent } from '../../../../components/shared/visibility/staff-only-badge';
import { ADVANCED_LEVEL_PARAM, VOCAB_COLLECTIONS, parseLevelParam } from '../../models/vocab-card.model';
import type { VocabCollection, VocabScope } from '../../models/vocab-card.model';
import { scopeLevelLabel, scopeRoutes } from '../../utils/vocab-scope.util';

export interface CollectionLevelCard {
  /** Tham số route & nhãn cấp: '1'…'9' hoặc '7-9' */
  level: string;
  name: string;
  totalCards: number;
  reviewed: number;
  mastered: number;
  hasData: boolean;
  /** Cấp nội bộ — chỉ nhân sự thấy */
  staffOnly: boolean;
  studyRoute: string[];
  listRoute: string[];
  quizRoute: string[];
}

@Component({
  selector: 'app-vocab-level-picker',
  standalone: true,
  imports: [RouterLink, NavHeaderComponent, AppIconComponent, ComingSoonBadgeComponent, StaffOnlyBadgeComponent],
  templateUrl: './vocab-level-picker.html',
  styleUrl: './vocab-level-picker.css',
})
export class VocabLevelPickerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private vocabService = inject(VocabService);
  private progressService = inject(ProgressService);

  collection = signal<VocabCollection>('hsk2');
  title = signal<string>('');
  subtitle = signal<string>('');
  levels = signal<CollectionLevelCard[]>([]);
  loading = signal(true);

  private readonly HSK_NAMES: Record<string, string> = {
    1: '一级', 2: '二级', 3: '三级', 4: '四级', 5: '五级',
    6: '六级', 7: '七级', 8: '八级', 9: '九级', [ADVANCED_LEVEL_PARAM]: '高等 (七—九级)',
  };

  private readonly SUBTITLES: Record<VocabCollection, string> = {
    hsk2: 'Theo tiêu chuẩn đánh giá năng lực 6 cấp cũ (HSK 1 - HSK 6)',
    hsk3: 'Chuẩn 9 cấp độ theo bài học của giáo trình NEW HSK 3.0',
    combined: 'Từ sơ cấp 1 đến cao cấp 9 theo Tiêu chuẩn phân cấp trình độ giáo dục Trung văn quốc tế',
    supplement: 'Từ vựng cần học thêm khi chuyển từ HSK 2.0 lên HSK 3.0, chia theo chủ đề',
  };

  async ngOnInit() {
    this.route.data.subscribe(async data => {
      const col = (data['collection'] as VocabCollection) || 'hsk2';
      this.collection.set(col);
      await this.initCollection(col);
    });
  }

  private async initCollection(col: VocabCollection) {
    this.loading.set(true);
    const config = VOCAB_COLLECTIONS[col];
    this.title.set(config.title);
    this.subtitle.set(this.SUBTITLES[col]);

    try {
      const [counts, access] = await Promise.all([
        this.vocabService.getLevelCounts(col),
        this.vocabService.accessResolver(),
      ]);

      const list = await Promise.all(config.levelParams.map(async param => {
        const scope: VocabScope = { collection: col, levelParam: param };
        const levelAccess = access(col, param);
        // Cấp bản nháp / nội bộ (với khách) hiện như chưa có từ
        const count = levelAccess === 'locked' ? 0 : parseLevelParam(param).reduce((sum, l) => sum + (counts.get(l) ?? 0), 0);

        let reviewed = 0;
        let mastered = 0;
        if (count > 0) {
          const refs = await this.vocabService.getCardRefsForScope(scope);
          const stats = await this.progressService.getStatsForCards(refs);
          reviewed = stats.reviewed;
          mastered = stats.mastered;
        }

        const routes = scopeRoutes(scope);
        const card: CollectionLevelCard = {
          level: param,
          name: this.HSK_NAMES[param] ?? `HSK ${param}`,
          totalCards: count,
          reviewed,
          mastered,
          hasData: count > 0,
          staffOnly: levelAccess === 'staff',
          // Bộ chia nhỏ → vào trang chọn bài / chủ đề; bộ phẳng → vào flashcard
          studyRoute: config.grouping ? routes.back : routes.study,
          listRoute: routes.list,
          quizRoute: routes.quiz,
        };
        return card;
      }));

      this.levels.set(list);
    } catch (err) {
      console.error('Error loading level picker data:', err);
    } finally {
      this.loading.set(false);
    }
  }

  /** Nhãn nút học chính */
  studyLabel(): string {
    const grouping = VOCAB_COLLECTIONS[this.collection()].grouping;
    if (grouping === 'lesson') return 'Chọn bài học';
    if (grouping === 'topic') return 'Chọn chủ đề';
    return 'Học Flashcard';
  }

  shortLabel(): string {
    return VOCAB_COLLECTIONS[this.collection()].shortLabel;
  }

  levelLabel(param: string): string {
    return scopeLevelLabel({ collection: this.collection(), levelParam: param });
  }

  getDashOffset(mastered: number, total: number): number {
    const circumference = 125.6; // 2 * Math.PI * 20
    if (total === 0) return circumference;
    const percent = Math.min(1, mastered / total);
    return circumference - (percent * circumference);
  }

  getPercent(mastered: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((mastered / total) * 100);
  }
}
