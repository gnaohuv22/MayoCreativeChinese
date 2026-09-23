import { Component, inject, computed } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { HeaderComponent } from './components/header/header';
import { HeroComponent } from './components/hero/hero';
import { AboutComponent } from './components/about/about';
import { TeachersComponent } from './components/teachers/teachers';
import { CoursesComponent } from './components/courses/courses';
import { GalleryComponent } from './components/gallery/gallery';
import { FooterComponent } from './components/footer/footer';
import { ScrollToTopComponent } from './components/shared/scroll-to-top/scroll-to-top';
import { RegisterModalComponent } from './components/shared/register-modal/register-modal';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    HeroComponent,
    AboutComponent,
    TeachersComponent,
    CoursesComponent,
    GalleryComponent,
    FooterComponent,
    ScrollToTopComponent,
    RegisterModalComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  readonly isLandingPage = computed(() => {
    const url = this.currentUrl();
    return url === '/' || url === '' || url.startsWith('/#');
  });
}
