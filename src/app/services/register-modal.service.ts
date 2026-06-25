import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RegisterModalService {
  readonly isOpen = signal(false);

  open(): void {
    if (this.isOpen()) return;
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
