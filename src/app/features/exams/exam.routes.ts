import { Routes } from '@angular/router';
import { adminGuard } from '../../services/admin.guard';

export const examRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/exam-list/exam-list').then(m => m.ExamListComponent),
  },
  {
    path: 'manage',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/exam-manage/exam-manage').then(m => m.ExamManageComponent),
  },
  {
    path: 'new',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/exam-editor/exam-editor').then(m => m.ExamEditorComponent),
  },
  {
    path: ':id/edit',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/exam-editor/exam-editor').then(m => m.ExamEditorComponent),
  },
  {
    path: ':id/take',
    loadComponent: () =>
      import('./pages/exam-take/exam-take').then(m => m.ExamTakeComponent),
  },
  {
    path: ':id/result',
    loadComponent: () =>
      import('./pages/exam-result/exam-result').then(m => m.ExamResultComponent),
  },
];
