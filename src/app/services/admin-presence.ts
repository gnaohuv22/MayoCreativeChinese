import { Injectable, signal } from '@angular/core';

/**
 * Cờ nhẹ "đang đăng nhập quản trị" cho component nạp sẵn (vd scroll-to-top),
 * để không kéo AuthService + supabase-js vào bundle ban đầu. AuthService cập nhật cờ này.
 */
@Injectable({ providedIn: 'root' })
export class AdminPresence {
  readonly active = signal(false);
}
