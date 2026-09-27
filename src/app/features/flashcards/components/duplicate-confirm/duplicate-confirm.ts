import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import type { ExistingMeaning } from '../../models/vocab-card.model';

/** 1 từ sắp thêm có Hán tự trùng với từ đã có (khác pinyin / nghĩa) */
export interface DuplicateHanziItem {
  hanzi: string;
  pinyin: string;
  meaning: string;
  level: number;
  existing: ExistingMeaning[];
}

/**
 * Hộp thoại xác nhận khi thêm từ cùng Hán tự nhưng khác nghĩa với từ đã có trong hệ thống.
 * Liệt kê từng từ mới cùng các nghĩa đã có để người nhập kiểm tra trước khi thêm.
 */
@Component({
  selector: 'app-duplicate-confirm',
  standalone: true,
  imports: [AppIconComponent],
  templateUrl: './duplicate-confirm.html',
  styleUrl: './duplicate-confirm.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'cancel.emit()',
  },
})
export class DuplicateConfirmComponent {
  readonly items = input.required<DuplicateHanziItem[]>();
  /** Tên bộ, VD "HSK 2.0" */
  readonly collectionLabel = input.required<string>();
  /** Tổng số từ sắp thêm (import) — hiện nút "chỉ thêm các từ còn lại" khi > số từ trùng */
  readonly totalCount = input<number>(0);
  readonly busy = input(false);

  readonly confirmAll = output<void>();
  readonly skipDuplicates = output<void>();
  readonly cancel = output<void>();

  readonly otherCount = computed(() => Math.max(0, this.totalCount() - this.items().length));
}
