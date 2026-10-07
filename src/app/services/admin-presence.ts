import { Injectable, signal } from '@angular/core';

/**
 * Cờ nhẹ "đang đăng nhập" cho component nạp sẵn (vd scroll-to-top, thanh điều hướng),
 * để không kéo AuthService + supabase-js vào bundle ban đầu. AuthService cập nhật các cờ này.
 */
@Injectable({ providedIn: 'root' })
export class AdminPresence {
  /** Nhân sự đang đăng nhập */
  readonly active = signal(false);
  /** Họ tên học viên đang đăng nhập (null = không phải học viên) */
  readonly student = signal<string | null>(null);
}
