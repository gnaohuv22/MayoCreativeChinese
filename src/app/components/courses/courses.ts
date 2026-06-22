import { Component, inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';

interface Course {
  id: string;
  titleKey: string;
  descKey: string;
  duration: string;
  classSize: string;
  target: string;
}

@Component({
  selector: 'app-courses',
  templateUrl: './courses.html'
})
export class CoursesComponent {
  protected readonly i18n = inject(I18nService);

  readonly courses: Course[] = [
    {
      id: 'hsk',
      titleKey: 'course.hsk.title',
      descKey: 'course.hsk.desc',
      duration: '2.5 - 3.5 Months / Level',
      classSize: '8 - 12 Students',
      target: 'HSK 1 - HSK 5 Standardized Outputs'
    },
    {
      id: 'business',
      titleKey: 'course.business.title',
      descKey: 'course.business.desc',
      duration: '3 Months',
      classSize: '6 - 10 Students',
      target: 'Negotiation, Commercial Mail, Corporate communication'
    },
    {
      id: 'logistics',
      titleKey: 'course.logistics.title',
      descKey: 'course.logistics.desc',
      duration: '2.5 Months',
      classSize: '8 - 12 Students',
      target: 'Sourcing, Customs, Freight Terms, Taobao/1688 negotiation'
    }
  ];
}
