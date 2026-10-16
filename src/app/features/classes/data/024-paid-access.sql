-- ==============================================================================
-- 024 — MỨC "THÀNH VIÊN" / "TRẢ PHÍ" + QUYỀN TRUY CẬP CÓ THỜI HẠN
-- ==============================================================================
-- Mức hiển thị mới cho đề thi và cấp từ vựng:
--   members (Thành viên) — mọi tài khoản học viên đang hoạt động (khách tự đăng ký + học viên lớp)
--   paid    (Trả phí)    — học viên lớp đang hoạt động + tài khoản được cấp quyền module còn hạn
-- Quyền cấp theo cả module: 'flashcards' (mọi cấp từ vựng Trả phí) hoặc 'exams' (mọi đề Trả phí),
-- có hạn (expires_at) hoặc không thời hạn (null). Nhân sự có quyền access.manage cấp / thu hồi.
-- Đề "Công khai" vẫn mở cho khách chưa đăng nhập ở tầng CSDL tới khi áp 024b (bản www cũ còn cho
-- làm đề không cần đăng nhập). Chạy được nhiều lần.

-- ------------------------------------------------------------------------------
-- Mức hiển thị
-- ------------------------------------------------------------------------------
alter table public.exams drop constraint if exists exams_visibility_check;
alter table public.exams add constraint exams_visibility_check
  check (visibility in ('private', 'staff', 'students', 'paid', 'members', 'public'));

alter table public.vocab_level_visibility drop constraint if exists vocab_level_visibility_visibility_check;
alter table public.vocab_level_visibility add constraint vocab_level_visibility_visibility_check
  check (visibility in ('private', 'staff', 'students', 'paid', 'members', 'public'));

create or replace function public.visibility_label(p_visibility text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_visibility
    when 'public' then 'Công khai' when 'members' then 'Thành viên' when 'paid' then 'Trả phí'
    when 'students' then 'Học viên' when 'staff' then 'Nội bộ' else 'Bản nháp' end
$$;

-- Hành động ghi nhật ký khi đổi mức hiển thị
create or replace function public.visibility_action(p_visibility text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_visibility
    when 'public' then 'publish' when 'members' then 'members_only' when 'paid' then 'paid_only'
    when 'students' then 'students_only' when 'staff' then 'staff_only' else 'unpublish' end
$$;

-- ------------------------------------------------------------------------------
-- Quyền cấp / thu hồi
-- ------------------------------------------------------------------------------
insert into public.permissions (id, label, description, grp, sort_order) values
  ('access.manage', 'Cấp quyền nội dung trả phí', 'Cấp, gia hạn, thu hồi quyền Flashcards / Đề thi HSK cho tài khoản học viên.', 'class', 15)
on conflict (id) do update set label = excluded.label, description = excluded.description,
  grp = excluded.grp, sort_order = excluded.sort_order;
insert into public.role_permissions (role_id, permission) values ('admin', 'access.manage')
on conflict do nothing;

-- ------------------------------------------------------------------------------
-- Bảng quyền truy cập (1 dòng / tài khoản / module; hết hạn vẫn giữ để biết lần cấp gần nhất)
-- ------------------------------------------------------------------------------
create table if not exists public.access_grants (
  user_id    uuid not null references public.student_profiles(user_id) on delete cascade,
  module     text not null check (module in ('flashcards', 'exams')),
  expires_at timestamptz,
  note       text not null default '' check (length(note) <= 500),
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, module)
);

alter table public.access_grants enable row level security;
drop policy if exists "access_grants read" on public.access_grants;
create policy "access_grants read" on public.access_grants for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.has_permission('access.manage'))
    or (select public.has_permission('student.manage'))
  );
revoke all on public.access_grants from anon;
revoke insert, update, delete, truncate on public.access_grants from authenticated;
grant select on public.access_grants to authenticated;

-- Người đang đăng nhập mở được nội dung Trả phí của module này không
create or replace function public.has_access(p_module text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_permission('content.read')
      or public.is_student()
      or (public.is_learner() and exists (
            select 1 from public.access_grants g
            where g.user_id = auth.uid() and g.module = p_module
              and (g.expires_at is null or g.expires_at > now())))
$$;
revoke all on function public.has_access(text) from public;
grant execute on function public.has_access(text) to anon, authenticated;

-- ------------------------------------------------------------------------------
-- Đề thi
-- ------------------------------------------------------------------------------
create or replace function public.can_view_exam(p_exam_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.exams e
    where e.id = p_exam_id
      and (
        e.visibility = 'public'
        or public.has_permission('content.read')
        or (e.visibility = 'members' and public.is_learner())
        or (e.visibility = 'paid' and public.has_access('exams'))
        or (e.visibility = 'students' and public.is_student())
        or (e.visibility = 'staff' and exists (
              select 1 from public.class_suggestions cs
              where cs.kind = 'exam' and cs.exam_id = e.id and cs.class_id = public.my_class_id()))
      )
  )
$$;

-- Khách đọc được dòng exams của đề có khoá (để hiện thẻ khoá), không đọc được câu hỏi
drop policy if exists "exams read" on public.exams;
create policy "exams read" on public.exams for select
  using (visibility in ('staff', 'students', 'paid', 'members', 'public') or (select public.has_permission('content.read')));

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
  v_visibility text;
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
             'changed', array_remove(changed_columns(to_jsonb(o), to_jsonb(n)), 'is_published')))
      into v_items
      from (select * from new_rows limit 20) n join old_rows o on o.id = n.id;

    if v_count = 1 then
      select n.title, n.visibility, array_remove(changed_columns(to_jsonb(o), to_jsonb(n)), 'is_published')
        into v_title, v_visibility, v_changed
      from new_rows n join old_rows o on o.id = n.id;
      if v_changed = array['visibility'] then
        v_action := visibility_action(v_visibility);
        v_summary := format('Đổi đề thi “%s” sang %s', v_title, visibility_label(v_visibility));
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

