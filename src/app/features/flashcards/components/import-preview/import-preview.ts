import { Component, computed, input, output, signal, effect } from '@angular/core';
import { ValidatedImportRow } from '../../models/vocab-card.model';

@Component({
  selector: 'app-import-preview',
  standalone: true,
  templateUrl: './import-preview.html',
  styleUrl: './import-preview.css',
})
export class ImportPreviewComponent {
  rows = input.required<ValidatedImportRow[]>();
  confirm = output<ValidatedImportRow[]>();
  cancel = output<void>();

  selectedIndices = signal<Set<number>>(new Set());

  constructor() {
    effect(() => {
      const allRows = this.rows();
      const selected = new Set<number>();
      allRows.forEach((row, i) => {
        if (row.status !== 'error') {
          selected.add(i);
        }
      });
      this.selectedIndices.set(selected);
    }, { allowSignalWrites: true });
  }

  validCount = computed(() => this.rows().filter(r => r.status === 'valid').length);
  duplicateCount = computed(() => this.rows().filter(r => r.status === 'duplicate').length);
  errorCount = computed(() => this.rows().filter(r => r.status === 'error').length);
  selectedCount = computed(() => this.selectedIndices().size);

  toggleRow(index: number, row: ValidatedImportRow): void {
    if (row.status === 'error') return;
    const selected = new Set(this.selectedIndices());
    if (selected.has(index)) {
      selected.delete(index);
    } else {
      selected.add(index);
    }
    this.selectedIndices.set(selected);
  }

  selectAll(): void {
    const selected = new Set<number>();
    this.rows().forEach((row, index) => {
      if (row.status !== 'error') {
        selected.add(index);
      }
    });
    this.selectedIndices.set(selected);
  }

  deselectAll(): void {
    this.selectedIndices.set(new Set());
  }

  onConfirm(): void {
    const selectedRows = this.rows().filter((_, index) => this.selectedIndices().has(index));
    this.confirm.emit(selectedRows);
  }
}
