import { Injectable, signal } from '@angular/core';

/**
 * Đọc to tiếng Trung bằng giọng đọc có sẵn của trình duyệt (Web Speech API).
 * Không cần file âm thanh; chất lượng giọng tuỳ thiết bị. Thiết bị không có giọng zh → `available()` = false.
 */
@Injectable({ providedIn: 'root' })
export class SpeechService {
  private readonly synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  private voice: SpeechSynthesisVoice | null = null;

  /** Có giọng đọc tiếng Trung để dùng */
  readonly available = signal(false);
  /** Nội dung đang đọc (để tô sáng nút loa) */
  readonly speaking = signal<string | null>(null);

  constructor() {
    if (!this.synth) return;
    this.pickVoice();
    // Chrome nạp danh sách giọng bất đồng bộ
    this.synth.addEventListener?.('voiceschanged', () => this.pickVoice());
  }

  private pickVoice(): void {
    const voices = this.synth?.getVoices() ?? [];
    const zh = voices.filter(v => /^zh|^cmn/i.test(v.lang));
    // Ưu tiên giọng Phổ thông Trung Quốc đại lục
    this.voice =
      zh.find(v => /zh[-_]CN/i.test(v.lang)) ??
      zh.find(v => !/HK|yue/i.test(v.lang)) ??
      zh[0] ??
      null;
    // Một số trình duyệt (Safari iOS) không liệt kê giọng nhưng vẫn đọc được với lang zh-CN
    this.available.set(!!this.voice || (!!this.synth && voices.length === 0));
  }

  speak(text: string | null | undefined, rate = 0.85): void {
    const clean = (text ?? '').trim();
    if (!this.synth || !clean) return;

    this.synth.cancel();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = this.voice?.lang ?? 'zh-CN';
    if (this.voice) utter.voice = this.voice;
    utter.rate = rate;
    utter.onend = utter.onerror = () => {
      if (this.speaking() === clean) this.speaking.set(null);
    };
    this.speaking.set(clean);
    this.synth.speak(utter);
  }

  stop(): void {
    this.synth?.cancel();
    this.speaking.set(null);
  }
}
