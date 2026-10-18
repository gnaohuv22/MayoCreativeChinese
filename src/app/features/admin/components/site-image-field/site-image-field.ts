import { Component, ChangeDetectionStrategy, inject, input, output, signal } from '@angular/core';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { SiteAdminService } from '../../services/site-admin.service';
import { imageFileFromClipboard } from '../../../exams/components/image-uploader/image-uploader';

/** Ảnh trên trang chủ: xem trước, đổi (chọn file / dán Ctrl+V), xoá */
@Component({
  selector: 'app-site-image-field',
  standalone: true,
  imports: [AppIconComponent],
  templateUrl: './site-image-field.html',
  styleUrl: './site-image-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteImageFieldComponent {
  private readonly siteAdmin = inject(SiteAdminService);

  readonly src = input('');
  readonly label = input('');
  /** Thư mục trong bucket site-media */
  readonly folder = input.required<string>();
  /** Lớp tỉ lệ khung xem trước, VD: aspect-[3/4] */
  readonly aspectClass = input('aspect-[4/3]');
  readonly removable = input(false);
  readonly srcChange = output<string>();

  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);

  async onFileSelected(event: Event): Promise<void> {
    const el = event.target as HTMLInputElement;
    const file = el.files?.[0];
    el.value = '';
    if (file) await this.upload(file);
  }

  async onPaste(event: ClipboardEvent): Promise<void> {
    const file = imageFileFromClipboard(event);
    if (!file) return;
    event.preventDefault();
    await this.upload(file);
  }

  private async upload(file: File): Promise<void> {
    this.uploading.set(true);
    this.error.set(null);
    try {
      const res = await this.siteAdmin.uploadImage(file, this.folder());
      if (res.url) this.srcChange.emit(res.url);
      else this.error.set(res.error ?? 'Tải ảnh thất bại');
    } catch {
      this.error.set('Tải ảnh thất bại, kiểm tra kết nối mạng rồi thử lại');
    } finally {
      this.uploading.set(false);
    }
  }
}
