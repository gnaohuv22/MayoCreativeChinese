import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://animyjihwiyqsxvikxxg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ipJ6WbMASU_-LFDIWNyMkg_1404EDZJ';

/**
 * Dữ liệu (REST) đi qua proxy có giới hạn tần suất (api/rest.mjs; local: proxy.conf.mjs);
 * auth và storage vẫn gọi thẳng
 */
const REST_PREFIX = `${SUPABASE_URL}/rest/v1/`;
const REST_PROXY = '/api/rest';

function proxiedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (!url.startsWith(REST_PREFIX) || input instanceof Request) return fetch(input, init);
  const headers = new Headers(init?.headers);
  headers.set('x-rest-path', url.slice(SUPABASE_URL.length));
  return fetch(REST_PROXY, { ...init, headers });
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
