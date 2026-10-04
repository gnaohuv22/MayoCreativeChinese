/**
 * Proxy cho Supabase REST (/rest/v1/*) — trình duyệt gọi qua đây thay vì gọi thẳng supabase.co.
 * Vercel Firewall giới hạn số request / IP ở trước hàm này; hàm gắn header bí mật
 * để DB (migration 015) từ chối request anon không đi qua proxy.
 * Đường dẫn đích nằm trong header x-rest-path (xem src/app/services/supabase.client.ts).
 */
const SUPABASE_URL = 'https://animyjihwiyqsxvikxxg.supabase.co';

/** Thêm tên miền thật vào đây khi mua (và đổi trong index.html, robots.txt, sitemap.xml) */
const ALLOWED_ORIGINS = new Set([
  'https://mayo-creative-chinese.vercel.app',
]);

/** Chỉ chuyển tiếp header PostgREST cần (header hệ thống của Vercel làm fetch báo lỗi) */
const FORWARD_REQUEST_HEADERS = ['apikey', 'authorization', 'accept', 'accept-profile', 'content-profile', 'content-type', 'prefer', 'range', 'x-client-info'];
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

  const path = request.headers.get('x-rest-path') ?? '';
  if (!path.startsWith('/rest/v1/') || path.includes('..')) {
    return new Response('Bad Request', { status: 400, headers: cors });
  }

  const headers = new Headers();
  for (const key of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(key);
    if (value !== null) headers.set(key, value);
  }
  const secret = process.env['SUPABASE_PROXY_SECRET'];
  if (secret) headers.set('x-mcc-proxy', secret);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  let upstream;
  try {
    upstream = await fetch(SUPABASE_URL + path, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
    });
  } catch (err) {
    console.error('REST proxy fetch failed:', err);
    return Response.json({ message: `Proxy error: ${err.message}` }, { status: 502, headers: cors });
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
