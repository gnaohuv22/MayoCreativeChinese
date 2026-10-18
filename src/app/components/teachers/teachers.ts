import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { I18nService } from '../../services/i18n.service';
import { SiteContentService } from '../../features/landing/services/site-content.service';
import type { TeacherItem } from '../../features/landing/models/site-content.model';

@Component({
  selector: 'app-teachers',
  imports: [NgOptimizedImage],
  templateUrl: './teachers.html',
  styleUrl: './teachers.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeachersComponent {
  protected readonly i18n = inject(I18nService);
  private readonly site = inject(SiteContentService);

  readonly section = computed(() => this.site.content()?.teachers);
  readonly teachers = computed(() => this.section()?.items ?? []);

  readonly expandedTeacherId = signal<string | null>(null);

  /** Avatar mặc định khi chưa có ảnh: chữ cái đầu của tên (từ cuối) */
  initial(teacher: TeacherItem): string {
    const name = (teacher.name.vi ?? teacher.id).trim();
    return (name.split(/\s+/).pop() ?? '?').charAt(0).toUpperCase();
  }

  toggleBio(id: string): void {
    if (this.expandedTeacherId() === id) {
      this.expandedTeacherId.set(null);
    } else {
      this.expandedTeacherId.set(id);
    }
  }
}
