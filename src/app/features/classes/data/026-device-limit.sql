-- ==============================================================================
-- 026 — GIỚI HẠN 3 THIẾT BỊ CHO TÀI KHOẢN HỌC VIÊN
-- ==============================================================================
-- Mỗi trình duyệt có 1 mã thiết bị ngẫu nhiên (localStorage), gửi qua header x-mcc-device
-- (api/rest.mjs chuyển tiếp). Học viên (khách + học viên lớp) dùng tối đa 3 thiết bị; nhân sự không giới hạn.
--   register_device   — ghi nhận thiết bị đang dùng (gắn với phiên đăng nhập hiện tại)
--   my_devices        — học viên xem thiết bị của mình
--   remove_my_device  — học viên tự gỡ 1 thiết bị khác, tối đa 1 lần / 30 ngày
--   student_devices / admin_remove_device — nhân sự quản lý học viên xem / gỡ bất kỳ lúc nào
-- Gỡ thiết bị = xoá phiên đăng nhập của nó (đăng xuất ngay).
-- Cổng chặn (check_rest_proxy, chạy trước mọi request REST): request của học viên CÓ header thiết bị mà
-- thiết bị chưa đăng ký với phiên hiện tại → từ chối (trừ các RPC dùng để đăng ký / gỡ).
-- Request KHÔNG có header (bản web cũ) chỉ bị chặn khi bật chế độ nghiêm (khi phát hành):
--   insert into private.settings (key, value) values ('device_limit_strict', 'on')
--   on conflict (key) do update set value = excluded.value;
-- Chạy được nhiều lần.

create table if not exists public.learner_devices (
  user_id    uuid not null references public.student_profiles(user_id) on delete cascade,
  device_id  text not null check (device_id ~ '^[A-Za-z0-9-]{16,64}$'),
  label      text not null default '' check (length(label) <= 100),
  session_id uuid,
  first_seen timestamptz not null default now(),
  last_seen  timestamptz not null default now(),
  primary key (user_id, device_id)
);

alter table public.learner_devices enable row level security;
revoke all on public.learner_devices from public, anon, authenticated;

-- Lần học viên tự gỡ thiết bị gần nhất (giới hạn 1 lần / 30 ngày)
alter table public.student_profiles add column if not exists device_removed_at timestamptz;

create or replace function private.device_limit() returns integer language sql immutable as $$ select 3 $$;

-- Mã thiết bị trong header của request hiện tại
create or replace function public.request_device()
returns text
language sql
stable
set search_path = ''
as $$
  select nullif(current_setting('request.headers', true)::json ->> 'x-mcc-device', '')
$$;

create or replace function public.request_session()
returns uuid
language sql
stable
set search_path = ''
as $$
  select nullif(current_setting('request.jwt.claims', true)::json ->> 'session_id', '')::uuid
$$;

-- Danh sách thiết bị + quyền tự gỡ của 1 học viên
create or replace function private.device_list(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'devices', coalesce((
      select jsonb_agg(jsonb_build_object(
               'device_id', d.device_id, 'label', d.label, 'first_seen', d.first_seen, 'last_seen', d.last_seen,
               'current', d.device_id = public.request_device())
             order by d.last_seen desc)
      from public.learner_devices d where d.user_id = p_user), '[]'::jsonb),
    'limit', private.device_limit(),
    'next_removal_at', (select case when sp.device_removed_at > now() - interval '30 days'
                                    then sp.device_removed_at + interval '30 days' end
                        from public.student_profiles sp where sp.user_id = p_user)
  )
$$;

-- ------------------------------------------------------------------------------
-- Học viên
-- ------------------------------------------------------------------------------
create or replace function public.register_device(p_device text, p_label text default '')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session uuid := request_session();
  v_label text := left(coalesce(trim(p_label), ''), 100);
begin
  if exists (select 1 from staff_profiles where user_id = auth.uid()) or not is_learner() then
    return jsonb_build_object('ok', true, 'exempt', true);
  end if;
  if p_device is null or p_device !~ '^[A-Za-z0-9-]{16,64}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_device');
  end if;
  if v_session is null or not exists (select 1 from auth.sessions where id = v_session and user_id = auth.uid()) then
    return jsonb_build_object('ok', false, 'error', 'no_session');
  end if;

  update learner_devices set session_id = v_session, label = v_label, last_seen = now()
  where user_id = auth.uid() and device_id = p_device;
  if found then
    return jsonb_build_object('ok', true);
  end if;

  -- Khoá theo tài khoản để 2 thiết bị đăng ký cùng lúc không vượt giới hạn
  perform 1 from student_profiles where user_id = auth.uid() for update;
  if (select count(*) from learner_devices where user_id = auth.uid()) >= private.device_limit() then
    return jsonb_build_object('ok', false, 'error', 'device_limit') || private.device_list(auth.uid());
  end if;
  insert into learner_devices (user_id, device_id, label, session_id) values (auth.uid(), p_device, v_label, v_session);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.my_devices()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when public.is_learner() then private.device_list(auth.uid()) end
