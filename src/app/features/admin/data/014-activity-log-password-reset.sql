-- ==============================================================================
-- 014 — NHẬT KÝ HOẠT ĐỘNG + ĐẶT LẠI MẬT KHẨU NHÂN SỰ
-- ==============================================================================
-- activity_log chỉ được ghi bởi trigger / hàm SECURITY DEFINER trong DB, người dùng
-- không thêm/sửa/xoá được qua API. Đọc cần quyền activity.read (013).
-- Trigger theo câu lệnh (statement-level): nhập 500 từ = 1 dòng nhật ký.

create table if not exists public.activity_log (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  actor_id       uuid references auth.users(id) on delete set null,
  actor_username text,
  action         text not null,
  entity_type    text not null,
  entity_count   integer not null default 1,
  summary        text not null,
  details        jsonb not null default '{}'::jsonb
);

create index if not exists idx_activity_created on public.activity_log (created_at desc);
create index if not exists idx_activity_actor on public.activity_log (actor_id, created_at desc);
create index if not exists idx_activity_entity on public.activity_log (entity_type, created_at desc);

alter table public.activity_log enable row level security;
drop policy if exists "activity_log read" on public.activity_log;
create policy "activity_log read" on public.activity_log for select to authenticated
  using ((select public.has_permission('activity.read')));

revoke all on public.activity_log from anon;
revoke insert, update, delete, truncate on public.activity_log from authenticated;
grant select on public.activity_log to authenticated;

-- Ghi 1 dòng nhật ký cho người đang gọi (không cấp cho client)
create or replace function public.write_activity(
  p_action text, p_entity_type text, p_count integer, p_summary text, p_details jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.activity_log (actor_id, actor_username, action, entity_type, entity_count, summary, details)
  values (
    auth.uid(),
    (select username from public.staff_profiles where user_id = auth.uid()),
    p_action, p_entity_type, p_count, p_summary, coalesce(p_details, '{}'::jsonb)
  )
$$;
revoke all on function public.write_activity(text, text, integer, text, jsonb) from public, anon, authenticated;

-- Các cột khác nhau giữa 2 bản ghi (bỏ qua cột thời gian)
create or replace function public.changed_columns(p_old jsonb, p_new jsonb)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(n.key order by n.key), '{}')
  from jsonb_each(p_new) n
  where n.key not in ('created_at', 'updated_at')
    and p_old -> n.key is distinct from n.value
$$;

-- ------------------------------------------------------------------------------
-- Trigger: exams
-- ------------------------------------------------------------------------------
create or replace function public.log_exams_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_items jsonb;
  v_title text;
  v_changed text[];
  v_action text;
  v_summary text;
begin
  if tg_op = 'INSERT' then
    select count(*), (array_agg(title))[1] into v_count, v_title from new_rows;
    if v_count = 0 then return null; end if;
    select jsonb_agg(jsonb_build_object('id', id, 'title', title)) into v_items from (select id, title from new_rows limit 20) x;
    perform write_activity('create', 'exam', v_count,
      case when v_count = 1 then format('Tạo đề thi “%s”', v_title) else format('Tạo %s đề thi', v_count) end,
      jsonb_build_object('items', v_items));

  elsif tg_op = 'DELETE' then
    select count(*), (array_agg(title))[1] into v_count, v_title from old_rows;
    if v_count = 0 then return null; end if;
    select jsonb_agg(jsonb_build_object('id', id, 'title', title)) into v_items from (select id, title from old_rows limit 20) x;
    perform write_activity('delete', 'exam', v_count,
      case when v_count = 1 then format('Xoá đề thi “%s”', v_title) else format('Xoá %s đề thi', v_count) end,
      jsonb_build_object('items', v_items));

  else
    select count(*) into v_count from new_rows;
    if v_count = 0 then return null; end if;
    select jsonb_agg(jsonb_build_object('id', n.id, 'title', n.title,
             'changed', changed_columns(to_jsonb(o), to_jsonb(n))))
      into v_items
      from (select * from new_rows limit 20) n join old_rows o on o.id = n.id;

    if v_count = 1 then
      select n.title, changed_columns(to_jsonb(o), to_jsonb(n)) into v_title, v_changed
      from new_rows n join old_rows o on o.id = n.id;
      if v_changed = array['is_published'] then
        v_action := case when (select is_published from new_rows) then 'publish' else 'unpublish' end;
        v_summary := case when v_action = 'publish' then format('Xuất bản đề thi “%s”', v_title)
                          else format('Chuyển đề thi “%s” về bản nháp', v_title) end;
      elsif cardinality(v_changed) = 0 then
        v_action := 'update';
        v_summary := format('Lưu nội dung đề thi “%s”', v_title);
      else
        v_action := 'update';
        v_summary := format('Cập nhật đề thi “%s”', v_title);
      end if;
    else
      v_action := 'update';
      v_summary := format('Cập nhật %s đề thi', v_count);
    end if;
    perform write_activity(v_action, 'exam', v_count, v_summary, jsonb_build_object('items', v_items));
  end if;
  return null;
