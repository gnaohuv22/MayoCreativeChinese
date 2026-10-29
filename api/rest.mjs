import { canonicalRestPath } from '../server/rest-path.mjs';
/**
 * Proxy cho Supabase REST (/rest/v1/*) — trình duyệt gọi qua đây thay vì gọi thẳng supabase.co.
 * Vercel Firewall giới hạn số request / IP ở trước hàm này; hàm gắn header bí mật
 * để DB (migration 015) từ chối request anon không đi qua proxy.
 * Đường dẫn đích nằm trong header x-rest-path (xem src/app/services/supabase.client.ts).
 */
const SUPABASE_URL = 'https://animyjihwiyqsxvikxxg.supabase.co';

/** Tên miền chính (www) + tên miền gốc + địa chỉ vercel.app cũ (link trong thư đã gửi, tab đang mở) */
const ALLOWED_ORIGINS = new Set([
  'https://www.mayochinese.com',
  'https://mayochinese.com',
  'https://mayo-creative-chinese.vercel.app',
  // Bản preview: chính địa chỉ của bản deploy đó (biến hệ thống của Vercel)
  ...[process.env['VERCEL_URL'], process.env['VERCEL_BRANCH_URL']].filter(Boolean).map(host => `https://${host}`),
]);

/**
 * Thao tác cần token Cloudflare Turnstile (action của widget phía trình duyệt).
 * Khoá theo tên hàm xuất hiện ở bất kỳ đâu trong đường dẫn đã giải mã — không lách được bằng //, %xx hay chữ hoa.
 * Missing CAPTCHA configuration fails closed, including local requests.
 */
const TURNSTILE_ACTIONS = [{ pattern: /register_guest/i, action: 'signup' }];

/**
 * Hỏi Cloudflare token có hợp lệ, đúng thao tác và đúng tên miền của trang hay không.
 * Lỗi mạng / phản hồi lạ đều coi là không hợp lệ.
 */
async function verifyTurnstile(token, action, clientIp) {
  const secret = process.env['TURNSTILE_SECRET'];
  if (!secret?.trim()) return false;
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) return false;
  const expectedHostnames = new Set([...ALLOWED_ORIGINS].map(origin => new URL(origin).hostname));
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (clientIp) body.set('remoteip', clientIp);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10_000),
      body,
    });
    if (!r.ok) throw new Error(`siteverify ${r.status}`);
    const result = await r.json();
    return result.success === true && result.action === action && expectedHostnames.has(result.hostname);
  } catch (err) {
    console.error('Turnstile siteverify failed:', err);
    return false;
  }
}

/** Chỉ chuyển tiếp header PostgREST cần (header hệ thống của Vercel làm fetch báo lỗi) */
const FORWARD_REQUEST_HEADERS = ['apikey', 'authorization', 'accept', 'accept-profile', 'content-profile', 'content-type', 'prefer', 'range', 'x-client-info', 'x-mcc-device'];
const SKIP_RESPONSE_HEADERS = new Set(['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'set-cookie']);

function corsHeaders(request) {
  const headers = new Headers();
  const origin = request.headers.get('origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, PATCH, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', request.headers.get('access-control-request-headers') ?? '*');
    headers.set('Access-Control-Expose-Headers', 'content-range, content-profile, preference-applied');
    headers.set('Access-Control-Max-Age', '86400');
    headers.set('Vary', 'Origin');
  }
  return headers;
}

async function handler(request) {
  const cors = corsHeaders(request);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const origin = request.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.has(origin)) return new Response('Forbidden', { status: 403 });

  const path = canonicalRestPath(request.headers.get('x-rest-path') ?? '');
  if (!path) {
    return new Response('Bad Request', { status: 400, headers: cors });
  }

  // IP do Vercel gắn (người dùng không tự đặt được) — DB dùng để giới hạn đăng ký khách (migration 021)
  const clientIp = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(path);
  } catch {
    return new Response('Bad Request', { status: 400, headers: cors });
  }
  const guarded = TURNSTILE_ACTIONS.find(g => g.pattern.test(decodedPath));
  if (guarded && !(await verifyTurnstile(request.headers.get('x-turnstile-token'), guarded.action, clientIp))) {
    return Response.json({ message: 'captcha_failed' }, { status: 403, headers: cors });
  }

  const headers = new Headers();
  for (const key of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(key);
    if (value !== null) headers.set(key, value);
  }
  const secret = process.env['SUPABASE_PROXY_SECRET'];
  if (secret) headers.set('x-mcc-proxy', secret);
  if (clientIp) headers.set('x-mcc-client-ip', clientIp);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  let upstream;
  try {
    upstream = await fetch(SUPABASE_URL + path, {
      method: request.method,
      redirect: 'manual',
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
    });
  } catch (err) {
    console.error('REST proxy fetch failed:', err);
    return Response.json({ message: 'Proxy unavailable' }, { status: 502, headers: cors });
  }

  if (upstream.status >= 300 && upstream.status < 400) {
    return Response.json({ message: 'upstream_redirect_rejected' }, { status: 502, headers: cors });
  }
  const responseHeaders = new Headers(cors);
  upstream.headers.forEach((value, key) => {
    if (!SKIP_RESPONSE_HEADERS.has(key.toLowerCase())) responseHeaders.set(key, value);
  });
  responseHeaders.set('Cache-Control', 'no-store');
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export const GET = handler;
export const HEAD = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
export const OPTIONS = handler;