-- ------------------------------------------------------------------------------
-- Từ vựng
-- ------------------------------------------------------------------------------
drop policy if exists "vocab_cards read" on public.vocab_cards;
create policy "vocab_cards read" on public.vocab_cards for select
  using (
    (select public.has_permission('content.read'))
    or not exists (
      select 1 from public.vocab_level_visibility v
      where v.collection = vocab_cards.collection
        and v.hsk_level = vocab_cards.hsk_level
        and v.visibility <> 'public'
        and not (v.visibility = 'members' and (select public.is_learner()))
        and not (v.visibility = 'paid' and (select public.has_access('flashcards')))
        and not (v.visibility = 'students' and (select public.is_student()))
        and not (v.visibility = 'staff' and public.my_class_suggests_vocab(v.collection, v.hsk_level))
    )
  );

create or replace function public.set_vocab_visibility(p_collection text, p_levels smallint[], p_visibility text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_label text := case p_collection
    when 'hsk2' then 'HSK 2.0' when 'hsk3' then 'HSK 3.0' when 'combined' then 'HSK 1-9' else 'Bổ sung 2.0 → 3.0' end;
  v_levels text := case when cardinality(p_levels) > 1
    then format('%s-%s', (select min(l) from unnest(p_levels) l), (select max(l) from unnest(p_levels) l))
    else p_levels[1]::text end;
begin
  if not public.has_permission('content.update') then
    raise exception 'Bạn không có quyền đổi trạng thái hiển thị' using errcode = '42501';
  end if;
  if p_visibility not in ('private', 'staff', 'students', 'paid', 'members', 'public') then
    raise exception 'Mức hiển thị không hợp lệ: %', p_visibility using errcode = '22023';
  end if;
  if coalesce(cardinality(p_levels), 0) = 0 then
    return;
  end if;

  insert into vocab_level_visibility (collection, hsk_level, visibility, updated_at)
  select p_collection, l, p_visibility, now() from unnest(p_levels) l
  on conflict (collection, hsk_level) do update set visibility = excluded.visibility, updated_at = excluded.updated_at;

  perform write_activity(visibility_action(p_visibility), 'vocab', 1,
    format('Đổi từ vựng %s cấp %s sang %s', v_label, v_levels, visibility_label(p_visibility)),
    jsonb_build_object('collection', p_collection, 'levels', to_jsonb(p_levels), 'visibility', p_visibility));
end;
$$;

-- ------------------------------------------------------------------------------
-- Học viên xem quyền của mình (thêm "access" vào ngữ cảnh đăng nhập)
-- ------------------------------------------------------------------------------
create or replace function public.my_student_context()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'username', sp.username,
    'full_name', sp.full_name,
    'account_type', sp.account_type,
    'must_change_password', sp.must_change_password,
    'access', coalesce((
      select jsonb_agg(jsonb_build_object('module', g.module, 'expires_at', g.expires_at) order by g.module)
      from public.access_grants g
      where g.user_id = sp.user_id and (g.expires_at is null or g.expires_at > now())), '[]'::jsonb),
    'class', case when c.id is null then null else jsonb_build_object(
      'id', c.id, 'code', c.code, 'name', c.name, 'course_slug', c.course_slug,
      'hsk_level', c.hsk_level, 'hsk_version', c.hsk_version, 'study_mode', c.study_mode,
      'start_date', c.start_date, 'end_date', c.end_date, 'schedule', c.schedule, 'status', c.status,
      'archived', c.archived_at is not null,
      'staff', coalesce((
        select jsonb_agg(jsonb_build_object('full_name', coalesce(nullif(s.full_name, ''), s.username), 'role', cs.role)
                         order by cs.role desc, s.full_name)
        from public.class_staff cs join public.staff_profiles s on s.user_id = cs.user_id
        where cs.class_id = c.id), '[]'::jsonb)
    ) end
  )
  from public.student_profiles sp
  left join public.classes c on c.id = sp.class_id
  where sp.user_id = auth.uid() and sp.status = 'active'
$$;

