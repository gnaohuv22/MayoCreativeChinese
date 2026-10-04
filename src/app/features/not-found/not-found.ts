import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../components/header/header';
import { FooterComponent } from '../../components/footer/footer';
import { RegisterModalComponent } from '../../components/shared/register-modal/register-modal';
import { AppIconComponent } from '../../components/shared/icon/app-icon';

/** Trang 404 cho mọi địa chỉ không khớp route nào */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, HeaderComponent, FooterComponent, RegisterModalComponent, AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header />
    <main class="min-h-[70vh] flex items-center bg-brand-light dark:bg-brand-dark transition-colors duration-300 pt-28 pb-16">
      <div class="max-w-xl mx-auto px-4 text-center">
        <p class="font-display font-black text-7xl sm:text-8xl text-brand-pink">404</p>
        <h1 class="mt-4 font-display font-black text-2xl sm:text-3xl text-brand-navy dark:text-white">Không tìm thấy trang</h1>
        <p class="mt-3 text-sm sm:text-base text-brand-navy/70 dark:text-white/70 leading-relaxed">
          Địa chỉ này không tồn tại hoặc đã được chuyển đi.
        </p>
        <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a routerLink="/" class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-pink text-white text-sm font-bold shadow-md hover:bg-brand-pink/90 transition-all">
            <app-icon name="arrow-left" size="xs" />
            <span>Về trang chủ</span>
          </a>
          <a routerLink="/flashcards" class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-brand-navy/15 dark:border-white/15 bg-white dark:bg-white/5 text-brand-navy dark:text-white text-sm font-bold hover:text-brand-pink transition-all">
            <app-icon name="book-open" size="xs" />
            <span>Flashcard</span>
          </a>
        </div>
      </div>
    </main>
    <app-footer />
    <app-register-modal />
  `,
})
export class NotFoundComponent implements OnInit, OnDestroy {
  private readonly meta = inject(Meta);

  ngOnInit(): void {
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnDestroy(): void {
    this.meta.removeTag("name='robots'");
  }
}
