import { Routes } from '@angular/router';

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
