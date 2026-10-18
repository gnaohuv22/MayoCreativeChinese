import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import { SiteContentService } from '../../features/landing/services/site-content.service';
import { phoneDigits } from '../../features/landing/models/site-content.model';

@Component({
  selector: 'app-footer',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  protected readonly i18n = inject(I18nService);
  private readonly site = inject(SiteContentService);

  readonly contact = this.site.contact;
  readonly telUrl = computed(() => `tel:${phoneDigits(this.contact()?.phone ?? '')}`);
  readonly zaloUrl = computed(() => `https://zalo.me/${phoneDigits(this.contact()?.phone ?? '')}`);

  constructor() {
    // Chân trang có cả ở trang khoá học, pháp lý, bài đăng — ở đó chỉ cần khối liên hệ
    void this.site.loadContact();
  }
}
