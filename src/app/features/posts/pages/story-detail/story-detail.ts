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
import { StoryService } from '../../services/story.service';
import type { StudentStory } from '../../models/student-story.model';

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

  private readonly stories = inject(StoryService);

  /** undefined = đang tải, null = không có bài */
  private readonly loaded = signal<StudentStory | null | undefined>(undefined);
  readonly story = computed(() => this.loaded() ?? null);
  readonly loadFailed = signal(false);
  /** Tăng để tải lại bài sau lỗi */
  private readonly attempt = signal(0);
  readonly others = computed(() => (this.stories.summaries() ?? []).filter(s => s.slug !== this.slug()).slice(0, 3));

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

    void this.stories.loadSummaries();

    // Đổi slug (bấm sang bài khác) → tải bài mới; bỏ kết quả của slug cũ nếu về muộn
    effect(() => {
      const slug = this.slug();
      this.attempt();
      this.loaded.set(undefined);
      this.loadFailed.set(false);
      if (!slug) return;
      this.stories.get(slug).then(
        story => {
          if (this.slug() === slug) this.loaded.set(story);
        },
        () => {
          if (this.slug() === slug) this.loadFailed.set(true);
        },
      );
    });

    effect(() => {
      const loaded = this.loaded();
      if (loaded === undefined) return;
      const s = loaded;
      if (!s && this.slug()) {
        this.router.navigateByUrl('/#stories');
        return;
      }
      if (s) {
        const fullTitle = `${s.title} | Mayo Creative Chinese`;
        const desc = s.excerpt || 'Câu chuyện học viên tại Mayo Creative Chinese';
        const url = typeof window !== 'undefined'
          ? window.location.href
          : `https://www.mayochinese.com/bai-viet/${s.slug}`;

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

  retry(): void {
    this.attempt.update(n => n + 1);
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
