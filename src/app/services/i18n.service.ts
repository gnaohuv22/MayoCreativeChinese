import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type Lang = 'vi' | 'zh' | 'en' | 'ja' | 'km';

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly http = inject(HttpClient);

  private getSavedLang(): Lang {
    try {
      const saved = localStorage.getItem('mcc_lang') || localStorage.getItem('lang');
      if (saved && ['vi', 'zh', 'en', 'ja', 'km'].includes(saved)) {
        return saved as Lang;
      }
    } catch {
      // ignore
    }
    return 'vi';
  }

  readonly currentLang = signal<Lang>(this.getSavedLang());
  readonly translations = signal<Record<string, string>>({});
  
  private fallbackTranslations: Record<string, string> = {};

  readonly languages: { code: Lang; label: string }[] = [
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'zh', label: '中文' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'km', label: 'ភាសាខ្មែរ' }
  ];

  constructor() {
    const initialLang = this.currentLang();
    if (typeof document !== 'undefined') {
      document.documentElement.lang = initialLang;
    }

    // Preload Vietnamese as the fallback dictionary
    this.http.get<Record<string, string>>('i18n/vi.json').subscribe({
      next: (data) => {
        this.fallbackTranslations = data;
        // If current language is Vietnamese, set it as active translations immediately
        if (this.currentLang() === 'vi') {
          this.translations.set(data);
        }
      },
      error: (err) => {
        console.error('Failed to load fallback translations (vi.json):', err);
      }
    });

    // If initial language is not Vietnamese, load it
    if (initialLang !== 'vi') {
      this.loadTranslations(initialLang);
    }
  }

  private loadTranslations(lang: Lang): void {
    this.http.get<Record<string, string>>(`i18n/${lang}.json`).subscribe({
      next: (data) => {
        this.translations.set(data);
      },
      error: (err) => {
        console.error(`Failed to load translations for lang ${lang}:`, err);
      }
    });
  }

  setLang(lang: Lang): void {
    this.currentLang.set(lang);
    try {
      localStorage.setItem('mcc_lang', lang);
      localStorage.setItem('lang', lang);
    } catch {
      // ignore
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    this.loadTranslations(lang);
  }

  /**
   * Computed translator function to retrieve localized string.
   * Falls back to Vietnamese if the key is not defined in the active language,
   * and to the key name if not found anywhere.
   */
  readonly translate = computed(() => {
    const active = this.translations();
    const fallback = this.fallbackTranslations;
    return (key: string): string => {
      return active[key] ?? fallback[key] ?? key;
    };
  });
}
