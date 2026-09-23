import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { ExamQuestion, QuestionType } from '../../models/exam.model';
import { AudioUploaderComponent } from '../audio-uploader/audio-uploader';
import { ImageUploaderComponent } from '../image-uploader/image-uploader';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';

@Component({
  selector: 'app-question-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, AudioUploaderComponent, ImageUploaderComponent, AppIconComponent],
  templateUrl: './question-editor.html',
  styleUrl: './question-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionEditorComponent {
  question = input.required<ExamQuestion>();
  questionType = input.required<QuestionType>();
  remove = output<void>();

  onAudioChange(url: string | null) {
    this.question().audio_url = url || undefined;
  }

  onImageChange(url: string | null) {
    this.question().image_url = url || undefined;
  }

  setCorrectOption(label: string) {
    this.question().correct_answer = label;
  }

  addOption() {
    if (!this.question().options) {
      this.question().options = [];
    }
    const currentLen = this.question().options!.length;
    const nextLabel = String.fromCharCode(65 + currentLen);
    this.question().options!.push({
      label: nextLabel,
      content: '',
      sort_order: currentLen + 1,
    });
  }

  removeOption(index: number) {
    if (this.question().options && this.question().options!.length > 2) {
      this.question().options!.splice(index, 1);
      this.question().options!.forEach((opt, idx) => {
        opt.label = String.fromCharCode(65 + idx);
        opt.sort_order = idx + 1;
      });
    }
  }

  getAnswerPlaceholder(): string {
    switch (this.questionType()) {
      case 'fill_blank':
        return 'Nhập từ cần điền (VD: 学, 近, 漂亮的...)';
      case 'ordering':
        return 'Nhập thứ tự đúng (VD: ①④②③ hoặc ②①③④)';
      case 'short_answer':
        return 'Nhập chữ Hán đúng (VD: 天, 喝, 医院...)';
      case 'matching':
        return 'Nhập cặp nối (VD: 1-C, 2-A, 3-B)';
      default:
        return 'Nhập đáp án chuẩn...';
    }
  }
}
