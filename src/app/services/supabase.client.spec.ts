import { afterEach, describe, expect, it, vi } from 'vitest';
import { SESSION_EXPIRED_MESSAGE, proxiedFetch, writeErrorMessage } from './supabase.client';

describe('writeErrorMessage', () => {
  it('turns RLS rejections into the session-expired message', () => {
    expect(writeErrorMessage({ code: '42501', message: 'new row violates row-level security policy for table "vocab_cards"' }))
      .toBe(SESSION_EXPIRED_MESSAGE);
    // Storage báo lỗi RLS không kèm mã Postgres
    expect(writeErrorMessage({ message: 'new row violates row-level security policy' })).toBe(SESSION_EXPIRED_MESSAGE);
  });

  it('keeps other errors as they are', () => {
    expect(writeErrorMessage({ code: '23505', message: 'duplicate key value' })).toBe('duplicate key value');
  });
});

describe('proxiedFetch', () => {
  const REST = 'https://animyjihwiyqsxvikxxg.supabase.co/rest/v1/exams?select=id';

  afterEach(() => vi.unstubAllGlobals());

  function stubFetch() {
    const calls: { input: RequestInfo | URL; init?: RequestInit }[] = [];
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ input, init });
      return new Response('[]');
    });
    return calls;
  }

  it('sends REST calls given as a URL string through the proxy', async () => {
    const calls = stubFetch();
    await proxiedFetch(REST, { headers: { apikey: 'k' } });
    expect(calls[0].input).toBe('/api/rest');
    const headers = new Headers(calls[0].init?.headers);
    expect(headers.get('x-rest-path')).toBe('/rest/v1/exams?select=id');
    expect(headers.get('apikey')).toBe('k');
  });

  it('sends REST calls given as a Request through the proxy, keeping method and body', async () => {
    const calls = stubFetch();
    await proxiedFetch(new Request(REST, { method: 'POST', body: '{"a":1}', headers: { apikey: 'k' } }));
    expect(calls[0].input).toBe('/api/rest');
    expect(calls[0].init?.method).toBe('POST');
    expect(new TextDecoder().decode(calls[0].init?.body as ArrayBuffer)).toBe('{"a":1}');
    expect(new Headers(calls[0].init?.headers).get('x-rest-path')).toBe('/rest/v1/exams?select=id');
  });

  it('leaves auth and storage calls alone', async () => {
    const calls = stubFetch();
    await proxiedFetch('https://animyjihwiyqsxvikxxg.supabase.co/auth/v1/token');
    expect(calls[0].input).toBe('https://animyjihwiyqsxvikxxg.supabase.co/auth/v1/token');
  });

  it('retries a 429 from the firewall, then returns the real response', async () => {
    vi.useFakeTimers();
    let calls = 0;
    vi.stubGlobal('fetch', async () => (++calls < 3 ? new Response('', { status: 429 }) : new Response('[]')));
    const pending = proxiedFetch(REST, { method: 'POST', body: '{"a":1}' });
    await vi.advanceTimersByTimeAsync(3000);
    expect((await pending).status).toBe(200);
    expect(calls).toBe(3);
    vi.useRealTimers();
  });

  it('gives up after the last retry and returns the 429', async () => {
    vi.useFakeTimers();
    let calls = 0;
    vi.stubGlobal('fetch', async () => {
      calls++;
      return new Response('', { status: 429, headers: { 'retry-after': '1' } });
    });
    const pending = proxiedFetch(REST);
    await vi.advanceTimersByTimeAsync(5000);
    expect((await pending).status).toBe(429);
    expect(calls).toBe(4);
    vi.useRealTimers();
  });
});
