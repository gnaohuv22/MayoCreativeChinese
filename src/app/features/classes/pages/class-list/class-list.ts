import { Component, ChangeDetectionStrategy, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { ClassService } from '../../services/class.service';
import { ClassFormComponent } from '../../components/class-form/class-form';
import { CLASS_STATUS_LABELS, type ClassStatus, type SchoolClass, type StaffDirectoryEntry } from '../../models/class.model';
import { classStatusClass, formatDate, staffNames } from '../../utils/class-display.util';

/** /admin/classes — admin thấy mọi lớp, nhân sự thấy lớp mình phụ trách (RLS) */
@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [FormsModule, RouterLink, AppIconComponent, ClassFormComponent],
  templateUrl: './class-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassListComponent {
  protected readonly auth = inject(AuthService);
  private readonly classService = inject(ClassService);
  private readonly router = inject(Router);
  private readonly formDialog = viewChild.required<ElementRef<HTMLDialogElement>>('formDialog');

  protected readonly statusLabels = CLASS_STATUS_LABELS;
  protected readonly statusClass = classStatusClass;
  protected readonly formatDate = formatDate;

  readonly classes = signal<SchoolClass[]>([]);
  readonly directory = signal<StaffDirectoryEntry[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly showArchived = signal(false);
  readonly statusFilter = signal<ClassStatus | 'all'>('all');
  readonly search = signal('');
  readonly formOpen = signal(false);

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.classes().filter(c =>
      !!c.archived_at === this.showArchived()
      && (this.statusFilter() === 'all' || c.status === this.statusFilter())
      && (!q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
          || staffNames(c, this.directory()).toLowerCase().includes(q)));
  });
  readonly archivedCount = computed(() => this.classes().filter(c => c.archived_at).length);
  readonly openCount = computed(() => this.classes().length - this.archivedCount());

  constructor() {
    this.load();
  }

  async load() {
    this.loading.set(true);
    const [res, directory] = await Promise.all([this.classService.listClasses(), this.classService.staffDirectory()]);
    this.classes.set(res.data);
    this.directory.set(directory);
    this.loadError.set(res.error ?? null);
    this.loading.set(false);
  }

  teachers(c: SchoolClass): string {
    return staffNames(c, this.directory());
  }

  openCreate() {
    this.formOpen.set(true);
    this.formDialog().nativeElement.showModal();
  }

  closeForm() {
    this.formDialog().nativeElement.close();
  }

  onSaved(id: string) {
    this.closeForm();
    this.router.navigate(['/admin/classes', id]);
  }
}
