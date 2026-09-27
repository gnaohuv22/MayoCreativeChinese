// Tìm (và xoá nếu muốn) file "chết" trong bucket exam-assets: file không còn đề thi nào dùng
// (tải lên nhưng không lưu đề, đã thay bằng file khác, hoặc đề đã bị xoá).
//
// Chạy thủ công bằng tài khoản quản trị (cần quyền content.read + content.delete):
//   Xem trước (không xoá gì):  ADMIN_USERNAME=MaiLN ADMIN_PASSWORD=... npm run clean:assets
//   Xoá thật:                  ADMIN_USERNAME=MaiLN ADMIN_PASSWORD=... npm run clean:assets -- --delete
// Tuỳ chọn:
//   --min-age-hours=24  chỉ tính file cũ hơn N giờ (mặc định 24) để không xoá file ai đó vừa tải lên
//                       nhưng chưa kịp bấm "Lưu đề thi"
//   --force             cho phép xoá khi TẤT CẢ file đều bị coi là không dùng (thường là dấu hiệu lỗi)
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://animyjihwiyqsxvikxxg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ipJ6WbMASU_-LFDIWNyMkg_1404EDZJ';
const LOGIN_EMAIL_DOMAIN = 'mayocreativechinese.edu.vn';
const BUCKET = 'exam-assets';
const EXAM_TABLES = ['exams', 'exam_sections', 'exam_parts', 'exam_questions', 'exam_options'];
const PAGE = 1000;

const args = process.argv.slice(2);
const shouldDelete = args.includes('--delete');
const force = args.includes('--force');
const minAgeHours = Number(args.find(a => a.startsWith('--min-age-hours='))?.split('=')[1] ?? 24);

const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
if (!ADMIN_USERNAME || !ADMIN_PASSWORD || Number.isNaN(minAgeHours)) {
  console.error('Usage: ADMIN_USERNAME=... ADMIN_PASSWORD=... npm run clean:assets [-- --delete] [--min-age-hours=24] [--force]');
  process.exit(1);
}

function fail(message) {
  console.error(`\n✗ ${message}\nKhông xoá file nào.`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
const login = ADMIN_USERNAME.includes('@') ? ADMIN_USERNAME : `${ADMIN_USERNAME.toLowerCase()}@${LOGIN_EMAIL_DOMAIN}`;
const { error: loginError } = await supabase.auth.signInWithPassword({ email: login, password: ADMIN_PASSWORD });
if (loginError) fail(`Đăng nhập thất bại: ${loginError.message}`);

const { data: canRead } = await supabase.rpc('has_permission', { p_permission: 'content.read' });
const { data: canDelete } = await supabase.rpc('has_permission', { p_permission: 'content.delete' });
if (!canRead) fail('Tài khoản này không có quyền content.read.');
if (shouldDelete && !canDelete) fail('Tài khoản này không có quyền content.delete (chỉ Quản trị viên được xoá file).');

// 1. Toàn bộ file trong bucket (duyệt đệ quy các thư mục)
async function listFiles(prefix = '') {
  const files = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: PAGE, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error) fail(`Không liệt kê được file trong "${prefix || '/'}": ${error.message}`);
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) files.push(...(await listFiles(path)));
      else files.push({ path, size: item.metadata?.size ?? 0, createdAt: new Date(item.created_at) });
    }
    if (data.length < PAGE) break;
  }
  return files;
}

// 2. Mọi đường dẫn file được nhắc tới trong dữ liệu đề (quét mọi cột, kể cả mô tả / nội dung câu hỏi)
const urlPattern = new RegExp(`/storage/v1/object/public/${BUCKET}/([^\\s"'<>)?#]+)`, 'g');
async function referencedPaths() {
  const refs = new Map();
  for (const table of EXAM_TABLES) {
    for (let from = 0; ; from += PAGE) {
      // Cố ý select('*'): đường dẫn file có thể nằm ở bất kỳ cột văn bản nào
      const { data, error } = await supabase.from(table).select('*').order('id').range(from, from + PAGE - 1);
      if (error) fail(`Không đọc được bảng ${table}: ${error.message}`);
      for (const row of data) {
        for (const match of JSON.stringify(row).matchAll(urlPattern)) {
          const path = decodeURIComponent(match[1]);
          refs.set(path, (refs.get(path) ?? 0) + 1);
        }
      }
      if (data.length < PAGE) break;
    }
  }
  return refs;
}

const [files, refs] = await Promise.all([listFiles(), referencedPaths()]);
const cutoff = Date.now() - minAgeHours * 3_600_000;
const existing = new Set(files.map(f => f.path));
const unused = files.filter(f => !refs.has(f.path));
const orphans = unused.filter(f => f.createdAt.getTime() < cutoff);
const tooNew = unused.filter(f => f.createdAt.getTime() >= cutoff);
const missing = [...refs.keys()].filter(p => !existing.has(p));

const kb = bytes => `${(bytes / 1024).toFixed(1)} KB`;
const day = date => date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

console.log(`\nBucket "${BUCKET}": ${files.length} file (${kb(files.reduce((s, f) => s + f.size, 0))}), ${files.length - unused.length} đang được đề thi dùng.`);

console.log(`\nFile không dùng, cũ hơn ${minAgeHours} giờ: ${orphans.length} file (${kb(orphans.reduce((s, f) => s + f.size, 0))})`);
for (const f of orphans) console.log(`  - ${f.path}  ${kb(f.size)}  tải lên ${day(f.createdAt)}`);

if (tooNew.length) {
  console.log(`\nBỏ qua ${tooNew.length} file không dùng nhưng mới tải lên (< ${minAgeHours} giờ, có thể đang soạn đề):`);
  for (const f of tooNew) console.log(`  - ${f.path}  tải lên ${day(f.createdAt)}`);
}

if (missing.length) {
  console.log(`\n⚠ ${missing.length} file được đề thi nhắc tới nhưng KHÔNG còn trong kho (ảnh/audio sẽ bị lỗi khi làm bài):`);
  for (const p of missing) console.log(`  - ${p}`);
}

if (!shouldDelete) {
  console.log(orphans.length ? '\nChế độ xem trước — chưa xoá gì. Thêm "-- --delete" để xoá các file trên.' : '\nKhông có file nào cần dọn.');
  process.exit(0);
}

if (orphans.length === 0) {
  console.log('\nKhông có file nào cần dọn.');
  process.exit(0);
}
if (orphans.length === files.length && !force) {
  fail('Mọi file trong kho đều bị coi là không dùng — có thể dữ liệu đề đọc không đầy đủ. Kiểm tra lại, hoặc chạy thêm --force nếu chắc chắn.');
}

let removed = 0;
for (let i = 0; i < orphans.length; i += 100) {
  const batch = orphans.slice(i, i + 100).map(f => f.path);
  const { data, error } = await supabase.storage.from(BUCKET).remove(batch);
  if (error) fail(`Lỗi khi xoá: ${error.message} (đã xoá ${removed} file trước đó)`);
  removed += data.length;
}
console.log(`\n✓ Đã xoá ${removed}/${orphans.length} file.`);
if (removed < orphans.length) console.log('  Một số file không xoá được — kiểm tra quyền content.delete của tài khoản.');
