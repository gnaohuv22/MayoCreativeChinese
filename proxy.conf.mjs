import { canonicalRestPath } from './server/rest-path.mjs';
// Proxy cho `ng serve`: thay cho api/rest.mjs khi chạy local — chuyển /api/rest thẳng tới
// Supabase kèm header bí mật (migration 015), không đi qua Vercel.
// Bí mật lấy từ biến môi trường SUPABASE_PROXY_SECRET hoặc file .env.local
// (tạo bằng `vercel env pull .env.local`, hoặc tự ghi SUPABASE_PROXY_SECRET=...).
import { existsSync, readFileSync } from 'node:fs';

const SUPABASE_URL = 'https://animyjihwiyqsxvikxxg.supabase.co';

function readSecret() {
  if (process.env.SUPABASE_PROXY_SECRET) return process.env.SUPABASE_PROXY_SECRET;
  if (!existsSync('.env.local')) return '';
  const line = readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .find(l => l.startsWith('SUPABASE_PROXY_SECRET='));
  return line ? line.slice('SUPABASE_PROXY_SECRET='.length).replace(/^"|"$/g, '').trim() : '';
}

const secret = readSecret();
if (!secret) console.warn('[proxy] Thiếu SUPABASE_PROXY_SECRET — dữ liệu sẽ bị Supabase từ chối (401).');

export default {
  '/api/rest': {
    target: SUPABASE_URL,
    changeOrigin: true,
    secure: true,
    followRedirects: false,
    configure: proxy => {
      proxy.on('proxyRes', upstream => {
        if (upstream.statusCode >= 300 && upstream.statusCode < 400) {
          upstream.statusCode = 502;
          delete upstream.headers.location;
        }
      });
      proxy.on('proxyReq', (proxyReq, req, res) => {
        const path = canonicalRestPath(String(req.headers['x-rest-path'] ?? ''));
        if (!path || /register_guest/i.test(path)) {
          proxyReq.destroy();
          res.writeHead(400).end('Invalid path or protected registration: use offline mocks for local signup tests');
          return;
        }
        proxyReq.path = path;
        proxyReq.removeHeader('x-rest-path');
        proxyReq.removeHeader('origin');
        proxyReq.removeHeader('referer');
        // Protected signup is rejected above; local security tests mock CAPTCHA and all writes.
        proxyReq.removeHeader('x-turnstile-token');
        if (secret) proxyReq.setHeader('x-mcc-proxy', secret);
        // Như api/rest.mjs: IP để DB giới hạn đăng ký khách (migration 021)
        proxyReq.setHeader('x-mcc-client-ip', req.socket.remoteAddress ?? '127.0.0.1');
      });
    },
  },
};
