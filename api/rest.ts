/**
 * Proxy cho Supabase REST (/rest/v1/*) — trình duyệt gọi qua đây thay vì gọi thẳng supabase.co.
 * Vercel Firewall giới hạn số request / IP ở trước hàm này; hàm gắn header bí mật
 * để DB (migration 015) từ chối request anon không đi qua proxy.
 * Đường dẫn đích nằm trong header x-rest-path (xem src/app/services/supabase.client.ts).
 */
const SUPABASE_URL = 'https://animyjihwiyqsxvikxxg.supabase.co';

const ALLOWED_ORIGINS = new Set([
  'https://mayo-creative-chinese.vercel.app',
  'https://mayocreativechinese.edu.vn',
  'https://www.mayocreativechinese.edu.vn',
  'http://localhost:4200',
]);

/** Header không chuyển tiếp (hop-by-hop / do fetch tự đặt lại) */
const SKIP_REQUEST_HEADERS = new Set(['host', 'connection', 'content-length', 'x-rest-path', 'x-mcc-proxy', 'origin', 'referer', 'cookie']);
const SKIP_RESPONSE_HEADERS = new Set(['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'set-cookie']);

function corsHeaders(request: Request): Headers {
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

async function handler(request: Request): Promise<Response> {
  const cors = corsHeaders(request);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const origin = request.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.has(origin)) return new Response('Forbidden', { status: 403 });

  const path = request.headers.get('x-rest-path') ?? '';
  if (!path.startsWith('/rest/v1/') || path.includes('..')) {
    return new Response('Bad Request', { status: 400, headers: cors });
  }

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!SKIP_REQUEST_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });
  const secret = process.env['SUPABASE_PROXY_SECRET'];
  if (secret) headers.set('x-mcc-proxy', secret);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const upstream = await fetch(SUPABASE_URL + path, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
  });

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
