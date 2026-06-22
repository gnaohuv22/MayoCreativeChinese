import { Component, inject, signal, computed } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { I18nService } from '../../services/i18n.service';

interface GalleryItem {
  id: string;
  src: string;
  category: 'tet' | 'hsk' | 'women';
  captionKey: string;
}

@Component({
  selector: 'app-gallery',
  imports: [NgOptimizedImage],
  templateUrl: './gallery.html',
  host: {
    '(document:keydown)': 'handleKeyboardEvent($event)'
  }
})
export class GalleryComponent {
  protected readonly i18n = inject(I18nService);

  readonly selectedFilter = signal<string>('all');
  readonly selectedItem = signal<GalleryItem | null>(null);

  readonly filters = [
    { value: 'all', labelKey: 'gallery.filter.all' },
    { value: 'tet', labelKey: 'gallery.filter.tet' },
    { value: 'hsk', labelKey: 'gallery.filter.hsk' },
    { value: 'women', labelKey: 'gallery.filter.women' }
  ];

  readonly items: GalleryItem[] = [
    // Tet 2026 Activity
    {
      id: 'tet1',
      src: 'tet-2026-activity/IMG_1970.jpg',
      category: 'tet',
      captionKey: 'gallery.caption.tet1'
    },
    {
      id: 'tet2',
      src: 'tet-2026-activity/IMG_1979.jpg',
      category: 'tet',
      captionKey: 'gallery.caption.tet2'
    },
    {
      id: 'tet3',
      src: 'tet-2026-activity/IMG_1963.jpg',
      category: 'tet',
      captionKey: 'gallery.caption.tet3'
    },
    // HSK Achievements
    {
      id: 'hsk1',
      src: 'hsk-achievement/IMG_2771.JPG',
      category: 'hsk',
      captionKey: 'gallery.caption.hsk1'
    },
    {
      id: 'hsk2',
      src: 'hsk-achievement/ddb4b26f-f9af-4aa3-823e-689b479eb9c0.jpeg',
      category: 'hsk',
      captionKey: 'gallery.caption.hsk2'
    },
    {
      id: 'hsk3',
      src: 'hsk-achievement/fb1d0525-373d-4ba7-8842-61437fc4f80e.jpeg',
      category: 'hsk',
      captionKey: 'gallery.caption.hsk3'
    },
    // Women's Day Activity
    {
      id: 'women1',
      src: 'hsk-achievement/women-day-2025/IMG_4816.JPG',
      category: 'women',
      captionKey: 'gallery.caption.women1'
    },
    {
      id: 'women2',
      src: 'hsk-achievement/women-day-2025/IMG_4825.JPG',
      category: 'women',
      captionKey: 'gallery.caption.women2'
    },
    {
      id: 'women3',
      src: 'hsk-achievement/women-day-2025/IMG_4833.JPG',
      category: 'women',
      captionKey: 'gallery.caption.women3'
    }
  ];

  // Derived filter computation
  readonly filteredItems = computed(() => {
    const filter = this.selectedFilter();
    if (filter === 'all') {
      return this.items;
    }
    return this.items.filter(item => item.category === filter);
  });

  setFilter(filter: string): void {
    this.selectedFilter.set(filter);
  }

  getFilterLabelKey(category: string): string {
    const found = this.filters.find(f => f.value === category);
    return found ? found.labelKey : '';
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
