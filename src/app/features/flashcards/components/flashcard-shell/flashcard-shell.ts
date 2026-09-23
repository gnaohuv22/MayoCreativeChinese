import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../../../services/theme.service';

@Component({
  selector: 'app-flashcard-shell',
  imports: [RouterLink],
  templateUrl: './flashcard-shell.html',
  styleUrl: './flashcard-shell.css',
})
export class FlashcardShellComponent {
  readonly theme = inject(ThemeService);
  readonly pageTitle = input<string>('');
  readonly backLink = input<string>('/flashcards');
  readonly backLabel = input<string>('Flashcard HSK');
  readonly showBack = input<boolean>(true);
}
