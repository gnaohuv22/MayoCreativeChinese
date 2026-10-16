import { Component, ChangeDetectionStrategy, ElementRef, OnDestroy, afterNextRender, input, output, viewChild } from '@angular/core';

/**
 * Site key Cloudflare Turnstile (công khai, không phải bí mật). Để trống = tắt kiểm tra chống bot.
 * Chạy local dùng khoá thử của Cloudflare (luôn qua) để không cần đăng ký localhost.
 */
const SITE_KEY = '0x4AAAAAAFYKdgtT-RaoMLcJ';
const TEST_SITE_KEY = '1x00000000000000000000AA';
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileApi {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptLoading: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  scriptLoading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile missing')));
    script.onerror = () => {
      scriptLoading = null;
      reject(new Error('turnstile script failed'));
    };
    document.head.appendChild(script);
  });
  return scriptLoading;
}

function siteKey(): string {
  const host = location.hostname;
  return host === 'localhost' || host === '127.0.0.1' ? TEST_SITE_KEY : SITE_KEY;
}

/** Đã cấu hình Turnstile chưa — form chỉ chờ token khi có */
export function turnstileEnabled(): boolean {
  return siteKey() !== '';
}

/**
 * Ô xác minh Cloudflare Turnstile. Phát token mỗi khi có token mới, null khi token hết hạn / lỗi.
 * Token chỉ dùng được 1 lần: form gọi reset() sau mỗi lần gửi.
 */
@Component({
  selector: 'app-turnstile',
  standalone: true,
  templateUrl: './turnstile.html',
  styleUrl: './turnstile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnstileComponent implements OnDestroy {
  /** Tên thao tác, máy chủ đối chiếu (VD 'signup') */
  readonly action = input.required<string>();
  readonly token = output<string | null>();

  private readonly container = viewChild.required<ElementRef<HTMLElement>>('container');
  private widgetId: string | null = null;
  private destroyed = false;

  constructor() {
    afterNextRender(() => void this.render());
  }

  private async render() {
    if (!turnstileEnabled()) return;
    try {
      const api = await loadTurnstile();
      if (this.destroyed) return;
      this.widgetId = api.render(this.container().nativeElement, {
        sitekey: siteKey(),
        action: this.action(),
        theme: 'auto',
        language: 'vi',
        size: 'flexible',
        callback: (t: string) => this.token.emit(t),
        'expired-callback': () => this.token.emit(null),
        'error-callback': () => this.token.emit(null),
      });
    } catch (err) {
      console.error('Turnstile load failed:', err);
    }
  }

  /** Lấy token mới (token cũ đã bị máy chủ dùng) */
  reset() {
    this.token.emit(null);
    if (this.widgetId && window.turnstile) window.turnstile.reset(this.widgetId);
  }

  ngOnDestroy() {
    this.destroyed = true;
    if (this.widgetId && window.turnstile) window.turnstile.remove(this.widgetId);
  }
}
