import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { VocabService, levelVisibility } from '../../services/vocab.service';
import { ToastService } from '../../../../services/toast.service';
import { VisibilityPickerComponent } from '../../../../components/shared/visibility/visibility-picker';
import { VISIBILITY_LABELS, type ContentVisibility } from '../../../../components/shared/visibility/content-visibility';
import { VOCAB_COLLECTIONS, VOCAB_COLLECTION_KEYS, parseLevelParam } from '../../models/vocab-card.model';
import type { VocabCollection } from '../../models/vocab-card.model';
import { scopeLevelLabel } from '../../utils/vocab-scope.util';

interface LevelRow {
  param: string;
  label: string;
  count: number;
  visibility: ContentVisibility;
}

interface CollectionRows {
  key: VocabCollection;
  title: string;
  levels: LevelRow[];
}

/** Bảng trạng thái hiển thị từng cấp của 4 bộ từ vựng (trang quản lý từ vựng) */
@Component({
  selector: 'app-vocab-visibility',
  standalone: true,
  imports: [VisibilityPickerComponent],
  templateUrl: './vocab-visibility.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VocabVisibilityComponent implements OnInit {
  private readonly vocabService = inject(VocabService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly collections = signal<CollectionRows[]>([]);
  /** `${collection}|${param}` đang lưu */
  readonly saving = signal<string | null>(null);

  async ngOnInit() {
    const [map, ...counts] = await Promise.all([
      this.vocabService.getVisibility(),
      ...VOCAB_COLLECTION_KEYS.map(key => this.vocabService.getLevelCounts(key)),
    ]);
    this.collections.set(VOCAB_COLLECTION_KEYS.map((key, i) => ({
      key,
      title: VOCAB_COLLECTIONS[key].title,
      levels: VOCAB_COLLECTIONS[key].levelParams.map(param => ({
        param,
        label: scopeLevelLabel({ collection: key, levelParam: param }),
        count: parseLevelParam(param).reduce((sum, l) => sum + (counts[i].get(l) ?? 0), 0),
        visibility: levelVisibility(map, key, param),
      })),
    })));
    this.loading.set(false);
  }

  async setVisibility(collection: VocabCollection, row: LevelRow, visibility: ContentVisibility) {
    const key = `${collection}|${row.param}`;
    if (this.saving()) return;
    this.saving.set(key);
    const res = await this.vocabService.setVisibility(collection, parseLevelParam(row.param), visibility);
    this.saving.set(null);
    if (res.error) {
      this.toast.error(`Không đổi được trạng thái: ${res.error}`);
      return;
    }
    this.collections.update(list => list.map(c => c.key !== collection ? c : {
      ...c,
      levels: c.levels.map(l => l.param === row.param ? { ...l, visibility } : l),
    }));
    this.toast.success(`${VOCAB_COLLECTIONS[collection].shortLabel} · ${row.label}: ${VISIBILITY_LABELS[visibility]}`);
  }
}
