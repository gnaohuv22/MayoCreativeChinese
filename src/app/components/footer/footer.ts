import { Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-footer',
  imports: [NgOptimizedImage],
  templateUrl: './footer.html'
})
export class FooterComponent {
  protected readonly i18n = inject(I18nService);
}
