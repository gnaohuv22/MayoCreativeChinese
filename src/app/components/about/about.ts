import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { I18nService } from '../../services/i18n.service';
import { SiteContentService } from '../../features/landing/services/site-content.service';

@Component({
  selector: 'app-about',
  imports: [NgOptimizedImage],
  templateUrl: './about.html',
  styleUrl: './about.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  protected readonly i18n = inject(I18nService);
  private readonly site = inject(SiteContentService);

  readonly about = computed(() => this.site.content()?.about);
}
