import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { AppIconComponent } from '../shared/icon/app-icon';
import { I18nService, type LocalizedText } from '../../services/i18n.service';
import { SiteContentService } from '../../features/landing/services/site-content.service';
import type { GalleryItem } from '../../features/landing/models/site-content.model';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-gallery',
  imports: [NgOptimizedImage, AppIconComponent],
  templateUrl: './gallery.html',
  styleUrl: './gallery.css',
  host: {
    '(document:keydown)': 'handleKeyboardEvent($event)'
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly theme = inject(ThemeService);
  private readonly site = inject(SiteContentService);

  readonly selectedFilter = signal<string>('all');
  readonly selectedItem = signal<GalleryItem | null>(null);

  readonly section = computed(() => this.site.content()?.gallery);
  readonly items = computed(() => this.section()?.items ?? []);
  /** Bộ lọc: Tất cả + các danh mục có ảnh */
  readonly filters = computed(() => [
    { value: 'all', label: null as LocalizedText | null },
    ...(this.section()?.categories ?? [])
      .filter(c => this.items().some(i => i.category === c.id))
      .map(c => ({ value: c.id, label: c.label })),
  ]);

  // Derived filter computation
  readonly filteredItems = computed(() => {
    const filter = this.selectedFilter();
    if (filter === 'all') {
      return this.items();
    }
    return this.items().filter(item => item.category === filter);
  });

  setFilter(filter: string): void {
    this.selectedFilter.set(filter);
  }

  categoryLabel(category: string): LocalizedText | null {
    return this.section()?.categories.find(c => c.id === category)?.label ?? null;
  }

  openLightbox(item: GalleryItem): void {
    this.selectedItem.set(item);
  }

  closeLightbox(): void {
    this.selectedItem.set(null);
  }

  nextImage(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const current = this.selectedItem();
    if (!current) return;

    const list = this.filteredItems();
    const index = list.findIndex(i => i.id === current.id);
    const nextIndex = (index + 1) % list.length;
    this.selectedItem.set(list[nextIndex]);
  }

  prevImage(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const current = this.selectedItem();
    if (!current) return;

    const list = this.filteredItems();
    const index = list.findIndex(i => i.id === current.id);
    const prevIndex = (index - 1 + list.length) % list.length;
    this.selectedItem.set(list[prevIndex]);
  }

  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.selectedItem()) return;

    if (event.key === 'Escape') {
      this.closeLightbox();
    } else if (event.key === 'ArrowRight') {
      this.nextImage();
    } else if (event.key === 'ArrowLeft') {
      this.prevImage();
    }
  }
}
