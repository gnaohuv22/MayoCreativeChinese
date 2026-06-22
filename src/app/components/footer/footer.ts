import { Component, inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html'
})
export class FooterComponent {
  protected readonly i18n = inject(I18nService);
}
