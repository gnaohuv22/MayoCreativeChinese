import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { VocabService } from '../../services/vocab.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { HskBadgeComponent } from '../../../../components/shared/badge/hsk-badge';
import type { LessonInfo } from '../../models/vocab-card.model';

@Component({
  selector: 'app-vocab-lesson-picker',
  standalone: true,
  imports: [RouterLink, NavHeaderComponent, AppIconComponent, HskBadgeComponent],
  templateUrl: './vocab-lesson-picker.html',
  styleUrl: './vocab-lesson-picker.css',
})
export class VocabLessonPickerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private vocabService = inject(VocabService);

  level = signal<number>(1);
  lessons = signal<LessonInfo[]>([]);
  totalWords = signal<number>(0);
  loading = signal(true);

  async ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const lvl = Number(params.get('level') || '1');
      this.level.set(lvl);
      await this.loadLessons(lvl);
    });
  }

  async loadLessons(lvl: number) {
    this.loading.set(true);
    try {
      const list = await this.vocabService.getLessonsForLevel(lvl, '3.0');
      this.lessons.set(list);
      const total = list.reduce((acc, curr) => acc + curr.wordCount, 0);
      this.totalWords.set(total);
    } catch (e) {
      console.error('Failed to load lessons for HSK 3.0 level', lvl, e);
    } finally {
      this.loading.set(false);
    }
  }
}
