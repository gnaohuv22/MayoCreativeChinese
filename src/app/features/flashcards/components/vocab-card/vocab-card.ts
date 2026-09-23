import { Component, input, output } from '@angular/core';
import { VocabCard, CardProgress } from '../../models/vocab-card.model';

@Component({
  selector: 'app-vocab-card',
  standalone: true,
  templateUrl: './vocab-card.html',
  styleUrl: './vocab-card.css'
})
export class VocabCardComponent {
  card = input.required<VocabCard>();
  progress = input<CardProgress | null>(null);
  flipped = input<boolean>(false);
  flipChange = output<void>();
  bookmarkChange = output<void>();
}
