import { Component, ChangeDetectionStrategy, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExamService } from '../../services/exam.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';

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

  isUploading = signal<boolean>(false);
  uploadError = signal<string | null>(null);
  directUrl = signal<string>('');

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isUploading.set(true);
    this.uploadError.set(null);

    const res = await this.examService.uploadAsset(file, 'images');
    this.isUploading.set(false);

    if (res.error || !res.url) {
      this.uploadError.set(res.error || 'Tải ảnh thất bại');
    } else {
      this.imageUrlChange.emit(res.url);
    }

    input.value = '';
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
