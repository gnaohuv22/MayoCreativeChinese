import { Injectable, signal } from '@angular/core';

/** Ngữ cảnh khi mở form từ một trang khóa học */
export interface RegisterContext {
  /** Khóa quan tâm (tự điền theo trang) */
  course: string;
  /** Mở từ nút "Học thử miễn phí" */
  trial?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterModalService {
  readonly isOpen = signal(false);
  readonly context = signal<RegisterContext | null>(null);

  open(context: RegisterContext | null = null): void {
    if (this.isOpen()) return;
    this.context.set(context);
    this.isOpen.set(true);
    // Lock body scrolling when modal is open
    document.body.style.overflow = 'hidden';
  }

  close(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    // Restore body scrolling
    document.body.style.overflow = '';
  }
}
