import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'flashcards',
    loadChildren: () =>
      import('./features/flashcards/flashcard.routes').then(m => m.flashcardRoutes),
  },
  {
    path: 'exams',
    loadChildren: () =>
      import('./features/exams/exam.routes').then(m => m.examRoutes),
  },
];
