import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppIconComponent, IconName } from '../icon/app-icon';

export type StatCardColor = 'pink' | 'navy' | 'indigo' | 'emerald' | 'amber';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  icon = input<IconName>();
  color = input<StatCardColor>('pink');
  subtext = input<string>();

  valueColorClass(): string {
    switch (this.color()) {
      case 'pink':
        return 'text-brand-pink';
      case 'navy':
        return 'text-brand-navy dark:text-white';
      case 'indigo':
        return 'text-indigo-500 dark:text-indigo-400';
      case 'emerald':
        return 'text-emerald-500 dark:text-emerald-400';
      case 'amber':
        return 'text-amber-500 dark:text-amber-400';
      default:
        return 'text-brand-pink';
    }
  }

  iconBgClass(): string {
    switch (this.color()) {
      case 'pink':
        return 'bg-brand-pink/10 border border-brand-pink/20';
      case 'navy':
        return 'bg-brand-navy/10 dark:bg-white/10 border border-brand-navy/20 dark:border-white/10';
      case 'indigo':
        return 'bg-indigo-500/10 border border-indigo-500/20';
      case 'emerald':
        return 'bg-emerald-500/10 border border-emerald-500/20';
      case 'amber':
        return 'bg-amber-500/10 border border-amber-500/20';
      default:
        return 'bg-brand-pink/10 border border-brand-pink/20';
    }
  }

  iconColorClass(): string {
    switch (this.color()) {
      case 'pink':
        return 'text-brand-pink';
      case 'navy':
        return 'text-brand-navy dark:text-white';
      case 'indigo':
        return 'text-indigo-500 dark:text-indigo-400';
      case 'emerald':
        return 'text-emerald-500 dark:text-emerald-400';
      case 'amber':
        return 'text-amber-500 dark:text-amber-400';
      default:
        return 'text-brand-pink';
    }
  }
}
