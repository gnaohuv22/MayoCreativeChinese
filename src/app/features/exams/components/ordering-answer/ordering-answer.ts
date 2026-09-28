import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { AppIconComponent } from '../../../../components/shared/icon/app-icon';
import { orderingMarks, type OrderingToken } from '../../models/exam-ordering';

/**
 * Ghép câu cho dạng 'ordering': kéo thả từ vào dòng câu (hoặc chạm để thêm / bỏ).
 * Giá trị vào / ra là chuỗi số khoanh tròn theo thứ tự câu ("①④②③"), giống đáp án lưu trong đề.
 */
@Component({
  selector: 'app-ordering-answer',
  standalone: true,
  imports: [CdkDropList, CdkDrag, CdkDragPlaceholder, AppIconComponent],
  templateUrl: './ordering-answer.html',
  styleUrl: './ordering-answer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderingAnswerComponent {
  tokens = input.required<OrderingToken[]>();
  value = input<string>('');
  valueChange = output<string>();

  /** Từ đã xếp vào câu, theo thứ tự */
  placed = computed(() => {
    const byMark = new Map(this.tokens().map((t) => [t.mark, t]));
    const seen = new Set<string>();
    return orderingMarks(this.value())
      .filter((m) => byMark.has(m) && !seen.has(m) && seen.add(m))
      .map((m) => byMark.get(m)!);
  });

  /** Từ còn lại, giữ thứ tự của đề */
  bank = computed(() => {
    const used = new Set(this.placed().map((t) => t.mark));
    return this.tokens().filter((t) => !used.has(t.mark));
  });

  add(token: OrderingToken) {
    this.emit([...this.placed(), token]);
  }

  remove(token: OrderingToken) {
    this.emit(this.placed().filter((t) => t.mark !== token.mark));
  }

  reset() {
    this.emit([]);
  }

  /** Thả vào dòng câu: chèn / đổi chỗ tại vị trí thả */
  dropOnSentence(event: CdkDragDrop<OrderingToken[]>) {
    const next = [...this.placed()];
    const sameList = event.previousContainer === event.container;
    // Chế độ 'mixed' của CDK trả index 0 khi thả vào khoảng trống sau từ cuối → coi là thêm vào cuối câu
    const index = this.isPastLastWord(event)
      ? next.length - (sameList ? 1 : 0)
      : event.currentIndex;
    if (sameList) {
      moveItemInArray(next, event.previousIndex, index);
    } else {
      next.splice(index, 0, event.item.data);
    }
    this.emit(next);
  }

  /** Thả về kho từ: bỏ khỏi câu */
  dropOnBank(event: CdkDragDrop<OrderingToken[]>) {
    if (event.previousContainer !== event.container) this.remove(event.item.data);
  }

  private isPastLastWord(event: CdkDragDrop<OrderingToken[]>): boolean {
    const others = event.container.getSortedItems().filter((item) => item !== event.item);
    const last = others.at(-1)?.getRootElement().getBoundingClientRect();
    if (!last) return false;
    const { x, y } = event.dropPoint;
    return y > last.bottom || (y >= last.top && x > last.right);
  }

  private emit(tokens: OrderingToken[]) {
    this.valueChange.emit(tokens.map((t) => t.mark).join(''));
  }
}
