-- ==============================================================================
-- 020 — QUẢN LÝ VAI TRÒ & TÀI KHOẢN NHÂN SỰ TRÊN GIAO DIỆN
-- ==============================================================================
--   permissions          — danh mục quyền (role_permissions.permission tham chiếu bảng này)
--   staff_profiles.status — active / locked (khoá = chặn đăng nhập, mất mọi quyền ngay)
--
-- Quyền mới:
--   role.manage — tạo / sửa / xoá vai trò, đổi vai trò, tạo và khoá tài khoản nhân sự (admin)
--
-- Chốt an toàn: không tự đổi vai trò / tự khoá mình, không bỏ role.manage khỏi vai trò
-- của chính mình → luôn còn ít nhất 1 người phân quyền được.
-- Chạy được nhiều lần.

-- ------------------------------------------------------------------------------
-- Danh mục quyền
-- ------------------------------------------------------------------------------
create table if not exists public.permissions (
  id          text primary key,
  label       text not null,
  description text not null default '',
  grp         text not null,
  sort_order  smallint not null default 0
);

insert into public.permissions (id, label, description, grp, sort_order) values
  ('content.read',   'Xem nội dung',            'Xem mọi đề thi, từ vựng kể cả bản nháp trong khu quản trị.', 'content', 1),
  ('content.create', 'Thêm nội dung',           'Tạo đề thi, thêm từ vựng, tải file lên.', 'content', 2),
  ('content.update', 'Sửa nội dung',            'Sửa đề thi, từ vựng và đổi trạng thái hiển thị.', 'content', 3),
  ('content.delete', 'Xoá nội dung',            'Xoá đề thi, từ vựng, file.', 'content', 4),
  ('class.manage',   'Quản lý lớp phụ trách',   'Tạo lớp, sửa và lưu trữ lớp mình có tên.', 'class', 10),
  ('class.all',      'Quản lý mọi lớp',         'Thấy và sửa mọi lớp học.', 'class', 11),
  ('class.delete',   'Xoá hẳn lớp',             'Xoá vĩnh viễn lớp học.', 'class', 12),
  ('student.manage', 'Quản lý học viên',        'Tạo tài khoản, chuyển lớp, khoá, đặt lại mật khẩu học viên.', 'class', 13),
  ('student.delete', 'Xoá hẳn học viên',        'Xoá vĩnh viễn tài khoản học viên.', 'class', 14),
  ('staff.manage',   'Xem nhân sự',             'Xem danh sách nhân sự, đặt lại mật khẩu nhân sự.', 'admin', 20),
  ('role.manage',    'Phân quyền',              'Sửa vai trò, tạo và khoá tài khoản nhân sự.', 'admin', 21),
  ('activity.read',  'Xem nhật ký hoạt động',   'Xem ai đã làm gì, khi nào.', 'admin', 22)
on conflict (id) do update set label = excluded.label, description = excluded.description,
  grp = excluded.grp, sort_order = excluded.sort_order;

-- Quyền lạ (nếu có) vẫn giữ được để thêm khoá ngoại
insert into public.permissions (id, label, grp, sort_order)
select distinct rp.permission, rp.permission, 'other', 99
from public.role_permissions rp
where not exists (select 1 from public.permissions p where p.id = rp.permission);

alter table public.role_permissions drop constraint if exists role_permissions_permission_fkey;
alter table public.role_permissions add constraint role_permissions_permission_fkey
  foreign key (permission) references public.permissions(id) on delete cascade;

insert into public.role_permissions (role_id, permission) values ('admin', 'role.manage')
on conflict do nothing;

alter table public.permissions enable row level security;
drop policy if exists "permissions read" on public.permissions;
create policy "permissions read" on public.permissions for select to authenticated using (true);
revoke all on public.permissions from anon;
revoke insert, update, delete, truncate on public.permissions from authenticated;
grant select on public.permissions to authenticated;

-- ------------------------------------------------------------------------------
-- Trạng thái tài khoản nhân sự
-- ------------------------------------------------------------------------------
alter table public.staff_profiles add column if not exists status text not null default 'active';
alter table public.staff_profiles drop constraint if exists staff_profiles_status_check;
alter table public.staff_profiles add constraint staff_profiles_status_check check (status in ('active', 'locked'));

-- Tài khoản bị khoá mất quyền ngay (kể cả access token còn hạn)
create or replace function public.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_profiles s
    join public.role_permissions rp on rp.role_id = s.role_id
    where s.user_id = auth.uid() and s.status = 'active' and rp.permission = p_permission
  )
$$;

create or replace function public.my_staff_context()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'username', s.username,
    'full_name', s.full_name,
    'role', r.id,
    'role_label', r.label,
    'role_description', r.description,
    'permissions', coalesce((select jsonb_agg(rp.permission order by rp.permission)
                             from public.role_permissions rp where rp.role_id = r.id), '[]'::jsonb)
  )
  from public.staff_profiles s
  join public.roles r on r.id = s.role_id
  where s.user_id = auth.uid() and s.status = 'active'
$$;

