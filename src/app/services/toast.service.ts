import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', title?: string, duration = 5000): void {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastMessage = { id, message, type, title, duration };

    this.toasts.update(list => [...list, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  success(message: string, title?: string, duration = 5000): void {
    this.show(message, 'success', title, duration);
  }

  error(message: string, title?: string, duration = 5000): void {
    this.show(message, 'error', title, duration);
  }

  info(message: string, title?: string, duration = 5000): void {
    this.show(message, 'info', title, duration);
  }

  warning(message: string, title?: string, duration = 5000): void {
    this.show(message, 'warning', title, duration);
  }

  dismiss(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
