import { describe, expect, it, vi } from 'vitest';
import { RequestCache } from './request-cache';

describe('RequestCache', () => {
  it('shares one load per key while fresh', async () => {
    const cache = new RequestCache(60_000);
    const load = vi.fn(async () => 42);
    expect(await Promise.all([cache.get('a', load), cache.get('a', load)])).toEqual([42, 42]);
    expect(await cache.get('a', load)).toBe(42);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('reloads after the TTL and after clear()', async () => {
    vi.useFakeTimers();
    const cache = new RequestCache(1000);
    const load = vi.fn(async () => 1);
    await cache.get('a', load);
    vi.advanceTimersByTime(1001);
    await cache.get('a', load);
    cache.clear();
    await cache.get('a', load);
    expect(load).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });

  it('does not keep rejected or unwanted results', async () => {
    const cache = new RequestCache(60_000);
    const failing = vi.fn(async () => { throw new Error('x'); });
    await expect(cache.get('a', failing)).rejects.toThrow('x');
    const partial = vi.fn(async () => ({ ok: false }));
    await cache.get('b', partial, r => r.ok);
    await cache.get('b', partial, r => r.ok);
    expect(partial).toHaveBeenCalledTimes(2);
    expect(await cache.get('a', async () => 'fresh')).toBe('fresh');
  });
});
