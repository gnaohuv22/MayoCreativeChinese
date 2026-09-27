import { Routes } from '@angular/router';
import { adminGuard } from './services/admin.guard';

export const routes: Routes = [
  {
    // Trang chi tiết khóa học (nội dung từ brief — scripts/course-brief-to-ts.py)
    path: 'khoa-hoc/:slug',
    loadComponent: () =>
      import('./features/courses/pages/course-detail/course-detail').then(m => m.CourseDetailComponent),
  },
  {
    // Bài đăng "Câu chuyện học viên"
    path: 'bai-viet/:slug',
    loadComponent: () =>
      import('./features/posts/pages/story-detail/story-detail').then(m => m.StoryDetailComponent),
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/pages/admin-login/admin-login').then(m => m.AdminLoginComponent),
  },
  {
    // Khu quản trị: layout riêng (thanh bên), tách hẳn khỏi trang học viên
    path: 'admin',
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    loadComponent: () =>
      import('./features/admin/layout/admin-shell/admin-shell').then(m => m.AdminShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'exams' },
      {
        path: 'exams',
        loadComponent: () =>
          import('./features/exams/pages/exam-manage/exam-manage').then(m => m.ExamManageComponent),
      },
      {
        path: 'exams/new',
        loadComponent: () =>
          import('./features/exams/pages/exam-editor/exam-editor').then(m => m.ExamEditorComponent),
      },
      {
        path: 'exams/:id/edit',
        loadComponent: () =>
          import('./features/exams/pages/exam-editor/exam-editor').then(m => m.ExamEditorComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/admin/pages/admin-profile/admin-profile').then(m => m.AdminProfileComponent),
      },
      {
        path: 'vocab',
        loadComponent: () =>
          import('./features/flashcards/pages/flashcard-manage/flashcard-manage').then(m => m.FlashcardManageComponent),
      },
    ],
  },
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
