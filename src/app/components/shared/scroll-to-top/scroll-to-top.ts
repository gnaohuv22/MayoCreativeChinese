import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-scroll-to-top',
  templateUrl: './scroll-to-top.html',
  host: {
    '(window:scroll)': 'onWindowScroll()'
  }
})
export class ScrollToTopComponent {
  readonly isVisible = signal(false);
  /** Nâng nút lên trên điện thoại khi trang có thanh cố định ở đáy (VD: nút "Đăng ký ngay") */
  readonly raised = input(false);

  onWindowScroll(): void {
    const scrollPos = window.scrollY || document.documentElement.scrollTop || 0;
    this.isVisible.set(scrollPos > 300);
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
