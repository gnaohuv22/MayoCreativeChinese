import { Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-about',
  imports: [NgOptimizedImage],
  templateUrl: './about.html'
})
export class AboutComponent {
  protected readonly i18n = inject(I18nService);
}
