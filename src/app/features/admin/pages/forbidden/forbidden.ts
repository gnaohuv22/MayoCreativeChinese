import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';

/** /khong-co-quyen — tài khoản học viên mở khu quản trị */
@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, NavHeaderComponent, AppIconComponent],
  templateUrl: './forbidden.html',
  styleUrl: './forbidden.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenComponent {}
