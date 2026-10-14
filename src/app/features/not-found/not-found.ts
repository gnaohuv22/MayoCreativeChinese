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
  templateUrl: './not-found.html',
  styleUrl: './not-found.css',
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
