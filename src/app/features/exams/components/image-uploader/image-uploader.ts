import { Component, ChangeDetectionStrategy, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExamService } from '../../services/exam.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';

/** Lấy file ảnh từ sự kiện dán (Ctrl+V); null nếu clipboard không chứa ảnh */
export function imageFileFromClipboard(event: ClipboardEvent): File | null {
  const item = Array.from(event.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'));
  const blob = item?.getAsFile();
  if (!blob) return null;
  const ext = blob.type.split('/')[1] || 'png';
  return new File([blob], `pasted.${ext}`, { type: blob.type });
}

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  templateUrl: './image-uploader.html',
  styleUrl: './image-uploader.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploaderComponent {
  private readonly examService = inject(ExamService);

  imageUrl = input<string | null>(null);
  imageUrlChange = output<string | null>();
  /** Giao diện thu gọn (1 nút + ảnh nhỏ) — dùng cho từng phương án trắc nghiệm */
  compact = input<boolean>(false);

  isUploading = signal<boolean>(false);
  uploadError = signal<string | null>(null);
  directUrl = signal<string>('');

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    await this.uploadFile(input.files[0]);
    input.value = '';
  }

  /** Dán ảnh trực tiếp từ clipboard (VD: cắt ảnh từ đề PDF rồi Ctrl+V) */
  async onPaste(event: ClipboardEvent) {
    const file = imageFileFromClipboard(event);
    if (!file) return; // Không phải ảnh → để trình duyệt dán text (link) như bình thường

    event.preventDefault();
    await this.uploadFile(file);
  }

  async uploadFile(file: File) {
    this.isUploading.set(true);
    this.uploadError.set(null);

    const res = await this.examService.uploadAsset(file, 'images');
    this.isUploading.set(false);

    if (res.error || !res.url) {
      this.uploadError.set(res.error || 'Tải ảnh thất bại');
    } else {
      this.imageUrlChange.emit(res.url);
    }
  }

  onDirectUrlChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.directUrl.set(val);
  }

  applyDirectUrl() {
    const val = this.directUrl().trim();
    if (val) {
      this.imageUrlChange.emit(val);
      this.directUrl.set('');
    }
  }

  removeImage() {
    this.imageUrlChange.emit(null);
    this.uploadError.set(null);
  }
}
