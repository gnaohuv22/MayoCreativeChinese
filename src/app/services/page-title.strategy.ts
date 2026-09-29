import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

const SITE_NAME = 'Mayo Creative Chinese';

/** Tiêu đề tab theo `title` của route; route không khai báo thì về lại tiêu đề trang chủ. */
@Injectable()
export class PageTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly defaultTitle = this.title.getTitle();

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    this.title.setTitle(pageTitle ? `${pageTitle} | ${SITE_NAME}` : this.defaultTitle);
  }
}
