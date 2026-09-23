import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeToggleComponent } from '../../../../components/shared/theme-toggle/theme-toggle';

@Component({
  selector: 'app-flashcard-shell',
  imports: [RouterLink, ThemeToggleComponent],
  templateUrl: './flashcard-shell.html',
  styleUrl: './flashcard-shell.css',
})
export class FlashcardShellComponent {
  readonly pageTitle = input<string>('');
  readonly backLink = input<string>('/flashcards');
  readonly backLabel = input<string>('Flashcard HSK');
  readonly showBack = input<boolean>(true);
}
