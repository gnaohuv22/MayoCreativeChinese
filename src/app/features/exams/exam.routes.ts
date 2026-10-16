import { Routes } from '@angular/router';
import { accountGuard } from '../../services/admin.guard';

export const examRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/exam-list/exam-list').then(m => m.ExamListComponent),
  },
  // Địa chỉ cũ của trang quản lý
  { path: 'manage', redirectTo: '/admin/exams', pathMatch: 'full' },
  {
    path: ':id/take',
    canActivate: [accountGuard],
    loadComponent: () =>
      import('./pages/exam-take/exam-take').then(m => m.ExamTakeComponent),
  },
  {
    path: ':id/result',
    loadComponent: () =>
      import('./pages/exam-result/exam-result').then(m => m.ExamResultComponent),
  },
];
