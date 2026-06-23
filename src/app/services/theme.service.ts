import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly isDarkMode = signal<boolean>(false);

  constructor() {
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = storedTheme === 'dark' || (!storedTheme && systemPrefersDark);
    
    this.isDarkMode.set(dark);
    this.updateThemeClass(dark);

    effect(() => {
      const isDark = this.isDarkMode();
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      this.updateThemeClass(isDark);
    });
  }

  toggleTheme(): void {
    document.documentElement.classList.add('theme-transitioning');
    this.isDarkMode.update(v => !v);
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 300);
  }

  private updateThemeClass(dark: boolean): void {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
