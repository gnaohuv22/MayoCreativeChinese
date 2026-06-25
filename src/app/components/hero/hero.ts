import { Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { I18nService } from '../../services/i18n.service';
import { RegisterModalService } from '../../services/register-modal.service';

@Component({
  selector: 'app-hero',
  imports: [NgOptimizedImage],
  templateUrl: './hero.html'
})
export class HeroComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly registerModal = inject(RegisterModalService);

  openRegisterModal(): void {
    this.registerModal.open();
  }
}
