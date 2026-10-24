import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { deviceId } from './device-id';

const SUPABASE_URL = 'https://animyjihwiyqsxvikxxg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ipJ6WbMASU_-LFDIWNyMkg_1404EDZJ';

/**
 * Dữ liệu (REST) đi qua proxy có giới hạn tần suất (api/rest.mjs; local: proxy.conf.mjs);
 * auth và storage vẫn gọi thẳng
 */
const REST_PREFIX = `${SUPABASE_URL}/rest/v1/`;
const REST_PROXY = '/api/rest';

/** Vercel Firewall trả 429 trước khi request tới hàm proxy → gửi lại an toàn với mọi method */
const RETRY_DELAYS_MS = [800, 2000, 4000];
const MAX_RETRY_AFTER_MS = 8000;

function wait(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    }, { once: true });
  });
}

/** Retry-After (giây) nếu có, không thì theo bậc chờ cố định */
function retryDelay(response: Response, attempt: number): number {
  const seconds = Number(response.headers.get('retry-after'));
  if (Number.isFinite(seconds) && seconds > 0) return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
  return RETRY_DELAYS_MS[attempt];
}

async function sendWithRetry(send: () => Promise<Response>, signal?: AbortSignal | null): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const response = await send();
    if (response.status !== 429 || attempt >= RETRY_DELAYS_MS.length) return response;
    await wait(retryDelay(response, attempt), signal);
  }
}

export async function proxiedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (!url.startsWith(REST_PREFIX)) return fetch(input, init);
  const restPath = url.slice(SUPABASE_URL.length);
  if (input instanceof Request) {
    // Đọc lại method / header / body từ Request để vẫn đi qua proxy
    const request = new Request(input, init);
    const headers = new Headers(request.headers);
    headers.set('x-rest-path', restPath);
    headers.set('x-mcc-device', deviceId());
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
    const body = hasBody ? await request.arrayBuffer() : undefined;
    return sendWithRetry(() => fetch(REST_PROXY, {
      method: request.method,
      headers,
      body,
      signal: request.signal,
    }), request.signal);
  }
  const headers = new Headers(init?.headers);
  headers.set('x-rest-path', restPath);
  headers.set('x-mcc-device', deviceId());
  return sendWithRetry(() => fetch(REST_PROXY, { ...init, headers }), init?.signal);
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { fetch: proxiedFetch } });
  }
  return supabaseInstance;
}

export const SESSION_EXPIRED_MESSAGE = 'Phiên đăng nhập đã hết. Vui lòng tải lại trang, đăng nhập lại rồi thử lại.';

/**
 * Kiểm tra phiên trước khi ghi (getSession tự gia hạn token nếu cần). Mất phiên thì
 * supabase-js gửi request bằng khoá anon và DB chỉ báo lỗi RLS khó hiểu.
 */
export async function sessionError(): Promise<string | null> {
  const { data } = await getSupabase().auth.getSession();
  return data.session ? null : SESSION_EXPIRED_MESSAGE;
}

/** Lỗi ghi → câu dễ hiểu; RLS từ chối (42501) gần như luôn do request đã thành anon */
export function writeErrorMessage(error: { code?: string; message: string }): string {
  return error.code === '42501' || error.message.includes('row-level security') ? SESSION_EXPIRED_MESSAGE : error.message;
}
