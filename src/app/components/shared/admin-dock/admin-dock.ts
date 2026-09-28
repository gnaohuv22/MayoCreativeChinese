import { Component, ChangeDetectionStrategy, ElementRef, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { AppIconComponent, type IconName } from '../icon/app-icon';

interface DockAction {
  label: string;
  route: string;
  icon: IconName;
  highlight?: boolean;
}

/** Nút "con dấu 管" nổi góc phải dưới — lối vào khu quản trị, chỉ hiện khi đã đăng nhập */
@Component({
  selector: 'app-admin-dock',
  standalone: true,
  imports: [RouterLink, AppIconComponent],
  templateUrl: './admin-dock.html',
  styleUrl: './admin-dock.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'open.set(false)',
  },
})
export class AdminDockComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly open = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly visible = computed(() => this.auth.isStaff() && !this.url().startsWith('/admin'));
  /** Trang khoá học có thanh "Đăng ký" cố định ở đáy màn hình */
  readonly raised = computed(() => this.url().startsWith('/khoa-hoc/'));

  readonly actions = computed<DockAction[]>(() => {
    const list: DockAction[] = [];
    const examId = this.url().match(/^\/exams\/([0-9a-f-]{36})\//)?.[1];
    if (examId) list.push({ label: 'Sửa đề này', route: `/admin/exams/${examId}/edit`, icon: 'pencil', highlight: true });
    list.push(
      { label: 'Quản lý đề thi', route: '/admin/exams', icon: 'academic' },
      { label: 'Quản lý từ vựng', route: '/admin/vocab', icon: 'book-open' },
    );
    return list;
  });

  constructor() {
    effect(() => {
      this.url();
      this.open.set(false);
    });
  }

  onDocumentClick(event: MouseEvent) {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  async signOut() {
    this.open.set(false);
    await this.auth.signOut();
  }
}
