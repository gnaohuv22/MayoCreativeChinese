import { Component, ChangeDetectionStrategy, inject, input, signal } from '@angular/core';
import { AuthService } from '../../../services/auth.service';

/** Nút "Tiếp tục với Google" — chuyển sang Google, quay lại /dang-nhap (giữ returnUrl) */
@Component({
  selector: 'app-google-button',
  standalone: true,
  templateUrl: './google-button.html',
  styleUrl: './google-button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoogleButtonComponent {
  private readonly auth = inject(AuthService);

  /** Trang muốn quay về sau khi đăng nhập */
  readonly returnUrl = input<string | undefined>(undefined);

  readonly redirecting = signal(false);
  readonly error = signal<string | null>(null);

  async signIn() {
    if (this.redirecting()) return;
    this.redirecting.set(true);
    this.error.set(null);
    const res = await this.auth.signInWithGoogle(this.returnUrl());
    if (res.error) {
      this.redirecting.set(false);
      this.error.set('Chưa mở được đăng nhập Google. Vui lòng thử lại.');
    }
  }
}
