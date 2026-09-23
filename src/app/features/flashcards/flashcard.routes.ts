import { Routes } from '@angular/router';

export const flashcardRoutes: Routes = [
  // Hub trung tâm — 4 bộ sưu tập
  {
    path: '',
    loadComponent: () =>
      import('./pages/flashcard-hub/flashcard-hub').then(m => m.FlashcardHubComponent),
  },

  // 1. TỪ VỰNG HSK 2.0 (HSK 1 - 6)
  {
    path: 'hsk2',
    loadComponent: () =>
      import('./pages/vocab-level-picker/vocab-level-picker').then(m => m.VocabLevelPickerComponent),
    data: { collection: 'hsk2' },
  },
  {
    path: 'hsk2/:level',
    loadComponent: () =>
      import('./pages/flashcard-study/flashcard-study').then(m => m.FlashcardStudyComponent),
    data: { collection: 'hsk2' },
  },
  {
    path: 'hsk2/:level/list',
    loadComponent: () =>
      import('./pages/vocab-list/vocab-list').then(m => m.VocabListComponent),
    data: { collection: 'hsk2' },
  },

  // 2. TỪ VỰNG HSK 3.0 (NEW HSK 1 - 9, chia theo bài học & giáo trình)
  {
    path: 'hsk3',
    loadComponent: () =>
      import('./pages/vocab-level-picker/vocab-level-picker').then(m => m.VocabLevelPickerComponent),
    data: { collection: 'hsk3' },
  },
  {
    path: 'hsk3/:level',
    loadComponent: () =>
      import('./pages/vocab-lesson-picker/vocab-lesson-picker').then(m => m.VocabLessonPickerComponent),
  },
  {
    path: 'hsk3/:level/all',
    loadComponent: () =>
      import('./pages/flashcard-study/flashcard-study').then(m => m.FlashcardStudyComponent),
    data: { collection: 'hsk3' },
  },
  {
    path: 'hsk3/:level/lesson/:lesson',
    loadComponent: () =>
      import('./pages/flashcard-study/flashcard-study').then(m => m.FlashcardStudyComponent),
    data: { collection: 'hsk3', lessonMode: true },
  },
  {
    path: 'hsk3/:level/list',
    loadComponent: () =>
      import('./pages/vocab-list/vocab-list').then(m => m.VocabListComponent),
    data: { collection: 'hsk3' },
  },

  // 3. TỪ VỰNG HSK 1 - 9 (Tổng hợp toàn diện)
  {
    path: 'combined',
    loadComponent: () =>
      import('./pages/vocab-level-picker/vocab-level-picker').then(m => m.VocabLevelPickerComponent),
    data: { collection: 'combined' },
  },
  {
    path: 'combined/:level',
    loadComponent: () =>
      import('./pages/flashcard-study/flashcard-study').then(m => m.FlashcardStudyComponent),
    data: { collection: 'combined' },
  },
  {
    path: 'combined/:level/list',
    loadComponent: () =>
      import('./pages/vocab-list/vocab-list').then(m => m.VocabListComponent),
    data: { collection: 'combined' },
  },

  // 4. TỪ VỰNG BỔ SUNG HSK 2.0 LÊN 3.0 (HSK 3, 4, 5, 6)
  {
    path: 'supplement',
    loadComponent: () =>
      import('./pages/vocab-level-picker/vocab-level-picker').then(m => m.VocabLevelPickerComponent),
    data: { collection: 'supplement' },
  },
  {
    path: 'supplement/:level',
    loadComponent: () =>
      import('./pages/flashcard-study/flashcard-study').then(m => m.FlashcardStudyComponent),
    data: { collection: 'supplement' },
  },
  {
    path: 'supplement/:level/list',
    loadComponent: () =>
      import('./pages/vocab-list/vocab-list').then(m => m.VocabListComponent),
    data: { collection: 'supplement' },
  },

  // Legacy route redirect
  {
    path: 'hsk/:level',
    redirectTo: 'combined/:level',
    pathMatch: 'full',
  },

  // Quản lý từ vựng dành cho Ops/Admin
  {
    path: 'manage',
    loadComponent: () =>
      import('./pages/flashcard-manage/flashcard-manage').then(m => m.FlashcardManageComponent),
  },
];
