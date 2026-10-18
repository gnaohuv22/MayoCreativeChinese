import { Component, ChangeDetectionStrategy, computed, inject, signal, ElementRef, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import { SiteContentService } from '../../features/landing/services/site-content.service';
import { phoneDigits } from '../../features/landing/models/site-content.model';

/** "slug?a=b" → link trang chi tiết /khoa-hoc/<slug> kèm query */
function detailLink(detail: string): { detailSlug: string | null; detailQuery: Record<string, string> | null } {
  const [slug, query] = detail.trim().split('?');
  if (!slug) return { detailSlug: null, detailQuery: null };
  return { detailSlug: slug, detailQuery: query ? Object.fromEntries(new URLSearchParams(query)) : null };
}

@Component({
  selector: 'app-courses',
  imports: [RouterLink],
  templateUrl: './courses.html',
  styleUrl: './courses.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursesComponent {
  protected readonly i18n = inject(I18nService);
  private readonly site = inject(SiteContentService);

  private readonly sliderRef = viewChild<ElementRef<HTMLDivElement>>('slider');
  readonly canScrollLeft = signal(false);
  readonly canScrollRight = signal(true);
  readonly activeCardIndex = signal(0);

  readonly section = computed(() => this.site.content()?.courses);
  readonly zaloUrl = computed(() => `https://zalo.me/${phoneDigits(this.site.content()?.contact.phone ?? '')}`);
  readonly courses = computed(() => (this.section()?.items ?? []).map(course => ({ ...course, ...detailLink(course.detail) })));

  scrollSlider(direction: 'left' | 'right'): void {
    const slider = this.sliderRef()?.nativeElement;
    if (!slider) return;
    const cardWidth = slider.querySelector('.course-card')?.clientWidth ?? 380;
    const scrollAmount = cardWidth + 32; // card width + gap
    slider.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  }

  onSliderScroll(): void {
    const slider = this.sliderRef()?.nativeElement;
    if (!slider) return;
    this.canScrollLeft.set(slider.scrollLeft > 10);
    this.canScrollRight.set(
      slider.scrollLeft < slider.scrollWidth - slider.clientWidth - 10
    );

    const children = slider.querySelectorAll('.course-card');
    if (children.length === 0) return;

    let bestIndex = 0;
    let minDiff = Infinity;
    const sliderRect = slider.getBoundingClientRect();

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const childRect = child.getBoundingClientRect();
      const diff = Math.abs(childRect.left - sliderRect.left);
      if (diff < minDiff) {
        minDiff = diff;
        bestIndex = i;
      }
    }
    this.activeCardIndex.set(bestIndex);
  }

  scrollToCard(index: number): void {
    const slider = this.sliderRef()?.nativeElement;
    if (!slider) return;
    if (index === 0) {
      slider.scrollTo({
        left: 0,
        behavior: 'smooth',
      });
      return;
    }
    const children = slider.querySelectorAll('.course-card');
    const targetCard = children[index] as HTMLElement;
    if (targetCard) {
      const sliderRect = slider.getBoundingClientRect();
      const targetRect = targetCard.getBoundingClientRect();
      const paddingLeft = parseFloat(window.getComputedStyle(slider).paddingLeft) || 0;
      const relativeLeft = targetRect.left - sliderRect.left + slider.scrollLeft - paddingLeft;
      
      slider.scrollTo({
        left: Math.max(0, relativeLeft),
        behavior: 'smooth',
      });
    }
  }
}
