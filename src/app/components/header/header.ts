import { Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { I18nService, Lang } from '../../services/i18n.service';

@Component({
  selector: 'app-header',
  imports: [NgOptimizedImage],
  templateUrl: './header.html',
  host: {
    '(window:scroll)': 'onWindowScroll()'
  }
})
export class HeaderComponent {
  protected readonly i18n = inject(I18nService);

  readonly isScrolled = signal(false);
  readonly isMobileMenuOpen = signal(false);
  readonly isLangDropdownOpen = signal(false);
  readonly activeSection = signal('home');

  readonly navItems = [
    { id: 'about' },
    { id: 'teachers' },
    { id: 'courses' },
    { id: 'gallery' },
    { id: 'contact' }
  ];

  onWindowScroll(): void {
    const scrollPos = window.scrollY || document.documentElement.scrollTop || 0;
    this.isScrolled.set(scrollPos > 50);

    const sections = ['home', 'about', 'teachers', 'courses', 'gallery', 'contact'];
    for (const section of sections) {
      const el = document.getElementById(section);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120 && rect.bottom >= 120) {
          this.activeSection.set(section);
          break;
        }
      }
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  toggleLangDropdown(): void {
    this.isLangDropdownOpen.update(v => !v);
  }

  changeLang(lang: Lang): void {
    this.i18n.setLang(lang);
    this.isLangDropdownOpen.set(false);
  }
}
