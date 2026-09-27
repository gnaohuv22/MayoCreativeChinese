import { Routes } from '@angular/router';
import type { VocabCollection } from './models/vocab-card.model';

const levelPicker = () =>
  import('./pages/vocab-level-picker/vocab-level-picker').then(m => m.VocabLevelPickerComponent);
const groupPicker = () =>
  import('./pages/vocab-lesson-picker/vocab-lesson-picker').then(m => m.VocabLessonPickerComponent);
const study = () =>
  import('./pages/flashcard-study/flashcard-study').then(m => m.FlashcardStudyComponent);
const list = () =>
  import('./pages/vocab-list/vocab-list').then(m => m.VocabListComponent);
const quiz = () =>
  import('./pages/vocab-quiz/vocab-quiz').then(m => m.VocabQuizComponent);

/** Bộ không chia nhỏ: chọn cấp → flashcard / bảng / trắc nghiệm */
function flatCollection(collection: VocabCollection): Routes {
  const data = { collection };
  return [
    { path: collection, loadComponent: levelPicker, data },
    { path: `${collection}/:level`, loadComponent: study, data },
    { path: `${collection}/:level/list`, loadComponent: list, data },
    { path: `${collection}/:level/quiz`, loadComponent: quiz, data },
  ];
}

/** Bộ chia theo bài học / chủ đề: chọn cấp → chọn nhóm → flashcard / trắc nghiệm */
function groupedCollection(collection: VocabCollection, groupSegment: 'lesson' | 'topic'): Routes {
  const data = { collection };
  const group = `${collection}/:level/${groupSegment}/:${groupSegment}`;
  return [
    { path: collection, loadComponent: levelPicker, data },
    { path: `${collection}/:level`, loadComponent: groupPicker, data },
    { path: `${collection}/:level/all`, loadComponent: study, data },
    { path: `${collection}/:level/all/quiz`, loadComponent: quiz, data },
    { path: group, loadComponent: study, data },
    { path: `${group}/quiz`, loadComponent: quiz, data },
    { path: `${collection}/:level/list`, loadComponent: list, data },
  ];
}

export const flashcardRoutes: Routes = [
  // Hub trung tâm — 4 bộ sưu tập độc lập
  {
    path: '',
    loadComponent: () =>
      import('./pages/flashcard-hub/flashcard-hub').then(m => m.FlashcardHubComponent),
  },

  // 1. Từ vựng HSK 2.0 (HSK 1 - 6)
  ...flatCollection('hsk2'),
  // 2. Từ vựng HSK 3.0 (NEW HSK 1 - 9, chia theo bài học)
  ...groupedCollection('hsk3', 'lesson'),
  // 3. Từ vựng HSK 1 - 9 (7-9 gộp)
  ...flatCollection('combined'),
  // 4. Từ vựng bổ sung HSK 2.0 → 3.0 (HSK 3 - 6, chia theo chủ đề)
  ...groupedCollection('supplement', 'topic'),

  // Legacy route redirect
  {
    path: 'hsk/:level',
    redirectTo: 'combined/:level',
    pathMatch: 'full',
  },

  // Địa chỉ cũ của trang quản lý
  { path: 'manage', redirectTo: '/admin/vocab', pathMatch: 'full' },
];
