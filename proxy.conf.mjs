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
    configure: proxy => {
      proxy.on('proxyReq', (proxyReq, req, res) => {
        const path = String(req.headers['x-rest-path'] ?? '');
        if (!path.startsWith('/rest/v1/') || path.includes('..')) {
          res.writeHead(400).end('Bad Request');
          return;
        }
        proxyReq.path = path;
        proxyReq.removeHeader('x-rest-path');
        proxyReq.removeHeader('origin');
        proxyReq.removeHeader('referer');
        if (secret) proxyReq.setHeader('x-mcc-proxy', secret);
      });
    },
  },
};
