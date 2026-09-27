import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { SpeechService } from '../../services/speech.service';

/** Nút loa đọc to 1 từ / câu tiếng Trung. Tự ẩn khi thiết bị không có giọng đọc tiếng Trung. */
@Component({
  selector: 'app-speak-button',
  standalone: true,
  imports: [AppIconComponent],
  templateUrl: './speak-button.html',
  styleUrl: './speak-button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeakButtonComponent {
  private readonly speech = inject(SpeechService);

  readonly text = input.required<string | null | undefined>();
  readonly size = input<'xs' | 'sm' | 'md'>('sm');
  readonly label = input('Nghe phát âm');

  readonly available = this.speech.available;
  readonly active = computed(() => !!this.text() && this.speech.speaking() === this.text()!.trim());

  play(event: Event): void {
    // Không lật thẻ / không chọn dòng khi bấm loa
    event.stopPropagation();
    this.speech.speak(this.text());
  }
}
