// Tạo (hoặc cập nhật mật khẩu + quyền) tài khoản nhân sự Supabase Auth.
// Quyền nằm ở app_metadata.role (xem migration 012): owner = toàn quyền, editor = xem/thêm/sửa, không xoá.
// Tài khoản mới mặc định editor; để trống role khi cập nhật thì giữ nguyên quyền cũ.
// Tên đăng nhập ngắn (vd "MaiLN") → email <tên viết thường>@mayocreativechinese.edu.vn (khớp AuthService).
//
// Một tài khoản:  DATABASE_URL=... ADMIN_USERNAME=... ADMIN_PASSWORD=... [ADMIN_FULL_NAME=...] [ADMIN_ROLE=owner|editor] node scripts/db/create-admin.mjs
// Nhiều tài khoản: DATABASE_URL=... node scripts/db/create-admin.mjs accounts.csv
//   accounts.csv: dòng đầu "username,password,full_name,role" (role tuỳ chọn), mỗi dòng 1 người.
// Không commit mật khẩu / file CSV vào repo.
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const LOGIN_EMAIL_DOMAIN = 'mayocreativechinese.edu.vn';
const ROLES = ['owner', 'editor'];

async function loadAccounts() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    const { ADMIN_USERNAME = 'admin', ADMIN_PASSWORD, ADMIN_FULL_NAME = '', ADMIN_ROLE = '' } = process.env;
    return ADMIN_PASSWORD ? [{ username: ADMIN_USERNAME, password: ADMIN_PASSWORD, fullName: ADMIN_FULL_NAME, role: ADMIN_ROLE }] : [];
  }
  const lines = (await readFile(csvPath, 'utf8')).replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
  return lines.slice(1).map(line => {
    const [username = '', password = '', fullName = '', role = ''] = line.split(',');
    return { username: username.trim(), password: password.trim(), fullName: fullName.trim(), role: role.trim() };
  });
}

const accounts = await loadAccounts();
if (!process.env.DATABASE_URL || accounts.length === 0 || accounts.some(a => !a.username || !a.password || (a.role && !ROLES.includes(a.role)))) {
  console.error('Usage: DATABASE_URL=... ADMIN_PASSWORD=... [ADMIN_USERNAME=admin] node scripts/db/create-admin.mjs');
  console.error('   or: DATABASE_URL=... node scripts/db/create-admin.mjs accounts.csv   (username,password,full_name,role)');
  console.error(`role: ${ROLES.join(' | ')} (bỏ trống = editor khi tạo mới, giữ nguyên khi cập nhật)`);
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query('begin');
  for (const { username, password, fullName, role } of accounts) {
    const email = username.includes('@') ? username.toLowerCase() : `${username.toLowerCase()}@${LOGIN_EMAIL_DOMAIN}`;
    const userMeta = JSON.stringify(fullName ? { full_name: fullName, username } : { username });
    const existing = await client.query('select id from auth.users where email = $1', [email]);

    if (existing.rowCount > 0) {
      const id = existing.rows[0].id;
      await client.query(
        `update auth.users set
           encrypted_password = extensions.crypt($2, extensions.gen_salt('bf', 10)),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data  = coalesce(raw_app_meta_data, '{}'::jsonb)
                                || case when $4::text = '' then '{}'::jsonb else jsonb_build_object('role', $4::text) end,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || $3::jsonb,
           updated_at = now()
         where id = $1`,
        [id, password, userMeta, role],
      );
      console.log(`Updated ${username} → ${email}${role ? ` (${role})` : ''}`);
      continue;
    }

    const { rows } = await client.query(
      `insert into auth.users (
         instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
         raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
         confirmation_token, recovery_token, email_change_token_new, email_change
       ) values (
         '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', $1,
         extensions.crypt($2, extensions.gen_salt('bf', 10)), now(),
         jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', $4::text), $3::jsonb, now(), now(),
         '', '', '', ''
       ) returning id`,
      [email, password, userMeta, role || 'editor'],
    );
    const id = rows[0].id;
    await client.query(
      `insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
       values (gen_random_uuid(), $1::uuid, $3::text,
               jsonb_build_object('sub', $3::text, 'email', $2::text, 'email_verified', true),
               'email', now(), now(), now())`,
      [id, email, String(id)],
    );
    console.log(`Created ${username} → ${email} (${role || 'editor'})`);
  }
  await client.query('commit');
} catch (err) {
  await client.query('rollback');
  console.error('Rolled back:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
