import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import { AppIconComponent } from '../shared/icon/app-icon';
import { StoryService } from '../../features/posts/services/story.service';

@Component({
  selector: 'app-student-stories',
  standalone: true,
  imports: [RouterLink, AppIconComponent],
  templateUrl: './student-stories.html',
  styleUrl: './student-stories.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentStoriesComponent {
  protected readonly i18n = inject(I18nService);

  private readonly stories = inject(StoryService);

  readonly featured = computed(() => this.stories.summaries()?.[0] ?? null);
  readonly rest = computed(() => this.stories.summaries()?.slice(1) ?? []);

  constructor() {
    void this.stories.loadSummaries();
  }
}
