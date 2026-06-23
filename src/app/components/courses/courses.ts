import { Component, inject, signal, ElementRef, viewChild } from '@angular/core';
import { I18nService } from '../../services/i18n.service';

interface Course {
  id: string;
  titleKey: string;
  descKey: string;
  durationKey: string;
  classSizeKey: string;
  objectiveKey: string;
  icon: string;
}

@Component({
  selector: 'app-courses',
  templateUrl: './courses.html',
  styleUrl: './courses.css'
})
export class CoursesComponent {
  protected readonly i18n = inject(I18nService);

  private readonly sliderRef = viewChild<ElementRef<HTMLDivElement>>('slider');
  readonly canScrollLeft = signal(false);
  readonly canScrollRight = signal(true);
  readonly activeCardIndex = signal(0);

  readonly courses: Course[] = [
    {
      id: 'kids',
      titleKey: 'course.kids.title',
      descKey: 'course.kids.desc',
      durationKey: 'course.kids.duration',
      classSizeKey: 'course.kids.class_size',
      objectiveKey: 'course.kids.objective',
      icon: 'academic'
    },
    {
      id: 'communication',
      titleKey: 'course.communication.title',
      descKey: 'course.communication.desc',
      durationKey: 'course.communication.duration',
      classSizeKey: 'course.communication.class_size',
      objectiveKey: 'course.communication.objective',
      icon: 'chat'
    },
    {
      id: 'hsk',
      titleKey: 'course.hsk.title',
      descKey: 'course.hsk.desc',
      durationKey: 'course.hsk.duration',
      classSizeKey: 'course.hsk.class_size',
      objectiveKey: 'course.hsk.objective',
      icon: 'certificate'
    },
    {
      id: 'hsk_old',
      titleKey: 'course.hsk_old.title',
      descKey: 'course.hsk_old.desc',
      durationKey: 'course.hsk_old.duration',
      classSizeKey: 'course.hsk_old.class_size',
      objectiveKey: 'course.hsk_old.objective',
      icon: 'certificate'
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
