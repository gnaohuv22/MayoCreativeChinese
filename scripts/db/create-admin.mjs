// Tạo (hoặc cập nhật mật khẩu + quyền) tài khoản admin Supabase Auth.
// Quyền admin nằm ở app_metadata.role = 'admin' (xem migration 008).
// Usage: DATABASE_URL=... ADMIN_PASSWORD=... [ADMIN_EMAIL=...] node scripts/db/create-admin.mjs
// Không commit mật khẩu vào repo.
import pg from 'pg';

const email = (process.env.ADMIN_EMAIL || 'admin@mayocreativechinese.edu.vn').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!process.env.DATABASE_URL || !password) {
  console.error('Usage: DATABASE_URL=... ADMIN_PASSWORD=... [ADMIN_EMAIL=...] node scripts/db/create-admin.mjs');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query('begin');
  const existing = await client.query('select id from auth.users where email = $1', [email]);

  if (existing.rowCount > 0) {
    const id = existing.rows[0].id;
    await client.query(
      `update auth.users set
         encrypted_password = extensions.crypt($2, extensions.gen_salt('bf')),
         email_confirmed_at = coalesce(email_confirmed_at, now()),
         raw_app_meta_data  = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb,
         updated_at = now()
       where id = $1`,
      [id, password],
    );
    console.log(`Updated admin ${email} (${id})`);
  } else {
    const { rows } = await client.query(
      `insert into auth.users (
         instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
         raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
         confirmation_token, recovery_token, email_change_token_new, email_change
       ) values (
         '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', $1,
         extensions.crypt($2, extensions.gen_salt('bf')), now(),
         '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb, '{}'::jsonb, now(), now(),
         '', '', '', ''
       ) returning id`,
      [email, password],
    );
    const id = rows[0].id;
    await client.query(
      `insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
       values (gen_random_uuid(), $1::uuid, $3::text,
               jsonb_build_object('sub', $3::text, 'email', $2::text, 'email_verified', true),
               'email', now(), now(), now())`,
      [id, email, String(id)],
    );
    console.log(`Created admin ${email} (${id})`);
  }
  await client.query('commit');
} catch (err) {
  await client.query('rollback');
  console.error('Rolled back:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
