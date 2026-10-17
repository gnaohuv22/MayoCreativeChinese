import { Routes } from '@angular/router';
import { permissionGuard, staffGuard, studentGuard } from './services/admin.guard';

export const routes: Routes = [
  {
    // Trang chủ (landing) — chunk riêng, các trang khác không tải kèm
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/landing/landing').then(m => m.LandingComponent),
  },
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
    // Đăng nhập học viên — cùng component với trang quản trị, khác đối tượng
    path: 'dang-nhap',
    title: 'Đăng nhập học viên',
    data: { audience: 'student' },
    loadComponent: () =>
      import('./features/admin/pages/admin-login/admin-login').then(m => m.AdminLoginComponent),
  },
  {
    // Khách tự đăng ký: email + số điện thoại, hoặc Google (migration 021, 022)
    path: 'dang-ky',
    title: 'Đăng ký tài khoản',
    loadComponent: () =>
      import('./features/classes/pages/guest-register/guest-register').then(m => m.GuestRegisterComponent),
  },
  {
    path: 'chinh-sach-bao-mat',
    title: 'Chính sách bảo mật',
    data: { doc: 'privacy' },
    loadComponent: () => import('./features/legal/pages/legal-page/legal-page').then(m => m.LegalPageComponent),
  },
  {
    path: 'dieu-khoan-su-dung',
    title: 'Điều khoản sử dụng',
    data: { doc: 'terms' },
    loadComponent: () => import('./features/legal/pages/legal-page/legal-page').then(m => m.LegalPageComponent),
  },
  {
    path: 'quen-mat-khau',
    title: 'Quên mật khẩu',
    loadComponent: () =>
      import('./features/classes/pages/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent),
  },
  {
    // Link trong thư khôi phục mật khẩu dẫn về đây
    path: 'dat-lai-mat-khau',
    title: 'Đặt lại mật khẩu',
    loadComponent: () =>
      import('./features/classes/pages/reset-password/reset-password').then(m => m.ResetPasswordComponent),
  },
  {
    // Đã dùng đủ 3 thiết bị (migration 026)
    path: 'thiet-bi',
    title: 'Thiết bị đăng nhập',
    loadComponent: () =>
      import('./features/classes/pages/device-limit/device-limit').then(m => m.DeviceLimitComponent),
  },
  {
    // Lần đầu đăng nhập Google
    path: 'hoan-tat-ho-so',
    title: 'Hoàn tất tài khoản',
    loadComponent: () =>
      import('./features/classes/pages/oauth-profile/oauth-profile').then(m => m.OauthProfileComponent),
  },
  {
    // Khu học viên (tài khoản do nhân sự tạo theo lớp)
    path: 'hoc-vien',
    canActivateChild: [studentGuard],
    children: [
      {
        path: '',
        title: 'Lớp của tôi',
        loadComponent: () =>
          import('./features/classes/pages/student-home/student-home').then(m => m.StudentHomeComponent),
      },
      {
        path: 'mat-khau',
        title: 'Đổi mật khẩu',
        loadComponent: () =>
          import('./features/classes/pages/student-password/student-password').then(m => m.StudentPasswordComponent),
      },
    ],
  },
  {
    // Khu quản trị: layout riêng (thanh bên), tách hẳn khỏi trang học viên
    path: 'admin',
    canActivate: [staffGuard],
    canActivateChild: [staffGuard],
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
        path: 'classes',
        canActivate: [permissionGuard('class.manage')],
        loadComponent: () =>
          import('./features/classes/pages/class-list/class-list').then(m => m.ClassListComponent),
      },
      {
        path: 'classes/:id',
        canActivate: [permissionGuard('class.manage')],
        loadComponent: () =>
          import('./features/classes/pages/class-detail/class-detail').then(m => m.ClassDetailComponent),
      },
      {
        path: 'students',
        canActivate: [permissionGuard('student.manage')],
        loadComponent: () =>
          import('./features/classes/pages/student-list/student-list').then(m => m.StudentListComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/admin/pages/admin-profile/admin-profile').then(m => m.AdminProfileComponent),
      },
      {
        path: 'staff',
        canActivate: [permissionGuard('staff.manage')],
        loadComponent: () =>
          import('./features/admin/pages/admin-staff/admin-staff').then(m => m.AdminStaffComponent),
      },
      {
        path: 'roles',
        canActivate: [permissionGuard('role.manage')],
        loadComponent: () =>
          import('./features/admin/pages/admin-roles/admin-roles').then(m => m.AdminRolesComponent),
      },
      {
        path: 'activity',
        canActivate: [permissionGuard('activity.read')],
        loadComponent: () =>
          import('./features/admin/pages/admin-activity/admin-activity').then(m => m.AdminActivityComponent),
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
    title: 'Flashcard',
    loadChildren: () =>
      import('./features/flashcards/flashcard.routes').then(m => m.flashcardRoutes),
  },
  {
    path: 'exams',
    title: 'Đề thi HSK',
    loadChildren: () =>
      import('./features/exams/exam.routes').then(m => m.examRoutes),
  },
  {
    path: '**',
    title: 'Không tìm thấy trang',
    loadComponent: () =>
      import('./features/not-found/not-found').then(m => m.NotFoundComponent),
  },
];
