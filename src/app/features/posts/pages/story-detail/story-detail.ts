import { Component, ChangeDetectionStrategy, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { map } from 'rxjs';
import { HeaderComponent } from '../../../../components/header/header';
import { FooterComponent } from '../../../../components/footer/footer';
import { RegisterModalComponent } from '../../../../components/shared/register-modal/register-modal';
import { ScrollToTopComponent } from '../../../../components/shared/scroll-to-top/scroll-to-top';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { STUDENT_STORIES } from '../../data/student-stories.data';

@Component({
  selector: 'app-story-detail',
  standalone: true,
  imports: [RouterLink, HeaderComponent, FooterComponent, RegisterModalComponent, ScrollToTopComponent, AppIconComponent],
  templateUrl: './story-detail.html',
  styleUrl: './story-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeLightbox()',
    '(document:keydown.arrowright)': 'step(1)',
    '(document:keydown.arrowleft)': 'step(-1)',
  },
})
export class StoryDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  private readonly slug = toSignal(this.route.paramMap.pipe(map(p => p.get('slug') ?? '')), { initialValue: '' });

  readonly story = computed(() => STUDENT_STORIES.find(s => s.slug === this.slug()) ?? null);
  readonly others = computed(() => STUDENT_STORIES.filter(s => s.slug !== this.slug()).slice(0, 3));

  /** Ảnh đang xem phóng to (null = đóng) */
  readonly lightboxIndex = signal<number | null>(null);
  readonly lightboxImage = computed(() => {
    const i = this.lightboxIndex();
    return i === null ? null : this.story()?.images[i] ?? null;
  });

  constructor() {
    // Trả lại tiêu đề trang chủ khi rời trang
    const originalTitle = this.title.getTitle();
    inject(DestroyRef).onDestroy(() => this.title.setTitle(originalTitle));

    effect(() => {
      const s = this.story();
      if (!s && this.slug()) {
        this.router.navigateByUrl('/#stories');
        return;
      }
      if (s) {
        const fullTitle = `${s.title} | Mayo Creative Chinese`;
        const desc = s.excerpt || 'Câu chuyện học viên tại Mayo Creative Chinese';
        const url = typeof window !== 'undefined'
          ? window.location.href
          : `https://mayo-creative-chinese.vercel.app/bai-viet/${s.slug}`;

        this.title.setTitle(fullTitle);
        this.meta.updateTag({ name: 'description', content: desc });
        this.meta.updateTag({ property: 'og:title', content: fullTitle });
        this.meta.updateTag({ property: 'og:description', content: desc });
        this.meta.updateTag({ property: 'og:url', content: url });
        this.meta.updateTag({ property: 'twitter:title', content: fullTitle });
        this.meta.updateTag({ property: 'twitter:description', content: desc });
      }
      this.lightboxIndex.set(null);
    });
  }

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
  }

  closeLightbox(): void {
    this.lightboxIndex.set(null);
  }

  step(delta: number): void {
    const i = this.lightboxIndex();
    const count = this.story()?.images.length ?? 0;
    if (i === null || count === 0) return;
    this.lightboxIndex.set((i + delta + count) % count);
  }
}
