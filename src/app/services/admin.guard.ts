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
  return auth.isStaff() || router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });
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
