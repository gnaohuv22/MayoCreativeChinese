/** Mã thiết bị ngẫu nhiên của trình duyệt này (giới hạn 3 thiết bị, migration 026) — không dò vân tay trình duyệt */
const STORAGE_KEY = 'mcc.deviceId';
let cached: string | null = null;

export function deviceId(): string {
  if (cached) return cached;
  try {
    cached = localStorage.getItem(STORAGE_KEY);
    if (!cached || !/^[A-Za-z0-9-]{16,64}$/.test(cached)) {
      cached = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, cached);
    }
  } catch {
    // Trình duyệt chặn localStorage: mã chỉ sống trong tab này
    cached ??= crypto.randomUUID();
  }
  return cached;
}

/** Tên dễ nhận ra cho danh sách thiết bị, vd "Chrome · Windows" */
export function deviceLabel(ua = navigator.userAgent): string {
  const browser =
    /Edg\//.test(ua) ? 'Edge'
    : /coc_coc_browser|CocCoc/i.test(ua) ? 'Cốc Cốc'
    : /OPR\/|Opera/.test(ua) ? 'Opera'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Chrome\//.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari'
    : 'Trình duyệt';
  const os =
    /iPhone/.test(ua) ? 'iPhone'
    : /iPad/.test(ua) ? 'iPad'
    : /Android/.test(ua) ? 'Android'
    : /Windows/.test(ua) ? 'Windows'
    : /Mac OS X|Macintosh/.test(ua) ? 'macOS'
    : /Linux/.test(ua) ? 'Linux'
    : '';
  return os ? `${browser} · ${os}` : browser;
}
