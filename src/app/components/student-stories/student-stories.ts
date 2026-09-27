import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import { AppIconComponent } from '../shared/icon/app-icon';
import { STUDENT_STORIES } from '../../features/posts/data/student-stories.data';

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

  readonly featured = STUDENT_STORIES[0];
  readonly rest = STUDENT_STORIES.slice(1);
}
