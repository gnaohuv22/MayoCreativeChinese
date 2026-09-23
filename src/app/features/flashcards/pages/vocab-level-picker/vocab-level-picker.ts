import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { VocabService } from '../../services/vocab.service';
import { ProgressService } from '../../services/progress.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { HskBadgeComponent } from '../../../../components/shared/badge/hsk-badge';
import type { HskVersion, VocabCollection } from '../../models/vocab-card.model';

export interface CollectionLevelCard {
  level: number;
  name: string;
  totalCards: number;
  reviewed: number;
  mastered: number;
  hasData: boolean;
  studyRoute: string[];
  listRoute: string[];
}

@Component({
  selector: 'app-vocab-level-picker',
  standalone: true,
  imports: [RouterLink, NavHeaderComponent, AppIconComponent, HskBadgeComponent],
  templateUrl: './vocab-level-picker.html',
  styleUrl: './vocab-level-picker.css',
})
export class VocabLevelPickerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private vocabService = inject(VocabService);
  private progressService = inject(ProgressService);

  collection = signal<VocabCollection>('hsk2');
  title = signal<string>('Từ vựng HSK 2.0');
  subtitle = signal<string>('Chuẩn 6 cấp độ truyền thống (HSK 1 - HSK 6)');
  hskVersion = signal<HskVersion | undefined>('2.0');
  levels = signal<CollectionLevelCard[]>([]);
  loading = signal(true);

  private readonly HSK_NAMES: Record<number, string> = {
    1: '一级', 2: '二级', 3: '三级', 4: '四级', 5: '五级',
    6: '六级', 7: '七级', 8: '八级', 9: '九级',
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

    let levelNumbers: number[] = [];
    let ver: HskVersion | undefined;

    switch (col) {
      case 'hsk2':
        this.title.set('Từ Vựng HSK 2.0');
        this.subtitle.set('Chuẩn 6 cấp độ truyền thống (HSK 1 - HSK 6)');
        this.hskVersion.set('2.0');
        ver = '2.0';
        levelNumbers = [1, 2, 3, 4, 5, 6];
        break;

      case 'hsk3':
        this.title.set('Từ Vựng HSK 3.0');
        this.subtitle.set('Chuẩn 9 cấp độ mới theo bài học & giáo trình (HSK 1 - HSK 9)');
        this.hskVersion.set('3.0');
        ver = '3.0';
        levelNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        break;

      case 'combined':
        this.title.set('Từ Vựng HSK 1 - 9');
        this.subtitle.set('Kho từ vựng tổng hợp toàn diện các cấp độ từ cơ bản đến cao cấp');
        this.hskVersion.set(undefined);
        ver = undefined;
        levelNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        break;

      case 'supplement':
        this.title.set('Từ Vựng Bổ Sung HSK 2.0 → 3.0');
        this.subtitle.set('Tập hợp các từ vựng mới được bổ sung khi nâng cấp lên chuẩn HSK 3.0');
        this.hskVersion.set('3.0');
        ver = '3.0';
        levelNumbers = [3, 4, 5, 6];
        break;
    }

    try {
      const counts = await this.vocabService.getLevelCounts(ver);
      const list: CollectionLevelCard[] = [];

      for (const lvl of levelNumbers) {
        let count = counts.get(lvl) || 0;

        // Cho trường hợp supplement, nếu count từ db v3 chưa có cờ, tính từ supplementVocab
        if (col === 'supplement') {
          const supp = await this.vocabService.getSupplementVocab(lvl);
          count = supp.length > 0 ? supp.length : (counts.get(lvl) || 0);
        }

        let reviewed = 0;
        let mastered = 0;

        if (count > 0) {
          const stats = await this.progressService.getLevelStats(lvl, count, ver);
          reviewed = stats.reviewed;
          mastered = stats.mastered;
        }

        // Định tuyến phù hợp
        let studyRoute: string[];
        let listRoute: string[];

        if (col === 'hsk3') {
          // HSK 3.0 dẫn vào danh sách bài học (lesson picker)
          studyRoute = ['/flashcards/hsk3', String(lvl)];
          listRoute = ['/flashcards/hsk3', String(lvl), 'list'];
        } else {
          studyRoute = ['/flashcards', col, String(lvl)];
          listRoute = ['/flashcards', col, String(lvl), 'list'];
        }

        list.push({
          level: lvl,
          name: this.HSK_NAMES[lvl] || `HSK ${lvl}`,
          totalCards: count,
          reviewed,
          mastered,
          hasData: count > 0,
          studyRoute,
          listRoute,
        });
      }

      this.levels.set(list);
    } catch (err) {
      console.error('Error loading level picker data:', err);
    } finally {
      this.loading.set(false);
    }
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