$$;

-- Gỡ 1 thiết bị: xoá dòng + phiên đăng nhập của nó (thiết bị đó bị đăng xuất)
create or replace function private.drop_device(p_user uuid, p_device text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session uuid;
begin
  delete from public.learner_devices where user_id = p_user and device_id = p_device returning session_id into v_session;
  if not found then
    return false;
  end if;
  if v_session is not null then
    delete from auth.sessions where id = v_session and user_id = p_user;
  end if;
  return true;
end;
$$;

create or replace function public.remove_my_device(p_device text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_removed timestamptz;
begin
  if not is_learner() then
    return jsonb_build_object('ok', false, 'error', 'not_student');
  end if;
  if p_device = request_device() then
    return jsonb_build_object('ok', false, 'error', 'current_device');
  end if;
  select device_removed_at into v_removed from student_profiles where user_id = auth.uid() for update;
  if v_removed > now() - interval '30 days' then
    return jsonb_build_object('ok', false, 'error', 'too_soon', 'next_removal_at', v_removed + interval '30 days');
  end if;
  if not private.drop_device(auth.uid(), p_device) then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  update student_profiles set device_removed_at = now() where user_id = auth.uid();
  return jsonb_build_object('ok', true) || private.device_list(auth.uid());
end;
$$;

-- ------------------------------------------------------------------------------
-- Nhân sự
-- ------------------------------------------------------------------------------
create or replace function public.student_devices(p_student uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not can_manage_student(p_student) then
    raise exception 'Bạn không có quyền xem thiết bị của học viên này' using errcode = '42501';
  end if;
  return private.device_list(p_student);
end;
$$;

create or replace function public.admin_remove_device(p_student uuid, p_device text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile student_profiles%rowtype;
  v_label text;
begin
  if not can_manage_student(p_student) then
    raise exception 'Bạn không có quyền gỡ thiết bị của học viên này' using errcode = '42501';
  end if;
  select label into v_label from learner_devices where user_id = p_student and device_id = p_device;
  if not private.drop_device(p_student, p_device) then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  select * into v_profile from student_profiles where user_id = p_student;
  perform write_activity('update', 'student', 1,
    format('Gỡ thiết bị %s của %s', coalesce(nullif(v_label, ''), 'không tên'), v_profile.full_name),
    jsonb_build_object('student', p_student, 'device', p_device));
  return jsonb_build_object('ok', true) || private.device_list(p_student);
end;
$$;

revoke all on function public.register_device(text, text), public.my_devices(), public.remove_my_device(text),
  public.student_devices(uuid), public.admin_remove_device(uuid, text) from public;
grant execute on function public.register_device(text, text), public.my_devices(), public.remove_my_device(text),
  public.student_devices(uuid), public.admin_remove_device(uuid, text) to authenticated;
grant execute on function public.request_device(), public.request_session() to anon, authenticated;

-- ------------------------------------------------------------------------------
-- Cổng chặn trước mỗi request (giữ nguyên phần anon của 015)
-- ------------------------------------------------------------------------------
create or replace function public.check_rest_proxy()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_secret text;
  v_device text;
  v_path text;
begin
  if coalesce(current_setting('request.jwt.claims', true)::json ->> 'role', 'anon') = 'anon' then
    select value into v_secret from private.settings where key = 'proxy_secret';
    if v_secret is not null
       and coalesce(current_setting('request.headers', true)::json ->> 'x-mcc-proxy', '') <> v_secret then
      raise insufficient_privilege using message = 'Direct API access is not allowed';
    end if;
    return;
  end if;

  -- Đã đăng nhập: chỉ giới hạn học viên (nhân sự, tài khoản Google chưa có hồ sơ thì bỏ qua)
  if exists (select 1 from public.staff_profiles where user_id = auth.uid())
     or not exists (select 1 from public.student_profiles where user_id = auth.uid() and status = 'active') then
    return;
  end if;

  v_device := public.request_device();
  if v_device is null and not exists (select 1 from private.settings where key = 'device_limit_strict' and value = 'on') then
    return;
  end if;

  -- Các RPC để đăng ký / xem / gỡ thiết bị và nạp ngữ cảnh đăng nhập luôn được gọi
  v_path := coalesce(current_setting('request.path', true), '');
  if v_path in ('/rpc/register_device', '/rpc/my_devices', '/rpc/remove_my_device',
                '/rpc/my_student_context', '/rpc/my_staff_context', '/rpc/log_self_event') then
    return;
  end if;

  if not exists (
    select 1 from public.learner_devices d
    where d.user_id = auth.uid() and d.device_id = v_device and d.session_id = public.request_session()
  ) then
    raise exception 'device_not_registered' using errcode = 'PT403', hint = 'Thiết bị chưa được đăng ký cho tài khoản này';
  end if;
end;
$$;

revoke all on function public.check_rest_proxy() from public;
grant execute on function public.check_rest_proxy() to anon, authenticated;