-- ------------------------------------------------------------------------------
-- Cấp / gia hạn / thu hồi
-- ------------------------------------------------------------------------------
-- p_until: hạn cụ thể; p_duration: cộng thêm, tính từ hạn hiện tại nếu còn hạn, không thì từ bây giờ;
-- cả hai null = không thời hạn. Quyền đang không thời hạn thì cộng thời lượng vẫn giữ không thời hạn.
create or replace function public.grant_access(
  p_students uuid[], p_modules text[], p_until timestamptz default null, p_duration interval default null, p_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_modules text[] := array(select distinct m from unnest(coalesce(p_modules, '{}'::text[])) m order by m);
  v_ids uuid[] := array(select distinct s from unnest(coalesce(p_students, '{}'::uuid[])) s);
  v_note text := left(coalesce(trim(p_note), ''), 500);
  v_count integer;
  v_names text;
  v_until text;
begin
  if not has_permission('access.manage') then
    raise exception 'Bạn không có quyền cấp quyền truy cập' using errcode = '42501';
  end if;
  if cardinality(v_modules) = 0 or exists (select 1 from unnest(v_modules) m where m not in ('flashcards', 'exams')) then
    raise exception 'Chọn Flashcards và/hoặc Đề thi HSK' using errcode = '22023';
  end if;
  if cardinality(v_ids) = 0 then
    raise exception 'Chưa chọn tài khoản' using errcode = '22023';
  end if;
  if p_until is not null and p_duration is not null then
    raise exception 'Chỉ chọn ngày hết hạn hoặc thời lượng' using errcode = '22023';
  end if;
  if p_until is not null and p_until <= now() then
    raise exception 'Ngày hết hạn phải sau hôm nay' using errcode = '22023';
  end if;
  if p_duration is not null and p_duration <= interval '0' then
    raise exception 'Thời lượng không hợp lệ' using errcode = '22023';
  end if;
  if (select count(*) from student_profiles where user_id = any (v_ids)) <> cardinality(v_ids) then
    raise exception 'Có tài khoản không phải học viên' using errcode = '22023';
  end if;

  insert into access_grants as g (user_id, module, expires_at, note, granted_by, granted_at)
  select s, m, coalesce(p_until, now() + p_duration), v_note, auth.uid(), now()
  from unnest(v_ids) s cross join unnest(v_modules) m
  on conflict (user_id, module) do update set
    expires_at = case
      when p_until is not null then p_until
      when p_duration is null then null
      when g.expires_at is null then null
      when g.expires_at > now() then g.expires_at + p_duration
      else now() + p_duration end,
    note = case when v_note = '' then g.note else v_note end,
    granted_by = auth.uid(),
    granted_at = now();
  get diagnostics v_count = row_count;

  select string_agg(username, ', ') into v_names
  from (select username from student_profiles where user_id = any (v_ids) order by username limit 5) x;
  v_until := case when p_until is not null then 'đến ' || to_char(p_until at time zone 'Asia/Ho_Chi_Minh', 'DD/MM/YYYY')
                  when p_duration is not null then 'thêm ' || replace(replace(p_duration::text, 'mons', 'tháng'), 'days', 'ngày')
                  else 'không thời hạn' end;
  perform write_activity('grant', 'student', cardinality(v_ids),
    format('Cấp quyền %s (%s) cho %s%s',
      array_to_string(array(select case m when 'flashcards' then 'Flashcards' else 'Đề thi HSK' end from unnest(v_modules) m), ' + '),
      v_until, v_names,
      case when cardinality(v_ids) > 5 then format(' và %s tài khoản khác', cardinality(v_ids) - 5) else '' end),
    jsonb_build_object('students', to_jsonb(v_ids), 'modules', to_jsonb(v_modules),
                       'until', p_until, 'duration', p_duration::text));
  return jsonb_build_object('ok', true, 'count', v_count);
end;
$$;
revoke all on function public.grant_access(uuid[], text[], timestamptz, interval, text) from public;
grant execute on function public.grant_access(uuid[], text[], timestamptz, interval, text) to authenticated;

create or replace function public.revoke_access(p_students uuid[], p_modules text[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_names text;
begin
  if not has_permission('access.manage') then
    raise exception 'Bạn không có quyền thu hồi quyền truy cập' using errcode = '42501';
  end if;
  delete from access_grants where user_id = any (p_students) and module = any (p_modules);
  get diagnostics v_count = row_count;
  if v_count > 0 then
    select string_agg(username, ', ') into v_names
    from (select username from student_profiles where user_id = any (p_students) order by username limit 5) x;
    perform write_activity('revoke', 'student', v_count,
      format('Thu hồi quyền %s của %s',
        array_to_string(array(select case m when 'flashcards' then 'Flashcards' else 'Đề thi HSK' end
                              from unnest(p_modules) m order by m), ' + '),
        v_names),
      jsonb_build_object('students', to_jsonb(p_students), 'modules', to_jsonb(p_modules)));
  end if;
  return jsonb_build_object('ok', true, 'count', v_count);
end;
$$;
revoke all on function public.revoke_access(uuid[], text[]) from public;
grant execute on function public.revoke_access(uuid[], text[]) to authenticated;
