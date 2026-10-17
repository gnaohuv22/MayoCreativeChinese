import { describe, expect, it } from 'vitest';
import { deviceId, deviceLabel } from './device-id';

describe('deviceLabel', () => {
  it('names common browsers and systems', () => {
    expect(deviceLabel('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36')).toBe('Chrome · Windows');
    expect(deviceLabel('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36 Edg/141.0')).toBe('Edge · Windows');
    expect(deviceLabel('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')).toBe('Safari · iPhone');
    expect(deviceLabel('Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36')).toBe('Chrome · Android');
  });
});

describe('deviceId', () => {
  it('keeps one id per browser', () => {
    const id = deviceId();
    expect(id).toMatch(/^[A-Za-z0-9-]{16,64}$/);
    expect(deviceId()).toBe(id);
  });
});
