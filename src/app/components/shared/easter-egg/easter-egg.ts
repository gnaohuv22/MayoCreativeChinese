import { Component, ChangeDetectionStrategy, DestroyRef, ElementRef, Injector, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AppIconComponent } from '../icon/app-icon';

/** Gõ đủ chữ này (bất kỳ đâu, kể cả trong ô nhập) để mở quà */
const SECRET = 'mayocreativechinese';

/** Danh hiệu theo số từ đã thuộc */
const RANKS: { min: number; label: string; hanzi: string }[] = [
  { min: 1000, label: 'Đại sư', hanzi: '大师' },
  { min: 300, label: 'Cao thủ', hanzi: '高手' },
  { min: 100, label: 'Tiến bộ', hanzi: '进步' },
  { min: 20, label: 'Chăm chỉ', hanzi: '勤奋' },
  { min: 0, label: 'Tân binh', hanzi: '新手' },
];

export interface LearningSummary {
  name: string | null;
  signedIn: boolean;
  reviewed: number;
  mastered: number;
  reviews: number;
  bookmarked: number;
  lastStudied: number | null;
  exams: number;
  passed: number;
  bestPercent: number | null;
  rank: { label: string; hanzi: string };
}

/**
 * Quà ẩn: gõ "mayocreativechinese".
 * Khu quản trị → lời chào bà chủ; trang học viên → tóm tắt hành trình học.
 */
@Component({
  selector: 'app-easter-egg',
  standalone: true,
  imports: [RouterLink, AppIconComponent],
  templateUrl: './easter-egg.html',
  styleUrl: './easter-egg.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EasterEggComponent {
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly mode = signal<'admin' | 'learner' | null>(null);
  readonly summary = signal<LearningSummary | null>(null);
  /** Cánh hoa mai rơi: vị trí / độ trễ / màu cố định để không nhảy khi vẽ lại */
  readonly petals = Array.from({ length: 28 }, (_, i) => ({
    left: (i * 37) % 100,
    delay: (i % 9) * 0.35,
    duration: 4 + (i % 5) * 0.6,
    tone: i % 3,
  }));

  private typed = '';
  private lastFired = 0;

  constructor() {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1 || isPassword(e.target)) return;
      this.typed = (this.typed + e.key.toLowerCase()).slice(-SECRET.length);
      if (this.typed === SECRET) this.open();
    };
    // Bàn phím ảo trên điện thoại không gửi phím rõ ràng → xem chữ cuối trong ô nhập
    const onInput = (e: Event) => {
      const el = e.target;
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) || isPassword(el)) return;
      if (el.value.toLowerCase().replace(/\s+/g, '').endsWith(SECRET)) this.open();
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('input', onInput, true);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('input', onInput, true);
    });
  }

  close() {
    this.dialog().nativeElement.close();
  }

  private open() {
    // Trong ô nhập, cả keydown lẫn input cùng bắt được → chỉ mở 1 lần
    if (Date.now() - this.lastFired < 3000) return;
    this.lastFired = Date.now();
    this.typed = '';
    const url = this.router.url;
    const admin = url.startsWith('/admin') && !url.startsWith('/admin/login');
    this.mode.set(admin ? 'admin' : 'learner');
    this.dialog().nativeElement.showModal();
    if (!admin) {
      this.summary.set(null);
      this.loadSummary();
    }
  }

  /** Nạp dịch vụ khi cần để không tăng bundle ban đầu */
  private async loadSummary() {
    const [{ AuthService }, { ProgressService }] = await Promise.all([
      import('../../../services/auth.service'),
      import('../../../features/flashcards/services/progress.service'),
    ]);
    const auth = this.injector.get(AuthService);
    await auth.ready;
    const progress = await this.injector.get(ProgressService).allProgress().catch(() => []);
    let attempts: { score: number; total_score: number; passing_score: number | null }[] = [];
    if (auth.isLearner()) {
      const { StudentService } = await import('../../../features/classes/services/student.service');
      attempts = await this.injector.get(StudentService).myAttempts(200);
    }

    const mastered = progress.filter(p => p.confidence === 3).length;
    const lastStudied = progress.reduce((max, p) => Math.max(max, p.lastReviewed ?? 0), 0);
    const percents = attempts.filter(a => Number(a.total_score) > 0).map(a => Number(a.score) / Number(a.total_score));
    this.summary.set({
      name: auth.isLearner() ? auth.displayName() : null,
      signedIn: auth.isLearner() || auth.isStaff(),
      reviewed: progress.filter(p => p.reviewCount > 0).length,
      mastered,
      reviews: progress.reduce((sum, p) => sum + p.reviewCount, 0),
      bookmarked: progress.filter(p => p.bookmarked).length,
      lastStudied: lastStudied || null,
      exams: attempts.length,
      passed: attempts.filter(a => a.passing_score != null && Number(a.score) >= Number(a.passing_score)).length,
      bestPercent: percents.length ? Math.round(Math.max(...percents) * 100) : null,
      rank: RANKS.find(r => mastered >= r.min)!,
    });
  }

  lastStudiedText(ts: number): string {
    const days = Math.floor((Date.now() - ts) / 86_400_000);
    if (days <= 0) return 'hôm nay';
    if (days === 1) return 'hôm qua';
    return `${days} ngày trước`;
  }
}

function isPassword(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement && target.type === 'password';
}