-- Nhật ký: đổi họ tên / vai trò (hiện tên vai trò) / khoá – mở khoá
create or replace function public.log_staff_profile_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.full_name is distinct from old.full_name then
    perform write_activity('update', 'staff', 1, format('Đổi họ tên %s thành “%s”', new.username, new.full_name),
      jsonb_build_object('user_id', new.user_id, 'username', new.username, 'from', old.full_name, 'to', new.full_name));
  end if;
  if new.role_id is distinct from old.role_id then
    perform write_activity('update', 'staff', 1,
      format('Đổi vai trò %s: %s → %s', new.username,
             coalesce((select label from roles where id = old.role_id), old.role_id),
             coalesce((select label from roles where id = new.role_id), new.role_id)),
      jsonb_build_object('user_id', new.user_id, 'username', new.username, 'from', old.role_id, 'to', new.role_id));
  end if;
  if new.status is distinct from old.status then
    perform write_activity(case new.status when 'locked' then 'lock' else 'unlock' end, 'staff', 1,
      format('%s tài khoản nhân sự %s', case new.status when 'locked' then 'Khoá' else 'Mở khoá' end, new.username),
      jsonb_build_object('user_id', new.user_id, 'username', new.username));
  end if;
  return null;
end;
$$;

-- ------------------------------------------------------------------------------
-- Vai trò: tạo / sửa / xoá
-- ------------------------------------------------------------------------------
-- p_role: {id, label, description, permissions: [..], create: bool}
create or replace function public.save_role(p_role jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := lower(trim(coalesce(p_role ->> 'id', '')));
  v_label text := trim(coalesce(p_role ->> 'label', ''));
  v_description text := trim(coalesce(p_role ->> 'description', ''));
  v_create boolean := coalesce((p_role ->> 'create')::boolean, false);
  v_perms text[] := array(select distinct jsonb_array_elements_text(coalesce(p_role -> 'permissions', '[]'::jsonb)));
  v_old text[];
  v_added text[];
  v_removed text[];
begin
  if not has_permission('role.manage') then
    raise exception 'Bạn không có quyền phân quyền' using errcode = '42501';
  end if;
  if v_id !~ '^[a-z][a-z0-9_]{1,30}$' then
    raise exception 'Mã vai trò không hợp lệ' using errcode = '22023';
  end if;
  if v_label = '' or length(v_label) > 60 then
    raise exception 'Cần nhập tên vai trò (tối đa 60 ký tự)' using errcode = '22023';
  end if;
  if exists (select 1 from unnest(v_perms) p where not exists (select 1 from permissions where id = p)) then
    raise exception 'Có quyền không hợp lệ' using errcode = '22023';
  end if;
  if exists (select 1 from roles where lower(label) = lower(v_label) and id <> v_id) then
    raise exception 'Tên vai trò “%” đã có', v_label using errcode = '23505';
  end if;

  if v_create then
    if exists (select 1 from roles where id = v_id) then
      raise exception 'Mã vai trò % đã có', v_id using errcode = '23505';
    end if;
    insert into roles (id, label, description, sort_order)
    values (v_id, v_label, v_description, coalesce((select max(sort_order) from roles), 0) + 1);
    v_old := '{}';
  else
    update roles set label = v_label, description = v_description where id = v_id;
    if not found then
      raise exception 'Không tìm thấy vai trò' using errcode = 'P0002';
    end if;
    v_old := array(select permission from role_permissions where role_id = v_id);
  end if;

  if 'role.manage' <> all (v_perms)
     and exists (select 1 from staff_profiles where user_id = auth.uid() and role_id = v_id) then
    raise exception 'Không thể bỏ quyền Phân quyền khỏi vai trò của chính bạn' using errcode = '42501';
  end if;

  delete from role_permissions where role_id = v_id and permission <> all (v_perms);
  insert into role_permissions (role_id, permission) select v_id, p from unnest(v_perms) p on conflict do nothing;

  v_added := array(select p from unnest(v_perms) p where p <> all (v_old));
  v_removed := array(select p from unnest(v_old) p where p <> all (v_perms));
  perform write_activity(case when v_create then 'create' else 'update' end, 'role', 1,
    case when v_create then format('Tạo vai trò “%s”', v_label)
         else format('Cập nhật vai trò “%s”', v_label) end,
    jsonb_build_object('role_id', v_id, 'added', to_jsonb(v_added), 'removed', to_jsonb(v_removed)));
  return v_id;
end;
$$;

create or replace function public.delete_role(p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role roles%rowtype;
begin
  if not has_permission('role.manage') then
    raise exception 'Bạn không có quyền phân quyền' using errcode = '42501';
  end if;
  if p_id = 'admin' then
    raise exception 'Không xoá được vai trò Quản trị viên' using errcode = '42501';
  end if;
  if exists (select 1 from staff_profiles where role_id = p_id) then
    raise exception 'Vai trò còn nhân sự, hãy chuyển họ sang vai trò khác trước' using errcode = '23503';
  end if;
  delete from roles where id = p_id returning * into v_role;
  if not found then
    raise exception 'Không tìm thấy vai trò' using errcode = 'P0002';
  end if;
  perform write_activity('delete', 'role', 1, format('Xoá vai trò “%s”', v_role.label), jsonb_build_object('role_id', p_id));
end;
$$;

-- ------------------------------------------------------------------------------
-- Nhân sự: đổi vai trò / khoá / tạo tài khoản
-- ------------------------------------------------------------------------------
create or replace function public.set_staff_role(p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_permission('role.manage') then
    raise exception 'Bạn không có quyền phân quyền' using errcode = '42501';
  end if;
  if p_user = auth.uid() then
    raise exception 'Không thể tự đổi vai trò của mình' using errcode = '42501';
  end if;
  if not exists (select 1 from roles where id = p_role) then
    raise exception 'Không tìm thấy vai trò' using errcode = 'P0002';
  end if;
  update staff_profiles set role_id = p_role where user_id = p_user;
  if not found then
    raise exception 'Không tìm thấy nhân sự' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.set_staff_status(p_user uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_permission('role.manage') then
    raise exception 'Bạn không có quyền phân quyền' using errcode = '42501';
  end if;
  if p_status not in ('active', 'locked') then
    raise exception 'Trạng thái không hợp lệ' using errcode = '22023';
  end if;
  if p_user = auth.uid() then
    raise exception 'Không thể tự khoá tài khoản của mình' using errcode = '42501';
  end if;
  update staff_profiles set status = p_status where user_id = p_user;
  if not found then
    raise exception 'Không tìm thấy nhân sự' using errcode = 'P0002';
  end if;

  update auth.users
  set banned_until = case when p_status = 'active' then null else 'infinity'::timestamptz end, updated_at = now()
  where id = p_user;
  if p_status = 'locked' then
    delete from auth.refresh_tokens where user_id = p_user::text;
    delete from auth.sessions where user_id = p_user;
  end if;
end;
$$;

create or replace function public.staff_password_ok(p_password text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select length(p_password) >= 15
     and p_password ~ '[a-z]' and p_password ~ '[A-Z]' and p_password ~ '[0-9]'
     and p_password ~ '[^A-Za-z0-9[:space:]]'
$$;

-- p_data: {username, full_name, role_id, password}. Mật khẩu do client tạo và hiện 1 lần, DB chỉ lưu bản băm.
-- Email đăng nhập nội bộ: <tên đăng nhập viết thường>@mayocreativechinese.edu.vn (khớp AuthService)
create or replace function public.create_staff(p_data jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text := trim(coalesce(p_data ->> 'username', ''));
  v_name text := trim(coalesce(p_data ->> 'full_name', ''));
  v_role text := coalesce(p_data ->> 'role_id', '');
  v_password text := coalesce(p_data ->> 'password', '');
  v_email text;
  v_id uuid;
begin
  if not has_permission('role.manage') then
    raise exception 'Bạn không có quyền tạo tài khoản nhân sự' using errcode = '42501';
  end if;
  if v_username !~ '^[A-Za-z][A-Za-z0-9]{1,29}$' then
    raise exception 'Tên đăng nhập chỉ gồm chữ không dấu và số, 2–30 ký tự' using errcode = '22023';
  end if;
  if v_name = '' then
    raise exception 'Cần nhập họ tên' using errcode = '22023';
  end if;
  if not exists (select 1 from roles where id = v_role) then
    raise exception 'Không tìm thấy vai trò' using errcode = 'P0002';
  end if;
  if not staff_password_ok(v_password) then
    raise exception 'Mật khẩu chưa đáp ứng đủ yêu cầu' using errcode = '22023';
  end if;

  v_email := lower(v_username) || '@mayocreativechinese.edu.vn';
  if exists (select 1 from staff_profiles where lower(username) = lower(v_username))
     or exists (select 1 from student_profiles where lower(username) = lower(v_username))
     or exists (select 1 from auth.users where email = v_email) then
    raise exception 'Tên đăng nhập % đã được dùng', v_username using errcode = '23505';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', v_email,
    extensions.crypt(v_password, extensions.gen_salt('bf', 10)), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('username', v_username, 'full_name', v_name), now(), now(),
    '', '', '', ''
  )
  returning id into v_id;

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
          jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
          'email', now(), now(), now());

  insert into staff_profiles (user_id, username, full_name, role_id) values (v_id, v_username, v_name, v_role);

  perform write_activity('create', 'staff', 1,
    format('Tạo tài khoản nhân sự %s (%s) – %s', v_username, v_name, (select label from roles where id = v_role)),
    jsonb_build_object('user_id', v_id, 'username', v_username, 'role_id', v_role));
  return v_id;
end;
$$;

revoke all on function public.save_role(jsonb), public.delete_role(text), public.set_staff_role(uuid, text),
  public.set_staff_status(uuid, text), public.create_staff(jsonb) from public, anon;
grant execute on function public.save_role(jsonb), public.delete_role(text), public.set_staff_role(uuid, text),
  public.set_staff_status(uuid, text), public.create_staff(jsonb) to authenticated;
revoke all on function public.staff_password_ok(text) from public, anon, authenticated;
