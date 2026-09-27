import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, NavHeaderComponent],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  username = '';
  password = '';
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.auth.ready.then(() => {
      if (this.auth.isAdmin()) this.router.navigateByUrl(this.returnUrl());
    });
  }

  /** Chỉ cho phép quay lại đường dẫn nội bộ */
  private returnUrl(): string {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url?.startsWith('/') && !url.startsWith('//') ? url : '/admin/exams';
  }

  async submit() {
    if (!this.username.trim() || !this.password) return;
    this.isSubmitting.set(true);
    this.error.set(null);
    const res = await this.auth.signIn(this.username, this.password);
    this.isSubmitting.set(false);
    if (res.error) {
      this.error.set(res.error === 'Invalid login credentials' ? 'Tài khoản hoặc mật khẩu không đúng.' : res.error);
      return;
    }
    await this.router.navigateByUrl(this.returnUrl());
  }
}
