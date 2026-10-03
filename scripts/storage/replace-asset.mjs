// Ghi đè 1 file đã có trong bucket exam-assets bằng file local (giữ nguyên đường dẫn → link trong
// đề thi không đổi, không cần sửa database). Dùng khi nén lại ảnh/audio đã tải lên trước đây.
//
// Chạy thủ công bằng tài khoản quản trị (cần quyền content.read + content.update):
//   ADMIN_USERNAME=MaiLN ADMIN_PASSWORD=... node scripts/storage/replace-asset.mjs audio/123_abc.mp3 ./abc-nen.mp3
// Nên chạy lúc không có ai đang làm bài: người đang nghe dở có thể bị ngắt khi tua.
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://animyjihwiyqsxvikxxg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ipJ6WbMASU_-LFDIWNyMkg_1404EDZJ';
const LOGIN_EMAIL_DOMAIN = 'mayocreativechinese.edu.vn';
const BUCKET = 'exam-assets';
const CONTENT_TYPES = { '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

const [target, localFile] = process.argv.slice(2);
const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !target || !localFile) {
  console.error('Usage: ADMIN_USERNAME=... ADMIN_PASSWORD=... node scripts/storage/replace-asset.mjs <đường dẫn trong bucket> <file local>');
  process.exit(1);
}

function fail(message) {
  console.error(`\n✗ ${message}\nKhông thay file nào.`);
  process.exit(1);
}

const contentType = CONTENT_TYPES[extname(target).toLowerCase()];
if (!contentType) fail(`Không hỗ trợ đuôi file ${extname(target)}.`);
if (extname(target).toLowerCase() !== extname(localFile).toLowerCase()) fail('File local phải cùng định dạng (đuôi) với file trong bucket.');

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
const login = ADMIN_USERNAME.includes('@') ? ADMIN_USERNAME : `${ADMIN_USERNAME.toLowerCase()}@${LOGIN_EMAIL_DOMAIN}`;
const { error: loginError } = await supabase.auth.signInWithPassword({ email: login, password: ADMIN_PASSWORD });
if (loginError) fail(`Đăng nhập thất bại: ${loginError.message}`);

const { data: canUpdate } = await supabase.rpc('has_permission', { p_permission: 'content.update' });
if (!canUpdate) fail('Tài khoản này không có quyền content.update.');

// Chỉ thay file đã có — tránh gõ nhầm đường dẫn mà tạo file mới không đề nào dùng
const folder = target.includes('/') ? target.slice(0, target.lastIndexOf('/')) : '';
const name = target.slice(folder ? folder.length + 1 : 0);
const { data: existing, error: listError } = await supabase.storage.from(BUCKET).list(folder, { search: name });
if (listError) fail(`Không đọc được bucket: ${listError.message}`);
const old = existing?.find(o => o.name === name);
if (!old) fail(`Không có file ${target} trong bucket.`);

const body = await readFile(localFile);
const { error: uploadError } = await supabase.storage.from(BUCKET).upload(target, body, {
  contentType,
  cacheControl: '31536000',
  upsert: true,
});
if (uploadError) fail(`Tải lên thất bại: ${uploadError.message}`);

const mb = bytes => (bytes / 1024 / 1024).toFixed(1);
console.log(`✓ ${target}: ${mb(old.metadata?.size ?? 0)} MB → ${mb(body.length)} MB`);
await supabase.auth.signOut();
