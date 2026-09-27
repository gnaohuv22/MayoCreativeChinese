// Tạo (hoặc cập nhật mật khẩu / họ tên / vai trò) tài khoản nhân sự.
// Vai trò nằm ở cột public.staff_profiles.role_id, tham chiếu bảng public.roles (migration 013):
//   admin = toàn quyền + quản lý nhân sự + nhật ký; staff = xem/thêm/sửa nội dung.
// Tài khoản mới mặc định "staff"; để trống role khi cập nhật thì giữ nguyên vai trò cũ.
// Tên đăng nhập ngắn (vd "MaiLN") → email <tên viết thường>@mayocreativechinese.edu.vn (khớp AuthService).
// Admin đặt lại mật khẩu nhân sự ngay trên trang /admin/staff; script này dùng khi tạo tài khoản
// hoặc khi cần đặt lại mật khẩu cho chính admin.
//
// Một tài khoản:  DATABASE_URL=... ADMIN_USERNAME=... ADMIN_PASSWORD=... [ADMIN_FULL_NAME=...] [ADMIN_ROLE=admin|staff] node scripts/db/create-admin.mjs
// Nhiều tài khoản: DATABASE_URL=... node scripts/db/create-admin.mjs accounts.csv
//   accounts.csv: dòng đầu "username,password,full_name,role" (role tuỳ chọn), mỗi dòng 1 người.
// Không commit mật khẩu / file CSV vào repo.
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const LOGIN_EMAIL_DOMAIN = 'mayocreativechinese.edu.vn';

async function loadAccounts() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    const { ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_FULL_NAME = '', ADMIN_ROLE = '' } = process.env;
    return ADMIN_USERNAME && ADMIN_PASSWORD
      ? [{ username: ADMIN_USERNAME, password: ADMIN_PASSWORD, fullName: ADMIN_FULL_NAME, role: ADMIN_ROLE }]
      : [];
  }
  const lines = (await readFile(csvPath, 'utf8')).replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
  return lines.slice(1).map(line => {
    const [username = '', password = '', fullName = '', role = ''] = line.split(',');
    return { username: username.trim(), password: password.trim(), fullName: fullName.trim(), role: role.trim() };
  });
}

const accounts = await loadAccounts();
if (!process.env.DATABASE_URL || accounts.length === 0 || accounts.some(a => !a.username || !a.password)) {
  console.error('Usage: DATABASE_URL=... ADMIN_USERNAME=... ADMIN_PASSWORD=... [ADMIN_FULL_NAME=...] [ADMIN_ROLE=admin|staff] node scripts/db/create-admin.mjs');
  console.error('   or: DATABASE_URL=... node scripts/db/create-admin.mjs accounts.csv   (username,password,full_name,role)');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query('begin');
  const roles = (await client.query('select id from public.roles')).rows.map(r => r.id);
  const badRole = accounts.find(a => a.role && !roles.includes(a.role));
  if (badRole) throw new Error(`Vai trò "${badRole.role}" không tồn tại (có: ${roles.join(', ')})`);

  for (const { username, password, fullName, role } of accounts) {
    const email = username.includes('@') ? username.toLowerCase() : `${username.toLowerCase()}@${LOGIN_EMAIL_DOMAIN}`;
    const existing = await client.query('select id from auth.users where email = $1', [email]);
    let id;

    if (existing.rowCount > 0) {
      id = existing.rows[0].id;
      await client.query(
        `update auth.users set
           encrypted_password = extensions.crypt($2, extensions.gen_salt('bf', 10)),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at = now()
         where id = $1`,
        [id, password],
      );
    } else {
      ({ rows: [{ id }] } = await client.query(
        `insert into auth.users (
           instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
           raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
           confirmation_token, recovery_token, email_change_token_new, email_change
         ) values (
           '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', $1,
           extensions.crypt($2, extensions.gen_salt('bf', 10)), now(),
           '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
           '', '', '', ''
         ) returning id`,
        [email, password],
      ));
      await client.query(
        `insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
         values (gen_random_uuid(), $1::uuid, $3::text,
                 jsonb_build_object('sub', $3::text, 'email', $2::text, 'email_verified', true),
                 'email', now(), now(), now())`,
        [id, email, String(id)],
      );
    }

    const { rows: [profile] } = await client.query(
      `insert into public.staff_profiles (user_id, username, full_name, role_id)
       values ($1, $2, $3, coalesce(nullif($4, ''), 'staff'))
       on conflict (user_id) do update set
         username  = excluded.username,
         full_name = case when $3 = '' then staff_profiles.full_name else excluded.full_name end,
         role_id   = coalesce(nullif($4, ''), staff_profiles.role_id)
       returning role_id`,
      [id, username, fullName, role],
    );
    console.log(`${existing.rowCount > 0 ? 'Updated' : 'Created'} ${username} → ${email} (${profile.role_id})`);
  }
  await client.query('commit');
} catch (err) {
  await client.query('rollback');
  console.error('Rolled back:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
