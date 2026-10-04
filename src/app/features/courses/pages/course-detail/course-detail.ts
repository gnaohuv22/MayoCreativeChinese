import { Component, ChangeDetectionStrategy, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { map } from 'rxjs';
import { HeaderComponent } from '../../../../components/header/header';
import { FooterComponent } from '../../../../components/footer/footer';
import { RegisterModalComponent } from '../../../../components/shared/register-modal/register-modal';
import { ScrollToTopComponent } from '../../../../components/shared/scroll-to-top/scroll-to-top';
import { AppIconComponent, type IconName } from '../../../../components/shared/icon/app-icon';
import { RegisterModalService } from '../../../../services/register-modal.service';
import { CourseBlocksComponent } from '../../components/course-blocks/course-blocks';
import { COURSE_DETAILS } from '../../data/course-details.data';
import { CLASS_MOMENTS, STUDENT_STORIES } from '../../../posts/data/student-stories.data';
import type { CourseInfoRow } from '../../models/course-detail.model';

/** Query param chọn đối tượng trên trang có tab (VD: /khoa-hoc/tieng-trung-tre-em?doi-tuong=nguoi-lon) */
export const AUDIENCE_PARAM = 'doi-tuong';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [
    RouterLink,
    HeaderComponent,
    FooterComponent,
    RegisterModalComponent,
    ScrollToTopComponent,
    AppIconComponent,
    CourseBlocksComponent,
  ],
  templateUrl: './course-detail.html',
  styleUrl: './course-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly registerModal = inject(RegisterModalService);

  private readonly slug = toSignal(this.route.paramMap.pipe(map(p => p.get('slug') ?? '')), { initialValue: '' });
  private readonly audienceParam = toSignal(
    this.route.queryParamMap.pipe(map(q => q.get(AUDIENCE_PARAM))),
    { initialValue: null }
  );

  readonly course = computed(() => COURSE_DETAILS.find(c => c.slug === this.slug()) ?? null);

  /** Chặng đang chọn (khóa có nhiều lựa chọn) */
  readonly trackIndex = signal(0);
  readonly track = computed(() => this.course()?.tracks?.[this.trackIndex()] ?? null);

  /** Đối tượng đang chọn trên tab (Trẻ em / Người lớn) */
  readonly audienceIndex = signal(0);

  readonly subtitle = computed(() => {
    const c = this.course();
    if (!c) return '';
    return c.goal || c.lead.find(l => l.label === 'Thông điệp')?.text || '';
  });

  /** Dòng giới thiệu phụ (trừ dòng đã dùng làm tiêu đề phụ) */
  readonly leadLines = computed(() => {
    const c = this.course();
    if (!c) return [];
    return c.goal ? c.lead : c.lead.filter(l => l.label !== 'Thông điệp');
  });

  readonly blocks = computed(() => this.track()?.blocks ?? this.course()?.blocks ?? []);
  readonly info = computed<CourseInfoRow[]>(() => this.track()?.info ?? this.course()?.info ?? []);

  /** Tên khóa ghi vào form đăng ký */
  readonly courseLabel = computed(() => {
    const c = this.course();
    if (!c) return '';
    const parts = [c.name];
    const t = this.track();
    if (t) parts.push(t.title);
    const audience = c.audiences?.[this.audienceIndex()];
    if (audience) parts.push(audience.replace(/\s*\(.*\)$/, ''));
    return parts.join(' – ');
  });

  readonly moments = CLASS_MOMENTS;
  readonly stories = STUDENT_STORIES.slice(0, 3);

  constructor() {
    // Trả lại tiêu đề trang chủ khi rời trang
    const originalTitle = this.title.getTitle();
    inject(DestroyRef).onDestroy(() => this.title.setTitle(originalTitle));

    effect(() => {
      const c = this.course();
      if (!c && this.slug()) {
        // Khóa không tồn tại → quay về danh sách khóa học trên trang chủ
        this.router.navigateByUrl('/#courses');
        return;
      }
      if (c) {
        const fullTitle = `${c.name} | Mayo Creative Chinese`;
        const desc = c.goal || c.lead?.[0]?.text || 'Khóa học tiếng Trung tại Mayo Creative Chinese';
        const url = typeof window !== 'undefined'
          ? window.location.href
          : `https://mayo-creative-chinese.vercel.app/khoa-hoc/${c.slug}`;

        this.title.setTitle(fullTitle);
        this.meta.updateTag({ name: 'description', content: desc });
        this.meta.updateTag({ property: 'og:title', content: fullTitle });
        this.meta.updateTag({ property: 'og:description', content: desc });
        this.meta.updateTag({ property: 'og:url', content: url });
        this.meta.updateTag({ property: 'twitter:title', content: fullTitle });
        this.meta.updateTag({ property: 'twitter:description', content: desc });
      }
    });

    effect(() => {
      // Tab đối tượng lấy từ query param (thẻ "Giao tiếp" trên trang chủ trỏ sang tab Người lớn)
      const c = this.course();
      const param = this.audienceParam();
      if (!c?.audiences || !param) return;
      const idx = c.audiences.findIndex(a => slugify(a).startsWith(param));
      if (idx >= 0) this.audienceIndex.set(idx);
    });
  }

  selectTrack(index: number): void {
    this.trackIndex.set(index);
  }

  selectAudience(index: number): void {
    this.audienceIndex.set(index);
  }

  register(trial = false): void {
    this.registerModal.open({ course: this.courseLabel(), trial });
  }

  infoIcon(label: string): IconName {
    const l = label.toLowerCase();
    if (l.includes('thời lượng')) return 'clock';
    if (l.includes('tần suất')) return 'calendar';
    if (l.includes('sĩ số')) return 'users';
    if (l.includes('cam kết')) return 'check-circle';
    if (l.includes('giáo trình')) return 'book-open';
    if (l.includes('học phí')) return 'document-text';
    return 'academic';
  }

  isCommitment(row: CourseInfoRow): boolean {
    return row.label.toLowerCase().includes('cam kết');
  }
}

/** 'Người lớn (người đi làm, sinh viên)' → 'nguoi-lon-nguoi-di-lam-sinh-vien' */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
