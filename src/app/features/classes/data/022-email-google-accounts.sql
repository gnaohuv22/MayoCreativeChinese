-- ==============================================================================
-- 022 — KHÁCH: EMAIL BẮT BUỘC, QUÊN MẬT KHẨU QUA EMAIL, ĐĂNG NHẬP GOOGLE
-- ==============================================================================
-- Khách đăng ký mới: email thật là email đăng nhập Supabase Auth (cần xác nhận qua thư trước khi
-- đăng nhập); số điện thoại vẫn bắt buộc và vẫn dùng để đăng nhập (learner_login_email tra ra email).
-- Khách cũ (email nội bộ <sđt>@khach…) thêm email trong trang học viên — Supabase gửi thư xác nhận,
-- xác nhận xong email đó thành email đăng nhập.
--
-- Quên mật khẩu: Supabase gửi thư khôi phục; phiên từ link khôi phục (amr = recovery) đặt mật khẩu mới
-- qua learner_reset_password (chính sách mật khẩu Supabase Auth đặt theo nhân sự, quá chặt cho học viên).
--
-- Google: Supabase Auth phải bật "Allow new users to sign up" — hook_before_user_created chỉ cho
-- Google tạo tài khoản qua Auth, nên không ai đăng ký thẳng bằng email/mật khẩu để lách Turnstile.
-- Lần đầu đăng nhập Google, người dùng điền họ tên + đồng ý → complete_oauth_profile tạo hồ sơ khách.
--
-- Sau khi chạy file: Dashboard › Authentication › Hooks › "Before User Created" › Postgres
-- › public.hook_before_user_created. Chạy được nhiều lần.

-- Khách Google có thể chưa có số điện thoại → chỉ bắt trùng khi đã nhập số
drop index if exists public.uq_student_profiles_guest_phone;
create unique index if not exists uq_student_profiles_guest_phone
  on public.student_profiles (phone) where account_type = 'guest' and phone <> '';

create table if not exists private.login_failures (
  ip         text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_login_failures_ip on private.login_failures (ip, created_at);
revoke all on private.login_failures from public, anon, authenticated;

-- "Ten@Mail.com " → "ten@mail.com"; null nếu không giống email
create or replace function public.normalize_email(p_email text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when e ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(e) <= 254 then e end
  from (select lower(trim(coalesce(p_email, ''))) as e) x
$$;
grant execute on function public.normalize_email(text) to anon, authenticated;

-- ------------------------------------------------------------------------------
-- Khách tự đăng ký (thay bản 4 tham số của 021)
-- ------------------------------------------------------------------------------
-- Trả {ok, email} hoặc {ok:false, error}:
--   invalid_email | invalid_phone | missing_name | weak_password | no_consent | email_taken | phone_taken | rate_limited
-- Tài khoản tạo ở trạng thái chưa xác nhận email; trình duyệt gọi auth.resend để Supabase gửi thư xác nhận.
drop function if exists public.register_guest(text, text, text, boolean);

create or replace function public.register_guest(p_email text, p_phone text, p_password text, p_full_name text, p_consent boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := normalize_email(p_email);
  v_phone text := normalize_vn_phone(p_phone);
  v_name text := trim(coalesce(p_full_name, ''));
  v_ip text := coalesce(nullif(current_setting('request.headers', true)::json ->> 'x-mcc-client-ip', ''), 'unknown');
  v_id uuid;
begin
  if v_email is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_email');
  end if;
  if v_phone is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_phone');
  end if;
  if v_name = '' or length(v_name) > 100 then
    return jsonb_build_object('ok', false, 'error', 'missing_name');
  end if;
  if not student_password_ok(coalesce(p_password, '')) then
    return jsonb_build_object('ok', false, 'error', 'weak_password');
  end if;
  if not coalesce(p_consent, false) then
    return jsonb_build_object('ok', false, 'error', 'no_consent');
  end if;

  delete from private.guest_signups where created_at < now() - interval '1 day';
  if (select count(*) from private.guest_signups where ip = v_ip and created_at > now() - interval '1 hour') >= 10
     or (select count(*) from private.guest_signups where created_at > now() - interval '1 hour') >= 100 then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;
  -- Tính cả lần trùng, để không dò hàng loạt email / số điện thoại nào đã có tài khoản
  insert into private.guest_signups (ip) values (v_ip);

  if exists (select 1 from auth.users where lower(email) = v_email) then
    return jsonb_build_object('ok', false, 'error', 'email_taken');
  end if;
  if exists (select 1 from student_profiles where account_type = 'guest' and phone = v_phone)
     or exists (select 1 from student_profiles where username = v_phone) then
    return jsonb_build_object('ok', false, 'error', 'phone_taken');
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf', 10)), null,
    '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', v_name), now(), now(),
    '', '', '', ''
  )
  returning id into v_id;

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
          jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', false),
          'email', null, now(), now());

  insert into student_profiles (user_id, username, full_name, phone, email, account_type, must_change_password, consented_at)
  values (v_id, v_phone, v_name, v_phone, v_email, 'guest', false, now());

  return jsonb_build_object('ok', true, 'email', v_email);
exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'phone_taken');
end;
$$;
revoke all on function public.register_guest(text, text, text, text, boolean) from public;
grant execute on function public.register_guest(text, text, text, text, boolean) to anon, authenticated;

