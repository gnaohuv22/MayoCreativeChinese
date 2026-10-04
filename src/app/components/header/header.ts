import { Component, computed, inject, input, signal } from '@angular/core';
import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { I18nService, Lang } from '../../services/i18n.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  imports: [NgOptimizedImage, NgTemplateOutlet, RouterLink],
  templateUrl: './header.html',
  host: {
    '(window:scroll)': 'onWindowScroll()',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeMenus()',
  }
})
export class HeaderComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly theme = inject(ThemeService);

  readonly isScrolled = signal(false);
  readonly isMobileMenuOpen = signal(false);
  readonly isLangDropdownOpen = signal(false);
  readonly isFreeMenuOpen = signal(false);
  readonly activeSection = signal('home');

  /** Trang có phần đầu nền tối (VD: trang khoá học) — header trong suốt cần chữ sáng */
  readonly overDarkHero = input(false);
  /** Header còn trong suốt nằm trên nền tối: phần tử con dùng màu của chế độ tối */
  /** Nền header hiện khi đã cuộn hoặc đang mở menu điện thoại */
  readonly isSolid = computed(() => this.isScrolled() || this.isMobileMenuOpen());
  readonly onDarkHero = computed(() => this.overDarkHero() && !this.isSolid());
  readonly lightText = computed(() => this.theme.isDarkMode() || this.onDarkHero());

  toggleFreeMenu(): void {
    this.isFreeMenuOpen.update(v => !v);
  }

  closeMenus(): void {
    this.isFreeMenuOpen.set(false);
    this.isLangDropdownOpen.set(false);
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.isFreeMenuOpen() && !(event.target as Element | null)?.closest('[data-free-menu]')) {
      this.isFreeMenuOpen.set(false);
    }
  }

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
