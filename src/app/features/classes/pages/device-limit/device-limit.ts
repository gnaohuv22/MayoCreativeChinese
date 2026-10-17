import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, type LearnerDevice } from '../../../../services/auth.service';
import { NavHeaderComponent } from '../../../../components/shared/nav-header/nav-header';
import { UNLOCK_CONTACT_URL } from '../../../../components/shared/visibility/content-visibility';
import { DeviceListComponent } from '../../components/device-list/device-list';
import { formatDate } from '../../utils/class-display.util';

/** /thiet-bi — tài khoản đã dùng đủ 3 thiết bị: gỡ 1 thiết bị cũ để học trên thiết bị này */
@Component({
  selector: 'app-device-limit',
  standalone: true,
  imports: [NavHeaderComponent, DeviceListComponent],
  templateUrl: './device-limit.html',
  styleUrl: './device-limit.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceLimitComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly contactUrl = UNLOCK_CONTACT_URL;
  protected readonly formatDate = formatDate;
  readonly removing = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly list = computed(() => this.auth.deviceBlocked());

  constructor() {
    // Mở thẳng trang này khi không bị chặn → về trang học viên
    this.auth.ready.then(() => {
      if (!this.auth.deviceBlocked()) this.continue();
    });
  }

  async remove(device: LearnerDevice) {
    this.removing.set(device.device_id);
    this.error.set(null);
    const res = await this.auth.removeMyDevice(device.device_id);
    if (res.error) {
      this.removing.set(null);
      this.error.set(res.error);
      return;
    }
    const ok = await this.auth.registerDevice();
    this.removing.set(null);
    if (ok) this.continue();
  }

  async signOut() {
    await this.auth.signOut();
    this.router.navigate(['/dang-nhap']);
  }

  private continue() {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.router.navigateByUrl(returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('/thiet-bi') ? returnUrl : '/hoc-vien');
  }
}
