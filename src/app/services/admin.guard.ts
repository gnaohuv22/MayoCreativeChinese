import { Injector, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = async (_route, state) => {
  const injector = inject(Injector);
  const router = inject(Router);
  // Nạp động để supabase-js không nằm trong bundle ban đầu của trang học viên
  const { AuthService } = await import('./auth.service');
  const auth = injector.get(AuthService);
  await auth.ready;
  return auth.isStaff() || router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });
};
