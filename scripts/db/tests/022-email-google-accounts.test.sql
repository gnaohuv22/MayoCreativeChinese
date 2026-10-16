-- Kiểm tra migration 022 — chạy SAU file migration trong cùng lệnh, luôn kèm --dry-run:
--   node scripts/db/run-sql.mjs --dry-run src/app/features/classes/data/022-email-google-accounts.sql scripts/db/tests/022-email-google-accounts.test.sql

create or replace function pg_temp.act_as(p_user uuid, p_ip text default '203.0.113.22', p_amr jsonb default '[]')
returns void
language sql
as $$
  select set_config('request.jwt.claims',
           case when p_user is null then '{"role":"anon"}'
                else json_build_object('sub', p_user, 'role', 'authenticated', 'amr', p_amr)::text end, true),
         set_config('request.headers', json_build_object('x-mcc-client-ip', p_ip)::text, true);
$$;

do $$
declare
  v_guest uuid;
  v_google uuid := gen_random_uuid();
  v_res jsonb;
  v_now bigint := extract(epoch from now())::bigint;
  i integer;
begin
  assert public.normalize_email(' Ten.Thu@Mail.COM ') = 'ten.thu@mail.com', 'chuẩn hoá email';
  assert public.normalize_email('khong-phai-email') is null, 'email sai';

  -- Đăng ký khách: email bắt buộc, tài khoản chưa xác nhận
  perform pg_temp.act_as(null);
  assert public.register_guest('sai', '0399000201', 'abc12345', 'A', true) ->> 'error' = 'invalid_email', 'invalid_email';
  assert public.register_guest('k022@example.com', '123', 'abc12345', 'A', true) ->> 'error' = 'invalid_phone', 'invalid_phone';
  v_res := public.register_guest('K022@Example.com', '0399000201', 'abc12345', 'Khách 022', true);
  assert (v_res ->> 'ok')::boolean and v_res ->> 'email' = 'k022@example.com', 'đăng ký phải thành công: ' || v_res::text;
  select user_id into v_guest from public.student_profiles where username = '0399000201';
  assert exists (select 1 from auth.users where id = v_guest and email = 'k022@example.com' and email_confirmed_at is null),
    'auth.users phải dùng email thật, chưa xác nhận';
  assert public.register_guest('k022@example.com', '0399000202', 'abc12345', 'A', true) ->> 'error' = 'email_taken', 'email_taken';
  assert public.register_guest('k022b@example.com', '0399000201', 'abc12345', 'A', true) ->> 'error' = 'phone_taken', 'phone_taken';

  -- Đăng nhập bằng số điện thoại: chỉ trả email khi mật khẩu đúng
  assert public.learner_login_email('0399 000 201', 'abc12345') ->> 'email' = 'k022@example.com', 'phải trả email';
  assert public.learner_login_email('0399000201', 'sai12345') ->> 'error' = 'invalid', 'sai mật khẩu không được lộ email';
  assert public.learner_login_email('0399000299', 'abc12345') ->> 'error' = 'invalid', 'số lạ';
  for i in 1..18 loop
    perform public.learner_login_email('0399000201', 'sai12345');
  end loop;
  assert public.learner_login_email('0399000201', 'abc12345') ->> 'error' = 'rate_limited', 'phải chặn sau 20 lần sai';
  perform pg_temp.act_as(null, '198.51.100.22');
  assert public.learner_login_email('0399000201', 'abc12345') ->> 'email' = 'k022@example.com', 'IP khác vẫn đăng nhập được';

  -- Đặt lại mật khẩu: chỉ phiên mở từ link khôi phục
  perform pg_temp.act_as(v_guest);
  assert public.learner_reset_password('moi12345') ->> 'error' = 'not_recovery', 'phiên thường không được đặt lại';
  perform pg_temp.act_as(v_guest, p_amr => jsonb_build_array(jsonb_build_object('method', 'recovery', 'timestamp', v_now - 7200)));
  assert public.learner_reset_password('moi12345') ->> 'error' = 'not_recovery', 'link khôi phục quá 1 giờ';
  perform pg_temp.act_as(v_guest, p_amr => jsonb_build_array(jsonb_build_object('method', 'recovery', 'timestamp', v_now)));
  assert public.learner_reset_password('yeu') ->> 'error' = 'weak_password', 'mật khẩu yếu';
  assert (public.learner_reset_password('moi12345') ->> 'ok')::boolean, 'phải đặt lại được';
  assert exists (select 1 from auth.users where id = v_guest and encrypted_password = extensions.crypt('moi12345', encrypted_password)),
    'mật khẩu chưa đổi';

  -- Google: hồ sơ khách lần đầu
  insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', v_google, 'authenticated', 'authenticated', 'Google022@Gmail.com', now(),
          '{"provider":"google","providers":["google"]}', now(), now());
  perform pg_temp.act_as(v_guest);
  assert public.complete_oauth_profile('A', '', true) ->> 'error' = 'not_oauth', 'tài khoản email không dùng được';
  perform pg_temp.act_as(v_google);
  assert not public.is_learner(), 'chưa có hồ sơ';
  assert public.complete_oauth_profile('  ', '', true) ->> 'error' = 'missing_name', 'missing_name';
  assert public.complete_oauth_profile('G', '0399000201', true) ->> 'error' = 'phone_taken', 'phone_taken';
  assert public.complete_oauth_profile('G', '', false) ->> 'error' = 'no_consent', 'no_consent';
  assert (public.complete_oauth_profile('Người Google', '', true) ->> 'ok')::boolean, 'phải tạo hồ sơ';
  assert public.is_learner() and public.my_student_context() ->> 'username' = 'google022@gmail.com', 'hồ sơ Google sai';
  assert public.complete_oauth_profile('Lần 2', '', true) ->> 'error' = 'has_profile', 'không tạo 2 lần';

  -- Hook: chỉ Google được tạo tài khoản qua Supabase Auth
  assert public.hook_before_user_created('{"user":{"app_metadata":{"provider":"google"}}}') = '{}'::jsonb, 'Google phải qua';
  assert public.hook_before_user_created('{"user":{"app_metadata":{"provider":"email"}}}') -> 'error' ->> 'http_code' = '403', 'email phải bị chặn';
  assert public.hook_before_user_created('{}') ? 'error', 'thiếu thông tin phải bị chặn';

  raise notice 'TẤT CẢ ĐẠT';
end $$;
