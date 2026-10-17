import { Injector, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import type { Permission } from './auth.service';

/** Nạp AuthService động để supabase-js không nằm trong bundle ban đầu của trang học viên */
async function loadAuth(injector: Injector) {
  const { AuthService } = await import('./auth.service');
  const auth = injector.get(AuthService);
  await auth.ready;
  return auth;
}

/** Khu quản trị: cần có hồ sơ nhân sự */
export const staffGuard: CanActivateFn = async (_route, state) => {
  const injector = inject(Injector);
  const router = inject(Router);
  const auth = await loadAuth(injector);
  if (auth.isStaff()) return true;
  // Học viên đang đăng nhập → báo không có quyền (không đưa về trang đăng nhập quản trị)
  if (auth.isLearner()) return router.createUrlTree(['/khong-co-quyen']);
  return router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });
};

/** Trang đăng nhập / đăng ký: đã đăng nhập thì về trang của mình (hoặc returnUrl hợp lệ) */
export const guestOnlyGuard: CanActivateFn = async route => {
  const injector = inject(Injector);
  const router = inject(Router);
  const auth = await loadAuth(injector);
  const returnUrl = route.queryParamMap.get('returnUrl') ?? '';
  const safe = returnUrl.startsWith('/') && !returnUrl.startsWith('//') && !/^\/(dang-nhap|dang-ky|admin\/login)/.test(returnUrl);
  if (auth.isStaff()) return router.parseUrl(safe && returnUrl.startsWith('/admin') ? returnUrl : '/admin/exams');
  if (auth.isLearner()) return router.parseUrl(safe && !returnUrl.startsWith('/admin') ? returnUrl : '/hoc-vien');
  if (auth.needsOauthProfile()) return router.createUrlTree(['/hoan-tat-ho-so'], { queryParams: safe ? { returnUrl } : {} });
  return true;
};

/** Trang cần một quyền cụ thể; thiếu quyền → về trang đề thi */
export function permissionGuard(permission: Permission): CanActivateFn {
  return async () => {
    const injector = inject(Injector);
    const router = inject(Router);
    const auth = await loadAuth(injector);
    return auth.can(permission) || router.createUrlTree(['/admin/exams']);
  };
}

/** Làm đề thi: cần đăng nhập (nhân sự hoặc tài khoản học viên) */
export const accountGuard: CanActivateFn = async (_route, state) => {
  const injector = inject(Injector);
  const router = inject(Router);
  const auth = await loadAuth(injector);
  if (auth.isStaff()) return true;
  const student = auth.student();
  if (!student && auth.needsOauthProfile()) {
    return router.createUrlTree(['/hoan-tat-ho-so'], { queryParams: { returnUrl: state.url } });
  }
  if (!student) return router.createUrlTree(['/dang-nhap'], { queryParams: { returnUrl: state.url } });
  if (auth.deviceBlocked()) return router.createUrlTree(['/thiet-bi'], { queryParams: { returnUrl: state.url } });
  if (student.must_change_password) return router.createUrlTree(['/hoc-vien/mat-khau']);
  return true;
};

/** Khu học viên: cần tài khoản học viên; mật khẩu do giáo viên cấp phải đổi trước khi vào trang khác */
export const studentGuard: CanActivateFn = async (route, state) => {
  const injector = inject(Injector);
  const router = inject(Router);
  const auth = await loadAuth(injector);
  const student = auth.student();
  if (!student && auth.needsOauthProfile()) {
    return router.createUrlTree(['/hoan-tat-ho-so'], { queryParams: { returnUrl: state.url } });
  }
  if (!student) return router.createUrlTree(['/dang-nhap'], { queryParams: { returnUrl: state.url } });
  if (auth.deviceBlocked()) return router.createUrlTree(['/thiet-bi'], { queryParams: { returnUrl: state.url } });
  if (student.must_change_password && route.routeConfig?.path !== 'mat-khau') {
    return router.createUrlTree(['/hoc-vien/mat-khau']);
  }
  return true;
};