-- ------------------------------------------------------------------------------
-- Đăng nhập bằng số điện thoại → email đăng nhập
-- ------------------------------------------------------------------------------
-- Chỉ trả email khi mật khẩu đúng (không lộ email của số điện thoại cho người không biết mật khẩu).
-- Trả {email} | {error: 'invalid' | 'rate_limited'}. Giới hạn 20 lần sai / IP / 15 phút.
create or replace function public.learner_login_email(p_phone text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := normalize_vn_phone(p_phone);
  v_ip text := coalesce(nullif(current_setting('request.headers', true)::json ->> 'x-mcc-client-ip', ''), 'unknown');
  v_email text;
begin
  delete from private.login_failures where created_at < now() - interval '1 day';
  if (select count(*) from private.login_failures where ip = v_ip and created_at > now() - interval '15 minutes') >= 20 then
    return jsonb_build_object('error', 'rate_limited');
  end if;

  -- Tên đăng nhập của khách là số điện thoại (giữ nguyên khi được chuyển vào lớp)
  select u.email into v_email
  from student_profiles sp join auth.users u on u.id = sp.user_id
  where v_phone is not null and sp.username = v_phone
    and u.encrypted_password = extensions.crypt(coalesce(p_password, ''), u.encrypted_password);

  if v_email is null then
    insert into private.login_failures (ip) values (v_ip);
    return jsonb_build_object('error', 'invalid');
  end if;
  return jsonb_build_object('email', v_email);
end;
$$;
revoke all on function public.learner_login_email(text, text) from public;
grant execute on function public.learner_login_email(text, text) to anon, authenticated;

-- ------------------------------------------------------------------------------
-- Đặt mật khẩu mới từ link khôi phục
-- ------------------------------------------------------------------------------
-- Chỉ phiên vừa mở bằng link khôi phục (amr có method = recovery, trong 1 giờ) mới đặt được,
-- để người dùng chung máy đang đăng nhập không đổi được mật khẩu khi không biết mật khẩu cũ.
-- Trả {ok} | {ok:false, error: 'not_recovery' | 'not_student' | 'weak_password'}
create or replace function public.learner_reset_password(p_new text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) a
    where a ->> 'method' = 'recovery'
      and to_timestamp((a ->> 'timestamp')::bigint) > now() - interval '1 hour'
  ) then
    return jsonb_build_object('ok', false, 'error', 'not_recovery');
  end if;
  if not is_learner() or exists (select 1 from staff_profiles where user_id = auth.uid()) then
    return jsonb_build_object('ok', false, 'error', 'not_student');
  end if;
  if not student_password_ok(coalesce(p_new, '')) then
    return jsonb_build_object('ok', false, 'error', 'weak_password');
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(p_new, extensions.gen_salt('bf', 10)), updated_at = now()
  where id = auth.uid();
  update student_profiles set must_change_password = false where user_id = auth.uid();
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.learner_reset_password(text) from public;
grant execute on function public.learner_reset_password(text) to authenticated;

-- ------------------------------------------------------------------------------
-- Google: hồ sơ khách lần đầu đăng nhập
-- ------------------------------------------------------------------------------
-- Trả {ok} | {ok:false, error: 'not_oauth' | 'has_profile' | 'missing_name' | 'invalid_phone' | 'phone_taken' | 'no_consent'}
-- Số điện thoại không bắt buộc (email đã được Google xác minh).
create or replace function public.complete_oauth_profile(p_full_name text, p_phone text, p_consent boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user auth.users%rowtype;
  v_name text := trim(coalesce(p_full_name, ''));
  v_phone text := '';
begin
  select * into v_user from auth.users where id = auth.uid();
  if not found or coalesce(v_user.raw_app_meta_data ->> 'provider', 'email') = 'email' then
    return jsonb_build_object('ok', false, 'error', 'not_oauth');
  end if;
  if exists (select 1 from student_profiles where user_id = v_user.id)
     or exists (select 1 from staff_profiles where user_id = v_user.id) then
    return jsonb_build_object('ok', false, 'error', 'has_profile');
  end if;
  if v_name = '' or length(v_name) > 100 then
    return jsonb_build_object('ok', false, 'error', 'missing_name');
  end if;
  if trim(coalesce(p_phone, '')) <> '' then
    v_phone := normalize_vn_phone(p_phone);
    if v_phone is null then
      return jsonb_build_object('ok', false, 'error', 'invalid_phone');
    end if;
    if exists (select 1 from student_profiles where account_type = 'guest' and phone = v_phone) then
      return jsonb_build_object('ok', false, 'error', 'phone_taken');
    end if;
  end if;
  if not coalesce(p_consent, false) then
    return jsonb_build_object('ok', false, 'error', 'no_consent');
  end if;

  -- Tên đăng nhập = email (có @, không trùng tên học viên / số điện thoại)
  insert into student_profiles (user_id, username, full_name, phone, email, account_type, must_change_password, consented_at)
  values (v_user.id, lower(v_user.email), v_name, v_phone, lower(v_user.email), 'guest', false, now());
  return jsonb_build_object('ok', true);
exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'phone_taken');
end;
$$;
revoke all on function public.complete_oauth_profile(text, text, boolean) from public;
grant execute on function public.complete_oauth_profile(text, text, boolean) to authenticated;

-- ------------------------------------------------------------------------------
-- Auth hook: chỉ Google được tạo tài khoản qua Supabase Auth
-- ------------------------------------------------------------------------------
-- Tài khoản nhân sự / học viên / khách đều tạo bằng SQL (không qua Auth) nên không bị ảnh hưởng.
create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
begin
  if coalesce(event -> 'user' -> 'app_metadata' ->> 'provider', '') = 'google' then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object(
    'http_code', 403,
    'message', 'Vui lòng đăng ký trên trang web Mayo Creative Chinese.'));
end;
$$;
revoke all on function public.hook_before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
