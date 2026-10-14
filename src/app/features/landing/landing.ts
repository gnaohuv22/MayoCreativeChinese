import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HeaderComponent } from '../../components/header/header';
import { HeroComponent } from '../../components/hero/hero';
import { AboutComponent } from '../../components/about/about';
import { TeachersComponent } from '../../components/teachers/teachers';
import { CoursesComponent } from '../../components/courses/courses';
import { GalleryComponent } from '../../components/gallery/gallery';
import { StudentStoriesComponent } from '../../components/student-stories/student-stories';
import { FooterComponent } from '../../components/footer/footer';
import { ScrollToTopComponent } from '../../components/shared/scroll-to-top/scroll-to-top';
import { RegisterModalComponent } from '../../components/shared/register-modal/register-modal';

/** Trang chủ (route '') — tải riêng để các trang khác không phải tải kèm các khối landing */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    HeaderComponent,
    HeroComponent,
    AboutComponent,
    TeachersComponent,
    CoursesComponent,
    GalleryComponent,
    StudentStoriesComponent,
    FooterComponent,
    ScrollToTopComponent,
    RegisterModalComponent,
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {}
