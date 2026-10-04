import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [I18nService],
    });
    service = TestBed.inject(I18nService);
    httpMock = TestBed.inject(HttpTestingController);

    // Flush initial vi.json request
    const req = httpMock.expectOne('i18n/vi.json');
    req.flush({ 'nav.courses': 'Khóa học' });
  });

  it('defaults to vi when no language stored', () => {
    expect(service.currentLang()).toBe('vi');
  });

  it('persists selected language to localStorage on setLang', () => {
    service.setLang('zh');
    expect(service.currentLang()).toBe('zh');
    expect(localStorage.getItem('mcc_lang')).toBe('zh');

    const zhReq = httpMock.expectOne('i18n/zh.json');
    zhReq.flush({ 'nav.courses': '课程' });
    expect(service.translate()('nav.courses')).toBe('课程');
  });
});
