import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

const SITE_NAME = 'Mayo Creative Chinese';
const BASE_URL = 'https://mayo-creative-chinese.vercel.app';
const DEFAULT_OG_TITLE = 'Mayo Creative Chinese - Tiên phong Tiếng Trung Ứng Dụng';
const DEFAULT_DESC = 'Mayo Creative Chinese (MCC) - Trung tâm đào tạo Tiếng Trung ứng dụng thực tiễn & chuẩn hóa HSK hàng đầu tại Hà Nội. Phương pháp học thông minh và sáng tạo.';

/** Tiêu đề tab & thẻ meta SEO/OpenGraph theo từng route; tự thêm noindex cho trang 404 */
@Injectable()
export class PageTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly defaultTitle = this.title.getTitle();

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    const fullTitle = pageTitle ? `${pageTitle} | ${SITE_NAME}` : this.defaultTitle;
    this.title.setTitle(fullTitle);

    let r = snapshot.root;
    while (r.firstChild) r = r.firstChild;
    const data = r.data || {};

    let desc = (data['description'] as string) || '';
    if (!desc) {
      if (pageTitle === 'Không tìm thấy trang' || snapshot.url === '/not-found') {
        desc = 'Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển đi. Vui lòng quay lại trang chủ.';
      } else if (snapshot.url.startsWith('/flashcards')) {
        desc = 'Học từ vựng tiếng Trung qua flashcard tương tác, phân chia theo cấp độ HSK 2.0, HSK 3.0 và bài học thực tế tại Mayo Creative Chinese.';
      } else if (snapshot.url.startsWith('/exams')) {
        desc = 'Ngân hàng đề thi thử HSK trực tuyến chuẩn hóa với hệ thống chấm điểm tự động và lời giải chi tiết tại Mayo Creative Chinese.';
      } else if (snapshot.url.startsWith('/admin')) {
        desc = 'Trang quản trị hệ thống Mayo Creative Chinese.';
      } else if (pageTitle) {
        desc = `${pageTitle} - Trung tâm đào tạo Tiếng Trung ứng dụng thực tiễn & chuẩn hóa HSK Mayo Creative Chinese.`;
      } else {
        desc = DEFAULT_DESC;
      }
    }

    const ogTitle = pageTitle ? `${pageTitle} | ${SITE_NAME}` : DEFAULT_OG_TITLE;
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}${snapshot.url}`
      : `${BASE_URL}${snapshot.url}`;

    this.meta.updateTag({ name: 'description', content: desc });
    this.meta.updateTag({ property: 'og:title', content: ogTitle });
    this.meta.updateTag({ property: 'og:description', content: desc });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'twitter:title', content: ogTitle });
    this.meta.updateTag({ property: 'twitter:description', content: desc });

    const is404 = pageTitle === 'Không tìm thấy trang' || snapshot.url === '/not-found' || data['robots'] === 'noindex, nofollow';
    if (is404) {
      this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    } else {
      this.meta.removeTag("name='robots'");
    }
  }
}
