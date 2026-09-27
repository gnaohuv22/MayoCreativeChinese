import { Component, inject, signal, ElementRef, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../services/i18n.service';

interface Course {
  id: string;
  titleKey: string;
  descKey: string;
  durationKey: string;
  classSizeKey: string;
  objectiveKey: string;
  icon: string;
  /** Nhãn nổi bật trên thẻ (VD: 'Mới') */
  badgeKey?: string;
  /** Trang chi tiết /khoa-hoc/<detailSlug> (nếu có) */
  detailSlug?: string;
  /** Query param khi mở trang chi tiết (VD: chọn sẵn tab Người lớn) */
  detailQuery?: Record<string, string>;
}

@Component({
  selector: 'app-courses',
  imports: [RouterLink],
  templateUrl: './courses.html',
  styleUrl: './courses.css'
})
export class CoursesComponent {
  protected readonly i18n = inject(I18nService);

  private readonly sliderRef = viewChild<ElementRef<HTMLDivElement>>('slider');
  readonly canScrollLeft = signal(false);
  readonly canScrollRight = signal(true);
  readonly activeCardIndex = signal(0);

  // Thứ tự theo brief: HSK 3.0 là khóa chủ lực, HSK 2.0 không đặt ở vị trí nổi bật
  readonly courses: Course[] = [
    {
      id: 'hsk',
      titleKey: 'course.hsk.title',
      descKey: 'course.hsk.desc',
      durationKey: 'course.hsk.duration',
      classSizeKey: 'course.hsk.class_size',
      objectiveKey: 'course.hsk.objective',
      icon: 'certificate',
      detailSlug: 'hsk-3-0'
    },
    {
      id: 'supplement',
      titleKey: 'course.supplement.title',
      descKey: 'course.supplement.desc',
      durationKey: 'course.supplement.duration',
      classSizeKey: 'course.supplement.class_size',
      objectiveKey: 'course.supplement.objective',
      icon: 'certificate',
      badgeKey: 'course.badge.new',
      detailSlug: 'bo-sung-hsk-2-len-3'
    },
    {
      id: 'kids',
      titleKey: 'course.kids.title',
      descKey: 'course.kids.desc',
      durationKey: 'course.kids.duration',
      classSizeKey: 'course.kids.class_size',
      objectiveKey: 'course.kids.objective',
      icon: 'academic',
      detailSlug: 'tieng-trung-tre-em'
    },
    {
      id: 'communication',
      titleKey: 'course.communication.title',
      descKey: 'course.communication.desc',
      durationKey: 'course.communication.duration',
      classSizeKey: 'course.communication.class_size',
      objectiveKey: 'course.communication.objective',
      icon: 'chat',
      detailSlug: 'tieng-trung-tre-em',
      // Khóa giao tiếp dùng chung lộ trình Nhập Môn – Thông Thạo – Tinh Anh, tab Người lớn
      detailQuery: { 'doi-tuong': 'nguoi-lon' }
    },
    {
      id: 'tutor',
      titleKey: 'course.tutor.title',
      descKey: 'course.tutor.desc',
      durationKey: 'course.tutor.duration',
      classSizeKey: 'course.tutor.class_size',
      objectiveKey: 'course.tutor.objective',
      icon: 'tutor',
      detailSlug: 'gia-su'
    },
    {
      id: 'business',
      titleKey: 'course.business.title',
      descKey: 'course.business.desc',
      durationKey: 'course.business.duration',
      classSizeKey: 'course.business.class_size',
      objectiveKey: 'course.business.objective',
      icon: 'business'
    },
    {
      id: 'logistics',
      titleKey: 'course.logistics.title',
      descKey: 'course.logistics.desc',
      durationKey: 'course.logistics.duration',
      classSizeKey: 'course.logistics.class_size',
      objectiveKey: 'course.logistics.objective',
      icon: 'logistics'
    },
    {
      id: 'hsk_old',
      titleKey: 'course.hsk_old.title',
      descKey: 'course.hsk_old.desc',
      durationKey: 'course.hsk_old.duration',
      classSizeKey: 'course.hsk_old.class_size',
      objectiveKey: 'course.hsk_old.objective',
      icon: 'certificate',
      detailSlug: 'hsk-2-0'
    }
  ];

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
    const children = slider.querySelectorAll('.course-card');
    const targetCard = children[index] as HTMLElement;
    if (targetCard) {
      const sliderRect = slider.getBoundingClientRect();
      const targetRect = targetCard.getBoundingClientRect();
      const relativeLeft = targetRect.left - sliderRect.left + slider.scrollLeft;
      
      slider.scrollTo({
        left: relativeLeft,
        behavior: 'smooth'
      });
    }
  }
}
