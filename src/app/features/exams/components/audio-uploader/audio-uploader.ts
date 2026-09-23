import { Component, ChangeDetectionStrategy, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExamService } from '../../services/exam.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';

@Component({
  selector: 'app-audio-uploader',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  templateUrl: './audio-uploader.html',
  styleUrl: './audio-uploader.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AudioUploaderComponent {
  private readonly examService = inject(ExamService);

  audioUrl = input<string | null>(null);
  audioUrlChange = output<string | null>();

  isUploading = signal<boolean>(false);
  uploadError = signal<string | null>(null);
  directUrl = signal<string>('');

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isUploading.set(true);
    this.uploadError.set(null);

    const res = await this.examService.uploadAsset(file, 'audio');
    this.isUploading.set(false);

    if (res.error || !res.url) {
      this.uploadError.set(res.error || 'Tải file âm thanh thất bại');
    } else {
      this.audioUrlChange.emit(res.url);
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
      this.audioUrlChange.emit(val);
      this.directUrl.set('');
    }
  }

  removeAudio() {
    this.audioUrlChange.emit(null);
    this.uploadError.set(null);
  }
}
