import { Component, inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.html'
})
export class AboutComponent {
  protected readonly i18n = inject(I18nService);
}