end;
$$;

drop trigger if exists trg_log_exams_insert on public.exams;
drop trigger if exists trg_log_exams_update on public.exams;
drop trigger if exists trg_log_exams_delete on public.exams;
create trigger trg_log_exams_insert after insert on public.exams
  referencing new table as new_rows for each statement execute function public.log_exams_change();
create trigger trg_log_exams_update after update on public.exams
  referencing old table as old_rows new table as new_rows for each statement execute function public.log_exams_change();
create trigger trg_log_exams_delete after delete on public.exams
  referencing old table as old_rows for each statement execute function public.log_exams_change();

-- ------------------------------------------------------------------------------
-- Trigger: vocab_cards
-- ------------------------------------------------------------------------------
create or replace function public.log_vocab_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_items jsonb;
  v_first record;
  v_verb text := case tg_op when 'INSERT' then 'Thêm' when 'UPDATE' then 'Sửa' else 'Xoá' end;
  v_action text := case tg_op when 'INSERT' then 'create' when 'UPDATE' then 'update' else 'delete' end;
begin
  if tg_op = 'DELETE' then
    select count(*) into v_count from old_rows;
    if v_count = 0 then return null; end if;
    select * into v_first from old_rows limit 1;
    select jsonb_agg(jsonb_build_object('id', id, 'hanzi', hanzi, 'meaning', meaning, 'collection', collection, 'hsk_level', hsk_level))
      into v_items from (select * from old_rows limit 20) x;
  elsif tg_op = 'INSERT' then
    select count(*) into v_count from new_rows;
    if v_count = 0 then return null; end if;
    select * into v_first from new_rows limit 1;
    select jsonb_agg(jsonb_build_object('id', id, 'hanzi', hanzi, 'meaning', meaning, 'collection', collection, 'hsk_level', hsk_level))
      into v_items from (select * from new_rows limit 20) x;
  else
    select count(*) into v_count from new_rows;
    if v_count = 0 then return null; end if;
    select * into v_first from new_rows limit 1;
    select jsonb_agg(jsonb_build_object('id', n.id, 'hanzi', n.hanzi, 'meaning', n.meaning, 'collection', n.collection,
             'hsk_level', n.hsk_level, 'changed', changed_columns(to_jsonb(o), to_jsonb(n))))
      into v_items from (select * from new_rows limit 20) n join old_rows o on o.id = n.id;
  end if;

  perform write_activity(v_action, 'vocab', v_count,
    case when v_count = 1
      then format('%s từ “%s” (%s) — %s cấp %s', v_verb, v_first.hanzi, v_first.meaning, v_first.collection, v_first.hsk_level)
      else format('%s %s từ vựng', v_verb, v_count) end,
    jsonb_build_object('items', v_items));
  return null;
end;
$$;

drop trigger if exists trg_log_vocab_insert on public.vocab_cards;
drop trigger if exists trg_log_vocab_update on public.vocab_cards;
drop trigger if exists trg_log_vocab_delete on public.vocab_cards;
create trigger trg_log_vocab_insert after insert on public.vocab_cards
  referencing new table as new_rows for each statement execute function public.log_vocab_change();
create trigger trg_log_vocab_update after update on public.vocab_cards
  referencing old table as old_rows new table as new_rows for each statement execute function public.log_vocab_change();
create trigger trg_log_vocab_delete after delete on public.vocab_cards
  referencing old table as old_rows for each statement execute function public.log_vocab_change();

-- ------------------------------------------------------------------------------
-- Trigger: staff_profiles (đổi họ tên / vai trò)
-- ------------------------------------------------------------------------------
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
    perform write_activity('update', 'staff', 1, format('Đổi vai trò %s: %s → %s', new.username, old.role_id, new.role_id),
      jsonb_build_object('user_id', new.user_id, 'username', new.username, 'from', old.role_id, 'to', new.role_id));
  end if;
  return null;
end;
$$;

drop trigger if exists trg_log_staff_profile on public.staff_profiles;
create trigger trg_log_staff_profile after update on public.staff_profiles
  for each row execute function public.log_staff_profile_change();

