import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Title, Meta } from '@angular/platform-browser';
import { PageTitleStrategy } from './page-title.strategy';
import { RouterStateSnapshot } from '@angular/router';

describe('PageTitleStrategy', () => {
  let strategy: PageTitleStrategy;
  let titleService: Title;
  let metaService: Meta;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PageTitleStrategy, Title, Meta],
    });
    strategy = TestBed.inject(PageTitleStrategy);
    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
  });

  function createMockSnapshot(url: string, title?: string, data?: Record<string, any>): RouterStateSnapshot {
    const childNode = {
      title,
      routeConfig: title ? { title } : null,
      data: data || {},
      outlet: 'primary',
      children: [],
      firstChild: null,
    } as any;

    const rootNode = {
      data: data || {},
      children: [childNode],
      firstChild: childNode,
    } as any;

    return {
      url,
      root: rootNode,
    } as RouterStateSnapshot;
  }

  it('updates title, og:title, and twitter:title when route has a title', () => {
    const snapshot = createMockSnapshot('/flashcards');
    vi.spyOn(strategy, 'buildTitle').mockReturnValue('Flashcard');
    strategy.updateTitle(snapshot);

    expect(titleService.getTitle()).toBe('Flashcard | Mayo Creative Chinese');
    expect(metaService.getTag('property="og:title"')?.content).toBe('Flashcard | Mayo Creative Chinese');
    expect(metaService.getTag('property="twitter:title"')?.content).toBe('Flashcard | Mayo Creative Chinese');
  });

  it('sets robots noindex on 404 route and removes it on normal route', () => {
    const notFoundSnapshot = createMockSnapshot('/not-found');
    vi.spyOn(strategy, 'buildTitle').mockReturnValue('Không tìm thấy trang');
    strategy.updateTitle(notFoundSnapshot);

    expect(metaService.getTag('name="robots"')?.content).toBe('noindex, nofollow');

    const homeSnapshot = createMockSnapshot('/');
    vi.spyOn(strategy, 'buildTitle').mockReturnValue(undefined);
    strategy.updateTitle(homeSnapshot);

    expect(metaService.getTag('name="robots"')).toBeNull();
  });

  it('updates og:url to full path', () => {
    const snapshot = createMockSnapshot('/exams');
    vi.spyOn(strategy, 'buildTitle').mockReturnValue('Đề thi HSK');
    strategy.updateTitle(snapshot);

    expect(metaService.getTag('property="og:url"')?.content).toContain('/exams');
  });

  it('sets the canonical link to www without query or hash', () => {
    strategy.updateTitle(createMockSnapshot('/khoa-hoc/hsk-3-0?doi-tuong=nguoi-lon#lich', 'HSK 3.0'));
    const link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(link?.href).toBe('https://www.mayochinese.com/khoa-hoc/hsk-3-0');
    expect(metaService.getTag('property="og:url"')?.content).toBe('https://www.mayochinese.com/khoa-hoc/hsk-3-0');
  });
});
