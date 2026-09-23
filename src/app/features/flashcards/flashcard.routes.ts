import { Routes } from '@angular/router';

export const flashcardRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/flashcard-hub/flashcard-hub').then(m => m.FlashcardHubComponent),
  },
  {
    path: 'hsk/:level',
    loadComponent: () =>
      import('./pages/flashcard-study/flashcard-study').then(m => m.FlashcardStudyComponent),
  },
  {
    path: 'manage',
    loadComponent: () =>
      import('./pages/flashcard-manage/flashcard-manage').then(m => m.FlashcardManageComponent),
  },
];
