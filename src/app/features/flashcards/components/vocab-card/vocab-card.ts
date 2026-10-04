import { Component, computed, input, output } from '@angular/core';
import { SpeakButtonComponent } from '../speak-button/speak-button';
import { VocabExamplesComponent } from '../vocab-examples/vocab-examples';
import { splitExamples } from '../../models/vocab-card.model';
import { vocabCardLevelLabel } from '../../utils/vocab-scope.util';
import type { VocabCard, CardProgress } from '../../models/vocab-card.model';

@Component({
  selector: 'app-vocab-card',
  standalone: true,
  imports: [SpeakButtonComponent, VocabExamplesComponent],
  templateUrl: './vocab-card.html',
  styleUrl: './vocab-card.css'
})
export class VocabCardComponent {
  card = input.required<VocabCard>();
  progress = input<CardProgress | null>(null);
  flipped = input<boolean>(false);
  levelLabel = input<string>();
  flipChange = output<void>();
  bookmarkChange = output<void>();

  hasExamples = computed(() => splitExamples(this.card()).length > 0);
  cardLevel = computed(() => this.levelLabel() || vocabCardLevelLabel(this.card()));
}
