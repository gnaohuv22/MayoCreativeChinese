import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { VocabService } from '../../services/vocab.service';
import { ProgressService } from '../../services/progress.service';
import { exportProgressJson } from '../../utils/template-generator.util';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';

export interface LevelInfo {
  level: number;
  name: string;
  totalCards: number;
  reviewed: number;
  mastered: number;
  hasData: boolean;
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

  levelData = signal<LevelInfo[]>([]);
  loading = signal(true);

  private readonly HSK_NAMES: Record<number, string> = {
    1: '一级', 2: '二级', 3: '三级', 4: '四级', 5: '五级',
    6: '六级', 7: '七级', 8: '八级', 9: '九级',
  };

  async ngOnInit() {
    this.loading.set(true);
    try {
      const counts = await this.vocabService.getLevelCounts();
      const levels: LevelInfo[] = [];

      for (let i = 1; i <= 9; i++) {
        const count = counts.get(i) || 0;
        let reviewed = 0;
        let mastered = 0;

        if (count > 0) {
          const stats = await this.progressService.getLevelStats(i, count);
          reviewed = stats.reviewed;
          mastered = stats.mastered;
        }

        levels.push({
          level: i,
          name: this.HSK_NAMES[i] || `HSK ${i}`,
          totalCards: count,
          reviewed,
          mastered,
          hasData: count > 0,
        });
      }

      this.levelData.set(levels);
    } catch (err) {
      console.error('Error loading level data', err);
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

  getDashOffset(mastered: number, total: number): number {
    const circumference = 125.6; // 2 * Math.PI * 20
    if (total === 0) return circumference;
    const percent = mastered / total;
    return circumference - (percent * circumference);
  }

  getPercent(mastered: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((mastered / total) * 100);
  }
}
