import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../../../components/header/header';
import { FooterComponent } from '../../../../components/footer/footer';
import { RegisterModalComponent } from '../../../../components/shared/register-modal/register-modal';
import { COMPANY, LEGAL_DOCS, type LegalDocKey } from '../../legal.data';

/** /chinh-sach-bao-mat và /dieu-khoan-su-dung — chọn văn bản qua route data `doc` */
@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [RouterLink, HeaderComponent, FooterComponent, RegisterModalComponent],
  templateUrl: './legal-page.html',
  styleUrl: './legal-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly key: LegalDocKey = this.route.snapshot.data['doc'] === 'terms' ? 'terms' : 'privacy';
  readonly doc = LEGAL_DOCS[this.key];
  readonly company = COMPANY;
}
