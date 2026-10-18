import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { AppIconComponent } from '../shared/icon/app-icon';
import { I18nService } from '../../services/i18n.service';
import { RegisterModalService } from '../../services/register-modal.service';
import { SiteContentService } from '../../features/landing/services/site-content.service';

@Component({
  selector: 'app-hero',
  imports: [NgOptimizedImage, AppIconComponent],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly registerModal = inject(RegisterModalService);
  protected readonly site = inject(SiteContentService);

  readonly hero = computed(() => this.site.content()?.hero);

  openRegisterModal(): void {
    this.registerModal.open();
  }
}
