import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpeakButtonComponent } from '../speak-button/speak-button';
import { splitExamples } from '../../models/vocab-card.model';
import type { VocabCard } from '../../models/vocab-card.model';

/** Danh sách câu ví dụ của 1 từ (nhiều ví dụ tách theo xuống dòng) */
@Component({
  selector: 'app-vocab-examples',
  standalone: true,
  imports: [SpeakButtonComponent],
  templateUrl: './vocab-examples.html',
  styleUrl: './vocab-examples.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VocabExamplesComponent {
  readonly card = input.required<Pick<VocabCard, 'example' | 'example_pinyin' | 'example_meaning'>>();
  /** compact = ô trong bảng; card = mặt sau flashcard */
  readonly variant = input<'compact' | 'card'>('compact');

  readonly examples = computed(() => splitExamples(this.card()));
}
