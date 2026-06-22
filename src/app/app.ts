import { Component } from '@angular/core';
import { HeaderComponent } from './components/header/header';
import { HeroComponent } from './components/hero/hero';
import { AboutComponent } from './components/about/about';
import { TeachersComponent } from './components/teachers/teachers';
import { CoursesComponent } from './components/courses/courses';
import { GalleryComponent } from './components/gallery/gallery';
import { FooterComponent } from './components/footer/footer';
import { ScrollToTopComponent } from './components/shared/scroll-to-top/scroll-to-top';

@Component({
  selector: 'app-root',
  imports: [
    HeaderComponent,
    HeroComponent,
    AboutComponent,
    TeachersComponent,
    CoursesComponent,
    GalleryComponent,
    FooterComponent,
    ScrollToTopComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