-- ------------------------------------------------------------------------------
-- Sự kiện tài khoản do client báo (chỉ ghi cho chính người gọi)
-- ------------------------------------------------------------------------------
create or replace function public.log_self_event(p_action text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_action not in ('login', 'password_change') then
    raise exception 'Sự kiện không hợp lệ' using errcode = '22023';
  end if;
  if not exists (select 1 from staff_profiles where user_id = auth.uid()) then
    return;
  end if;
  perform write_activity(p_action, 'auth', 1,
    case p_action when 'login' then 'Đăng nhập' else 'Tự đổi mật khẩu' end);
end;
$$;
revoke all on function public.log_self_event(text) from public, anon;
grant execute on function public.log_self_event(text) to authenticated;

-- ------------------------------------------------------------------------------
-- Đặt lại mật khẩu cho nhân sự (cần staff.manage + nhập lại mật khẩu của chính mình)
-- Trả jsonb {ok, error} thay vì raise để lần nhập sai vẫn được ghi nhật ký.
-- ------------------------------------------------------------------------------
create or replace function public.admin_reset_staff_password(p_target uuid, p_admin_password text, p_new_password text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target staff_profiles%rowtype;
  v_recent_failures integer;
begin
  if not has_permission('staff.manage') then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  select count(*) into v_recent_failures
  from activity_log
  where actor_id = auth.uid() and action = 'password_reset_failed' and created_at > now() - interval '15 minutes';
  if v_recent_failures >= 5 then
    return jsonb_build_object('ok', false, 'error', 'too_many_attempts');
  end if;

  select * into v_target from staff_profiles where user_id = p_target;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if p_target = auth.uid() then
    return jsonb_build_object('ok', false, 'error', 'self');
  end if;
  if exists (select 1 from role_permissions where role_id = v_target.role_id and permission = 'staff.manage') then
    return jsonb_build_object('ok', false, 'error', 'target_is_admin');
  end if;

  if not exists (
    select 1 from auth.users
    where id = auth.uid() and encrypted_password = extensions.crypt(p_admin_password, encrypted_password)
  ) then
    perform write_activity('password_reset_failed', 'staff', 1,
      format('Nhập sai mật khẩu quản trị khi đặt lại mật khẩu cho %s', v_target.username),
      jsonb_build_object('user_id', v_target.user_id, 'username', v_target.username));
    return jsonb_build_object('ok', false, 'error', 'wrong_admin_password');
  end if;

  if length(p_new_password) < 15
     or p_new_password !~ '[a-z]' or p_new_password !~ '[A-Z]' or p_new_password !~ '[0-9]'
     or p_new_password !~ '[^A-Za-z0-9[:space:]]' then
    return jsonb_build_object('ok', false, 'error', 'weak_password');
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)),
      updated_at = now()
  where id = p_target;

  -- Đăng xuất mọi phiên đang mở của người được đặt lại
  delete from auth.refresh_tokens where user_id = p_target::text;
  delete from auth.sessions where user_id = p_target;

  perform write_activity('password_reset', 'staff', 1,
    format('Đặt lại mật khẩu cho %s', v_target.username),
    jsonb_build_object('user_id', v_target.user_id, 'username', v_target.username));

  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.admin_reset_staff_password(uuid, text, text) from public, anon;
grant execute on function public.admin_reset_staff_password(uuid, text, text) to authenticated;

-- ------------------------------------------------------------------------------
-- Tổng hợp cho dashboard
-- ------------------------------------------------------------------------------
create or replace function public.activity_summary(p_days integer default 7)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_since timestamptz := date_trunc('day', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh'
                         - make_interval(days => greatest(p_days, 1) - 1);
begin
  if not has_permission('activity.read') then
    raise exception 'Bạn không có quyền xem nhật ký' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'since', v_since,
    'total', (select count(*) from activity_log where created_at >= v_since),
    'today', (select count(*) from activity_log
              where created_at >= date_trunc('day', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh'),
    'active_staff', (select count(distinct actor_id) from activity_log where created_at >= v_since and actor_id is not null),
    'by_action', coalesce((select jsonb_agg(jsonb_build_object('action', action, 'count', c) order by c desc)
                           from (select action, count(*) c from activity_log where created_at >= v_since group by action) a), '[]'::jsonb),
    'by_actor', coalesce((select jsonb_agg(jsonb_build_object('username', coalesce(actor_username, 'Hệ thống'), 'full_name', full_name, 'count', c) order by c desc)
                          from (select l.actor_username, max(s.full_name) full_name, count(*) c
                                from activity_log l left join staff_profiles s on s.user_id = l.actor_id
                                where l.created_at >= v_since group by l.actor_username) a), '[]'::jsonb),
    'by_day', coalesce((select jsonb_agg(jsonb_build_object('day', d::date, 'count', coalesce(c, 0)) order by d)
                        from generate_series((v_since at time zone 'Asia/Ho_Chi_Minh')::date,
                                             (now() at time zone 'Asia/Ho_Chi_Minh')::date, interval '1 day') d
                        left join (select (created_at at time zone 'Asia/Ho_Chi_Minh')::date as day, count(*) as c
                                   from activity_log where created_at >= v_since group by 1) x on x.day = d::date), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.activity_summary(integer) from public, anon;
grant execute on function public.activity_summary(integer) to authenticated;
