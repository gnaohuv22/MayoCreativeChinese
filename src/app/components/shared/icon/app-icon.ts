import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type IconName =
  | 'academic'
  | 'audio'
  | 'image'
  | 'plus'
  | 'trash'
  | 'pencil'
  | 'check'
  | 'x-mark'
  | 'search'
  | 'clock'
  | 'question-mark'
  | 'trophy'
  | 'filter'
  | 'arrow-right'
  | 'arrow-left'
  | 'eye'
  | 'sparkles'
  | 'document-text'
  | 'document-plus'
  | 'arrow-path'
  | 'upload'
  | 'link'
  | 'scale'
  | 'arrows-right-left'
  | 'chat-bubble'
  | 'book-open'
  | 'play'
  | 'pause'
  | 'speaker-wave'
  | 'flag'
  | 'check-circle'
  | 'x-circle'
  | 'chevron-left'
  | 'chevron-right'
  | 'arrow-uturn-left'
  | 'sun'
  | 'moon'
  | 'cog';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-icon.html',
  styleUrl: './app-icon.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppIconComponent {
  name = input.required<IconName>();
  size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  customClass = input<string>('');

  svgClass = computed(() => {
    const sizeMap: Record<string, string> = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8',
    };
    const s = sizeMap[this.size()] || 'w-5 h-5';
    return `${s} ${this.customClass()}`.trim();
  });
}
