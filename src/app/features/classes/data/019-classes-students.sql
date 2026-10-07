-- ==============================================================================
-- 019 — LỚP HỌC & TÀI KHOẢN HỌC VIÊN
-- ==============================================================================
--   classes              — lớp học (lưu trữ = archived_at; chỉ admin xoá hẳn)
--   class_staff          — giáo viên / trợ giảng của lớp (1 lớp có thể nhiều người)
--   student_profiles     — hồ sơ học viên; mỗi học viên thuộc tối đa 1 lớp (class_id)
--   class_announcements  — thông báo của lớp
--   class_suggestions    — đề thi / bộ từ vựng gợi ý cho lớp
--   exam_attempts        — bài thi học viên đã nộp (nhân sự làm bài không lưu)
--   student_card_progress — tiến độ flashcard của học viên (thay IndexedDB trên máy)
--
-- Quyền mới (role_permissions):
--   class.manage   — tạo lớp, sửa / lưu trữ lớp mình phụ trách
--   class.all      — thấy và quản lý mọi lớp (admin)
--   class.delete   — xoá hẳn lớp (admin)
--   student.manage — tạo tài khoản học viên theo lô, sửa, chuyển lớp, khoá, lưu trữ, đặt lại mật khẩu
--   student.delete — xoá hẳn tài khoản học viên (admin)
--
-- Mức hiển thị thứ 4 cho đề thi / từ vựng: 'students' (Học viên) — học viên đã đăng nhập.
-- Đề / cấp từ vựng "Nội bộ" được gợi ý cho lớp thì học viên của lớp đó cũng mở được.
--
-- Mọi thao tác ghi lớp / học viên đi qua hàm SECURITY DEFINER (có kiểm tra quyền + nhật ký);
-- riêng thông báo, gợi ý và tiến độ flashcard ghi thẳng qua RLS.
-- Chạy được nhiều lần.

-- ------------------------------------------------------------------------------
-- Quyền
-- ------------------------------------------------------------------------------
insert into public.role_permissions (role_id, permission) values
  ('admin', 'class.manage'), ('admin', 'class.all'), ('admin', 'class.delete'),
  ('admin', 'student.manage'), ('admin', 'student.delete'),
  ('staff', 'class.manage'), ('staff', 'student.manage')
on conflict do nothing;

update public.roles set description = 'Toàn quyền nội dung, mọi lớp học, quản lý nhân sự và xem nhật ký hoạt động.' where id = 'admin';
update public.roles set description = 'Xem, thêm và sửa nội dung; quản lý lớp mình phụ trách. Không được xoá.' where id = 'staff';

-- ------------------------------------------------------------------------------
-- Bảng
-- ------------------------------------------------------------------------------
create table if not exists public.classes (
  id           uuid primary key default gen_random_uuid(),
  code         text not null check (length(trim(code)) between 1 and 40),
  name         text not null check (length(trim(name)) between 1 and 200),
  course_slug  text,
  hsk_level    smallint check (hsk_level between 1 and 9),
  hsk_version  text check (hsk_version in ('2.0', '3.0')),
  study_mode   text check (study_mode in ('online', 'offline')),
  start_date   date,
  end_date     date,
  schedule     text not null default '',
  max_students smallint check (max_students > 0),
  notes        text not null default '',
  status       text not null default 'planned' check (status in ('planned', 'active', 'finished')),
  archived_at  timestamptz,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index if not exists uq_classes_code on public.classes (upper(code));

create table if not exists public.class_staff (
  class_id   uuid not null references public.classes(id) on delete cascade,
  user_id    uuid not null references public.staff_profiles(user_id) on delete cascade,
  role       text not null default 'teacher' check (role in ('teacher', 'assistant')),
  created_at timestamptz not null default now(),
  primary key (class_id, user_id)
);
create index if not exists idx_class_staff_user on public.class_staff (user_id);

create table if not exists public.student_profiles (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  username             text not null unique,
  full_name            text not null check (length(trim(full_name)) between 1 and 200),
  birth_year           smallint check (birth_year between 1900 and 2100),
  phone                text not null default '',
  email                text not null default '',
  parent_phone         text not null default '',
  notes                text not null default '',
  class_id             uuid references public.classes(id) on delete set null,
  status               text not null default 'active' check (status in ('active', 'locked', 'archived')),
  must_change_password boolean not null default true,
  created_by           uuid references auth.users(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_student_profiles_class on public.student_profiles (class_id);

create table if not exists public.class_announcements (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.classes(id) on delete cascade,
  title      text not null check (length(trim(title)) between 1 and 200),
  body       text not null default '',
  pinned     boolean not null default false,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_class_announcements_class on public.class_announcements (class_id, created_at desc);

create table if not exists public.class_suggestions (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.classes(id) on delete cascade,
  kind       text not null check (kind in ('exam', 'vocab')),
  exam_id    uuid references public.exams(id) on delete cascade,
  collection varchar(20) check (collection in ('hsk2', 'hsk3', 'combined', 'supplement')),
  levels     smallint[],
  note       text not null default '',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (
    (kind = 'exam' and exam_id is not null and collection is null and levels is null)
    or (kind = 'vocab' and exam_id is null and collection is not null and cardinality(levels) > 0)
  )
);
create index if not exists idx_class_suggestions_class on public.class_suggestions (class_id);
create unique index if not exists uq_class_suggestions_exam on public.class_suggestions (class_id, exam_id) where kind = 'exam';
create unique index if not exists uq_class_suggestions_vocab on public.class_suggestions (class_id, collection, levels) where kind = 'vocab';

create table if not exists public.exam_attempts (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.student_profiles(user_id) on delete cascade,
  class_id        uuid references public.classes(id) on delete set null,
  exam_id         uuid not null references public.exams(id) on delete cascade,
  score           numeric(6, 1) not null,
  total_score     numeric(6, 1) not null,
  passing_score   numeric(6, 1),
  correct_count   integer not null default 0,
  question_count  integer not null default 0,
  section_scores  jsonb not null default '[]'::jsonb,
  answers         jsonb not null default '{}'::jsonb,
  time_spent_secs integer,
  submitted_at    timestamptz not null default now()
);
create index if not exists idx_exam_attempts_student on public.exam_attempts (student_id, submitted_at desc);
create index if not exists idx_exam_attempts_class on public.exam_attempts (class_id, exam_id);
create index if not exists idx_exam_attempts_exam on public.exam_attempts (exam_id);

create table if not exists public.student_card_progress (
  student_id    uuid not null references public.student_profiles(user_id) on delete cascade,
  card_id       bigint not null references public.vocab_cards(id) on delete cascade,
  hsk_level     smallint not null,
  hsk_version   text,
  confidence    smallint not null default 0 check (confidence between 0 and 3),
  review_count  integer not null default 0,
  bookmarked    boolean not null default false,
  last_reviewed timestamptz,
  updated_at    timestamptz not null default now(),
  primary key (student_id, card_id)
);

do $$
declare
  t text;
begin
  foreach t in array array['classes', 'student_profiles', 'class_announcements'] loop
    execute format('drop trigger if exists %I on public.%I', 'trg_' || t || '_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function update_updated_at_column()',
                   'trg_' || t || '_updated_at', t);
  end loop;
end $$;

-- ------------------------------------------------------------------------------
-- Hàm kiểm tra
-- ------------------------------------------------------------------------------
create or replace function public.is_student()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.student_profiles where user_id = auth.uid() and status = 'active')
$$;

create or replace function public.my_class_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select class_id from public.student_profiles where user_id = auth.uid() and status = 'active'
$$;

-- Admin (class.all) quản lý mọi lớp; nhân sự (class.manage) quản lý lớp mình có tên trong class_staff
create or replace function public.can_manage_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_permission('class.all')
      or (p_class_id is not null
          and public.has_permission('class.manage')
          and exists (select 1 from public.class_staff where class_id = p_class_id and user_id = auth.uid()))
$$;

create or replace function public.can_manage_student(p_student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_permission('student.manage')
     and exists (
       select 1 from public.student_profiles sp
       where sp.user_id = p_student
         and (public.has_permission('class.all') or public.can_manage_class(sp.class_id))
     )
$$;

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
        or (e.visibility = 'students' and public.is_student())
        or (e.visibility = 'staff' and exists (
              select 1 from public.class_suggestions cs
              where cs.kind = 'exam' and cs.exam_id = e.id and cs.class_id = public.my_class_id()))
      )
  )
$$;

create or replace function public.student_password_ok(p_password text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select length(p_password) >= 8 and p_password ~ '[A-Za-z]' and p_password ~ '[0-9]'
$$;

revoke all on function public.is_student(), public.my_class_id(), public.can_manage_class(uuid),
  public.can_manage_student(uuid), public.can_view_exam(uuid) from public;
grant execute on function public.is_student(), public.my_class_id(), public.can_view_exam(uuid) to anon, authenticated;
grant execute on function public.can_manage_class(uuid), public.can_manage_student(uuid) to authenticated;

-- ------------------------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------------------------
alter table public.classes enable row level security;
alter table public.class_staff enable row level security;
alter table public.student_profiles enable row level security;
alter table public.class_announcements enable row level security;
alter table public.class_suggestions enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.student_card_progress enable row level security;

drop policy if exists "classes read" on public.classes;
-- Học viên đọc lớp của mình qua my_student_context() (không lộ ghi chú nội bộ)
create policy "classes read" on public.classes for select to authenticated
  using (public.can_manage_class(id));

drop policy if exists "class_staff read" on public.class_staff;
create policy "class_staff read" on public.class_staff for select to authenticated
  using (public.can_manage_class(class_id));

drop policy if exists "student_profiles read" on public.student_profiles;
create policy "student_profiles read" on public.student_profiles for select to authenticated
  using (
    (select public.has_permission('class.all'))
    or (class_id is not null and public.can_manage_class(class_id))
  );

drop policy if exists "class_announcements read" on public.class_announcements;
drop policy if exists "class_announcements insert" on public.class_announcements;
drop policy if exists "class_announcements update" on public.class_announcements;
drop policy if exists "class_announcements delete" on public.class_announcements;
create policy "class_announcements read" on public.class_announcements for select to authenticated
  using (public.can_manage_class(class_id) or class_id = (select public.my_class_id()));
create policy "class_announcements insert" on public.class_announcements for insert to authenticated
  with check (public.can_manage_class(class_id));
create policy "class_announcements update" on public.class_announcements for update to authenticated
  using (public.can_manage_class(class_id)) with check (public.can_manage_class(class_id));
create policy "class_announcements delete" on public.class_announcements for delete to authenticated
  using (public.can_manage_class(class_id));

drop policy if exists "class_suggestions read" on public.class_suggestions;
drop policy if exists "class_suggestions insert" on public.class_suggestions;
drop policy if exists "class_suggestions update" on public.class_suggestions;
drop policy if exists "class_suggestions delete" on public.class_suggestions;
create policy "class_suggestions read" on public.class_suggestions for select to authenticated
  using (public.can_manage_class(class_id) or class_id = (select public.my_class_id()));
create policy "class_suggestions insert" on public.class_suggestions for insert to authenticated
  with check (public.can_manage_class(class_id));
create policy "class_suggestions update" on public.class_suggestions for update to authenticated
  using (public.can_manage_class(class_id)) with check (public.can_manage_class(class_id));
create policy "class_suggestions delete" on public.class_suggestions for delete to authenticated
  using (public.can_manage_class(class_id));

drop policy if exists "exam_attempts read" on public.exam_attempts;
create policy "exam_attempts read" on public.exam_attempts for select to authenticated
  using (
    student_id = (select auth.uid())
    or (select public.has_permission('class.all'))
    or (class_id is not null and public.can_manage_class(class_id))
  );

drop policy if exists "student_card_progress own" on public.student_card_progress;
create policy "student_card_progress own" on public.student_card_progress for all to authenticated
  using (student_id = (select auth.uid()) and (select public.is_student()))
  with check (student_id = (select auth.uid()) and (select public.is_student()));

revoke all on public.classes, public.class_staff, public.student_profiles, public.class_announcements,
  public.class_suggestions, public.exam_attempts, public.student_card_progress from anon;
revoke insert, update, delete, truncate on public.classes, public.class_staff, public.student_profiles,
  public.exam_attempts from authenticated;
revoke truncate on public.class_announcements, public.class_suggestions, public.student_card_progress from authenticated;
grant select on public.classes, public.class_staff, public.student_profiles, public.exam_attempts to authenticated;
grant select, insert, update, delete on public.class_announcements, public.class_suggestions, public.student_card_progress to authenticated;

-- ------------------------------------------------------------------------------
-- Mức hiển thị 'students' cho đề thi / từ vựng
-- ------------------------------------------------------------------------------
alter table public.exams drop constraint if exists exams_visibility_check;
alter table public.exams add constraint exams_visibility_check check (visibility in ('private', 'staff', 'students', 'public'));

alter table public.vocab_level_visibility drop constraint if exists vocab_level_visibility_visibility_check;
alter table public.vocab_level_visibility add constraint vocab_level_visibility_visibility_check
  check (visibility in ('private', 'staff', 'students', 'public'));

drop policy if exists "exams read" on public.exams;
drop policy if exists "exam_sections read" on public.exam_sections;
drop policy if exists "exam_parts read" on public.exam_parts;
drop policy if exists "exam_questions read" on public.exam_questions;
drop policy if exists "exam_options read" on public.exam_options;

-- Khách đọc được dòng exams của đề nội bộ / học viên (để hiện thẻ khoá), không đọc được câu hỏi
create policy "exams read" on public.exams for select
  using (visibility in ('staff', 'students', 'public') or (select public.has_permission('content.read')));

create policy "exam_sections read" on public.exam_sections for select
  using ((select public.has_permission('content.read')) or public.can_view_exam(exam_id));

create policy "exam_parts read" on public.exam_parts for select
  using (
    (select public.has_permission('content.read'))
    or exists (select 1 from exam_sections s where s.id = exam_parts.section_id and public.can_view_exam(s.exam_id))
  );

create policy "exam_questions read" on public.exam_questions for select
  using (
    (select public.has_permission('content.read'))
    or exists (
      select 1 from exam_parts p join exam_sections s on s.id = p.section_id
      where p.id = exam_questions.part_id and public.can_view_exam(s.exam_id)
    )
  );

create policy "exam_options read" on public.exam_options for select
  using (
    (select public.has_permission('content.read'))
    or exists (
      select 1 from exam_questions q
      join exam_parts p on p.id = q.part_id
      join exam_sections s on s.id = p.section_id
      where q.id = exam_options.question_id and public.can_view_exam(s.exam_id)
    )
  );

create or replace function public.get_exam_answers(p_exam_id uuid)
returns table (question_id uuid, correct_answer text, explanation text)
language sql
stable
security definer
set search_path = public
as $$
  select q.id, q.correct_answer, q.explanation
  from exam_questions q
  join exam_parts p on p.id = q.part_id
  join exam_sections s on s.id = p.section_id
  where s.exam_id = p_exam_id and public.can_view_exam(p_exam_id)
$$;

-- Khách không có quyền đọc class_suggestions → policy vocab_cards chỉ được gọi qua hàm SECURITY DEFINER
create or replace function public.my_class_suggests_vocab(p_collection text, p_level smallint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.class_suggestions cs
    where cs.kind = 'vocab'
      and cs.class_id = public.my_class_id()
      and cs.collection = p_collection
      and p_level = any (cs.levels)
  )
$$;
revoke all on function public.my_class_suggests_vocab(text, smallint) from public;
grant execute on function public.my_class_suggests_vocab(text, smallint) to anon, authenticated;

drop policy if exists "vocab_cards read" on public.vocab_cards;
create policy "vocab_cards read" on public.vocab_cards for select
  using (
    (select public.has_permission('content.read'))
    or not exists (
      select 1 from public.vocab_level_visibility v
      where v.collection = vocab_cards.collection
        and v.hsk_level = vocab_cards.hsk_level
        and v.visibility <> 'public'
        and not (v.visibility = 'students' and (select public.is_student()))
        and not (v.visibility = 'staff' and public.my_class_suggests_vocab(v.collection, v.hsk_level))
    )
  );

create or replace function public.visibility_label(p_visibility text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_visibility
    when 'public' then 'Công khai' when 'students' then 'Học viên' when 'staff' then 'Nội bộ' else 'Bản nháp' end
$$;

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
  if p_visibility not in ('private', 'staff', 'students', 'public') then
    raise exception 'Mức hiển thị không hợp lệ: %', p_visibility using errcode = '22023';
  end if;
  if coalesce(cardinality(p_levels), 0) = 0 then
    return;
  end if;

  insert into vocab_level_visibility (collection, hsk_level, visibility, updated_at)
  select p_collection, l, p_visibility, now() from unnest(p_levels) l
  on conflict (collection, hsk_level) do update set visibility = excluded.visibility, updated_at = excluded.updated_at;

  perform write_activity(
    case p_visibility when 'public' then 'publish' when 'students' then 'students_only'
                      when 'staff' then 'staff_only' else 'unpublish' end,
    'vocab', 1,
    format('Đổi từ vựng %s cấp %s sang %s', v_label, v_levels, visibility_label(p_visibility)),
    jsonb_build_object('collection', p_collection, 'levels', to_jsonb(p_levels), 'visibility', p_visibility));
end;
$$;

-- Nhật ký đề thi: như 017, thêm mức 'students' → students_only
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
        v_action := case v_visibility when 'public' then 'publish' when 'students' then 'students_only'
                                      when 'staff' then 'staff_only' else 'unpublish' end;
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
-- Danh bạ cho khu quản trị lớp
-- ------------------------------------------------------------------------------
create or replace function public.list_staff_directory()
returns table (user_id uuid, username text, full_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select s.user_id, s.username, s.full_name
  from public.staff_profiles s
  where public.has_permission('class.manage')
  order by s.username
$$;

-- Lớp đích khi chuyển lớp: mọi lớp chưa lưu trữ
create or replace function public.list_class_options()
returns table (id uuid, code text, name text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.code, c.name
  from public.classes c
  where public.has_permission('student.manage') and c.archived_at is null
  order by c.code
$$;

revoke all on function public.list_staff_directory(), public.list_class_options() from public, anon;
grant execute on function public.list_staff_directory(), public.list_class_options() to authenticated;

-- ------------------------------------------------------------------------------
-- Lớp học: tạo / sửa / lưu trữ / xoá
-- ------------------------------------------------------------------------------
create or replace function public.save_class(p_class jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := nullif(p_class ->> 'id', '')::uuid;
  v_code text := upper(trim(coalesce(p_class ->> 'code', '')));
  v_name text := trim(coalesce(p_class ->> 'name', ''));
  v_staff jsonb := coalesce(p_class -> 'staff', '[]'::jsonb);
begin
  if v_id is null then
    if not has_permission('class.manage') then
      raise exception 'Bạn không có quyền tạo lớp' using errcode = '42501';
    end if;
  elsif not can_manage_class(v_id) then
    raise exception 'Bạn không có quyền sửa lớp này' using errcode = '42501';
  end if;

  if v_code = '' or v_name = '' then
    raise exception 'Cần nhập mã lớp và tên lớp' using errcode = '22023';
  end if;
  if exists (select 1 from classes where upper(code) = v_code and id is distinct from v_id) then
    raise exception 'Mã lớp % đã được dùng', v_code using errcode = '23505';
  end if;

  if v_id is null then
    insert into classes (code, name, course_slug, hsk_level, hsk_version, study_mode, start_date, end_date,
                         schedule, max_students, notes, status, created_by)
    values (
      v_code, v_name,
      nullif(p_class ->> 'course_slug', ''),
      nullif(p_class ->> 'hsk_level', '')::smallint,
      nullif(p_class ->> 'hsk_version', ''),
      nullif(p_class ->> 'study_mode', ''),
      nullif(p_class ->> 'start_date', '')::date,
      nullif(p_class ->> 'end_date', '')::date,
      coalesce(p_class ->> 'schedule', ''),
      nullif(p_class ->> 'max_students', '')::smallint,
      coalesce(p_class ->> 'notes', ''),
      coalesce(nullif(p_class ->> 'status', ''), 'planned'),
      auth.uid()
    )
    returning id into v_id;
    perform write_activity('create', 'class', 1, format('Tạo lớp %s – %s', v_code, v_name),
      jsonb_build_object('class_id', v_id, 'code', v_code));
  else
    update classes set
      code         = v_code,
      name         = v_name,
      course_slug  = nullif(p_class ->> 'course_slug', ''),
      hsk_level    = nullif(p_class ->> 'hsk_level', '')::smallint,
      hsk_version  = nullif(p_class ->> 'hsk_version', ''),
      study_mode   = nullif(p_class ->> 'study_mode', ''),
      start_date   = nullif(p_class ->> 'start_date', '')::date,
      end_date     = nullif(p_class ->> 'end_date', '')::date,
      schedule     = coalesce(p_class ->> 'schedule', ''),
      max_students = nullif(p_class ->> 'max_students', '')::smallint,
      notes        = coalesce(p_class ->> 'notes', ''),
      status       = coalesce(nullif(p_class ->> 'status', ''), status)
    where id = v_id;
    if not found then
      raise exception 'Không tìm thấy lớp' using errcode = 'P0002';
    end if;
    perform write_activity('update', 'class', 1, format('Cập nhật lớp %s – %s', v_code, v_name),
      jsonb_build_object('class_id', v_id, 'code', v_code));
  end if;

  -- Nhân sự không phải admin luôn giữ tên mình trong lớp, để không tự mất quyền với lớp vừa sửa
  if not has_permission('class.all')
     and not exists (select 1 from jsonb_array_elements(v_staff) e where (e ->> 'user_id')::uuid = auth.uid()) then
    v_staff := v_staff || jsonb_build_array(jsonb_build_object('user_id', auth.uid(), 'role', 'teacher'));
  end if;

  delete from class_staff where class_id = v_id;
  insert into class_staff (class_id, user_id, role)
  select v_id, (e ->> 'user_id')::uuid, coalesce(nullif(e ->> 'role', ''), 'teacher')
  from jsonb_array_elements(v_staff) e
  where exists (select 1 from staff_profiles s where s.user_id = (e ->> 'user_id')::uuid)
  on conflict do nothing;

  return v_id;
end;
$$;

create or replace function public.set_class_archived(p_class_id uuid, p_archived boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class classes%rowtype;
begin
  if not can_manage_class(p_class_id) then
    raise exception 'Bạn không có quyền với lớp này' using errcode = '42501';
  end if;
  update classes set archived_at = case when p_archived then coalesce(archived_at, now()) end
  where id = p_class_id
  returning * into v_class;
  if not found then
    raise exception 'Không tìm thấy lớp' using errcode = 'P0002';
  end if;
  perform write_activity(case when p_archived then 'archive' else 'restore' end, 'class', 1,
    format('%s lớp %s – %s', case when p_archived then 'Lưu trữ' else 'Khôi phục' end, v_class.code, v_class.name),
    jsonb_build_object('class_id', p_class_id, 'code', v_class.code));
end;
$$;

-- Xoá hẳn (admin). Học viên của lớp chuyển về "chưa có lớp", bài thi giữ lại.
create or replace function public.delete_class(p_class_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class classes%rowtype;
begin
  if not has_permission('class.delete') then
    raise exception 'Chỉ quản trị viên được xoá lớp' using errcode = '42501';
  end if;
  delete from classes where id = p_class_id returning * into v_class;
  if not found then
    raise exception 'Không tìm thấy lớp' using errcode = 'P0002';
  end if;
  perform write_activity('delete', 'class', 1, format('Xoá lớp %s – %s', v_class.code, v_class.name),
    jsonb_build_object('class_id', p_class_id, 'code', v_class.code));
end;
$$;

revoke all on function public.save_class(jsonb), public.set_class_archived(uuid, boolean), public.delete_class(uuid) from public, anon;
grant execute on function public.save_class(jsonb), public.set_class_archived(uuid, boolean), public.delete_class(uuid) to authenticated;

-- ------------------------------------------------------------------------------
-- Học viên: tạo theo lô
-- ------------------------------------------------------------------------------
-- p_rows: [{full_name, username_base, password, birth_year, phone, email, parent_phone, notes}]
-- Tên đăng nhập = username_base (chữ không dấu, client tạo theo quy tắc nhân sự) + 4 số ngẫu nhiên.
-- Email đăng nhập nội bộ: <tên đăng nhập viết thường>@hocvien.mayocreativechinese.edu.vn
-- Trả về [{row, user_id, username, full_name}] — mật khẩu do client tạo và giữ, DB chỉ lưu bản băm.
create or replace function public.create_students(p_class_id uuid, p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class classes%rowtype;
  v_count integer := jsonb_array_length(coalesce(p_rows, '[]'::jsonb));
  v_row jsonb;
  v_idx bigint;
  v_name text;
  v_base text;
  v_password text;
  v_username text;
  v_email text;
  v_id uuid;
  v_try integer;
  v_result jsonb := '[]'::jsonb;
begin
  if not has_permission('student.manage') or not can_manage_class(p_class_id) then
    raise exception 'Bạn không có quyền thêm học viên vào lớp này' using errcode = '42501';
  end if;
  select * into v_class from classes where id = p_class_id;
  if not found or v_class.archived_at is not null then
    raise exception 'Lớp không tồn tại hoặc đã lưu trữ' using errcode = 'P0002';
  end if;
  if v_count = 0 or v_count > 200 then
    raise exception 'Mỗi lần tạo từ 1 đến 200 học viên' using errcode = '22023';
  end if;

  for v_row, v_idx in select value, ordinality from jsonb_array_elements(p_rows) with ordinality loop
    v_name := trim(coalesce(v_row ->> 'full_name', ''));
    v_base := coalesce(v_row ->> 'username_base', '');
    v_password := coalesce(v_row ->> 'password', '');

    if v_name = '' then
      raise exception 'Dòng %: thiếu họ tên', v_idx using errcode = '22023';
    end if;
    if v_base !~ '^[A-Za-z]{1,30}$' then
      raise exception 'Dòng %: tên đăng nhập không hợp lệ', v_idx using errcode = '22023';
    end if;
    if not student_password_ok(v_password) then
      raise exception 'Dòng %: mật khẩu cần ít nhất 8 ký tự, có cả chữ và số', v_idx using errcode = '22023';
    end if;

    v_try := 0;
    loop
      v_username := v_base || (1000 + floor(random() * 9000))::int::text;
      v_email := lower(v_username) || '@hocvien.mayocreativechinese.edu.vn';
      exit when not exists (select 1 from student_profiles where lower(username) = lower(v_username))
        and not exists (select 1 from staff_profiles where lower(username) = lower(v_username))
        and not exists (select 1 from auth.users where email = v_email);
      v_try := v_try + 1;
      if v_try > 200 then
        raise exception 'Dòng %: không tạo được tên đăng nhập', v_idx;
      end if;
    end loop;

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf', 10)), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
      '', '', '', ''
    )
    returning id into v_id;

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_id, v_id::text,
            jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
            'email', now(), now(), now());

    insert into student_profiles (user_id, username, full_name, birth_year, phone, email, parent_phone, notes, class_id, created_by)
    values (
      v_id, v_username, v_name,
      nullif(v_row ->> 'birth_year', '')::smallint,
      trim(coalesce(v_row ->> 'phone', '')),
      trim(coalesce(v_row ->> 'email', '')),
      trim(coalesce(v_row ->> 'parent_phone', '')),
      trim(coalesce(v_row ->> 'notes', '')),
      p_class_id,
      auth.uid()
    );

    v_result := v_result || jsonb_build_object('row', v_idx, 'user_id', v_id, 'username', v_username, 'full_name', v_name);
  end loop;

  perform write_activity('create', 'student', v_count,
    case when v_count = 1
      then format('Tạo tài khoản học viên %s (%s) cho lớp %s', v_result -> 0 ->> 'username', v_result -> 0 ->> 'full_name', v_class.code)
      else format('Tạo %s tài khoản học viên cho lớp %s', v_count, v_class.code) end,
    jsonb_build_object('class_id', p_class_id, 'items',
      (select jsonb_agg(jsonb_build_object('username', r ->> 'username', 'full_name', r ->> 'full_name'))
       from (select value r from jsonb_array_elements(v_result) limit 20) x)));

  return v_result;
end;
$$;

-- ------------------------------------------------------------------------------
-- Học viên: sửa hồ sơ / chuyển lớp / trạng thái / mật khẩu / xoá
-- ------------------------------------------------------------------------------
create or replace function public.update_student(p_student uuid, p_data jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile student_profiles%rowtype;
begin
  if not can_manage_student(p_student) then
    raise exception 'Bạn không có quyền sửa học viên này' using errcode = '42501';
  end if;
  if trim(coalesce(p_data ->> 'full_name', '')) = '' then
    raise exception 'Cần nhập họ tên' using errcode = '22023';
  end if;
  update student_profiles set
    full_name    = trim(p_data ->> 'full_name'),
    birth_year   = nullif(p_data ->> 'birth_year', '')::smallint,
    phone        = trim(coalesce(p_data ->> 'phone', '')),
    email        = trim(coalesce(p_data ->> 'email', '')),
    parent_phone = trim(coalesce(p_data ->> 'parent_phone', '')),
    notes        = trim(coalesce(p_data ->> 'notes', ''))
  where user_id = p_student
  returning * into v_profile;
  perform write_activity('update', 'student', 1, format('Cập nhật học viên %s (%s)', v_profile.username, v_profile.full_name),
    jsonb_build_object('user_id', p_student, 'username', v_profile.username));
end;
$$;

-- Chỉ nhân sự chuyển lớp (học viên không tự chuyển). Lớp đích phải chưa lưu trữ.
create or replace function public.move_students(p_students uuid[], p_class_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class classes%rowtype;
  v_count integer;
begin
  if coalesce(cardinality(p_students), 0) = 0 then
    return;
  end if;
  if exists (select 1 from unnest(p_students) s where not can_manage_student(s)) then
    raise exception 'Bạn không có quyền chuyển một số học viên đã chọn' using errcode = '42501';
  end if;
  select * into v_class from classes where id = p_class_id and archived_at is null;
  if not found then
    raise exception 'Lớp đích không tồn tại hoặc đã lưu trữ' using errcode = 'P0002';
  end if;

  update student_profiles set class_id = p_class_id
  where user_id = any (p_students) and class_id is distinct from p_class_id;
  get diagnostics v_count = row_count;
  if v_count = 0 then
    return;
  end if;

  perform write_activity('move', 'student', v_count,
    case when v_count = 1
      then format('Chuyển học viên %s sang lớp %s',
                  (select username from student_profiles where user_id = any (p_students) limit 1), v_class.code)
      else format('Chuyển %s học viên sang lớp %s', v_count, v_class.code) end,
    jsonb_build_object('class_id', p_class_id, 'code', v_class.code, 'items',
      (select jsonb_agg(jsonb_build_object('username', username, 'full_name', full_name))
       from (select username, full_name from student_profiles where user_id = any (p_students) limit 20) x)));
end;
$$;

-- active / locked / archived. Khoá & lưu trữ chặn đăng nhập (banned_until) và đăng xuất mọi phiên.
create or replace function public.set_students_status(p_students uuid[], p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if p_status not in ('active', 'locked', 'archived') then
    raise exception 'Trạng thái không hợp lệ' using errcode = '22023';
  end if;
  if coalesce(cardinality(p_students), 0) = 0 then
    return;
  end if;
  if exists (select 1 from unnest(p_students) s where not can_manage_student(s)) then
    raise exception 'Bạn không có quyền với một số học viên đã chọn' using errcode = '42501';
  end if;

  update student_profiles set status = p_status
  where user_id = any (p_students) and status <> p_status;
  get diagnostics v_count = row_count;

  update auth.users
  set banned_until = case when p_status = 'active' then null else 'infinity'::timestamptz end,
      updated_at = now()
  where id = any (p_students);
  if p_status <> 'active' then
    delete from auth.refresh_tokens where user_id = any (select s::text from unnest(p_students) s);
    delete from auth.sessions where user_id = any (p_students);
  end if;

  if v_count > 0 then
    perform write_activity(
      case p_status when 'active' then 'unlock' when 'locked' then 'lock' else 'archive' end,
      'student', v_count,
      format('%s %s',
        case p_status when 'active' then 'Mở lại' when 'locked' then 'Khoá' else 'Lưu trữ' end,
        case when v_count = 1
          then format('tài khoản học viên %s', (select username from student_profiles where user_id = any (p_students) limit 1))
          else format('%s tài khoản học viên', v_count) end),
      jsonb_build_object('status', p_status, 'items',
        (select jsonb_agg(jsonb_build_object('username', username, 'full_name', full_name))
         from (select username, full_name from student_profiles where user_id = any (p_students) limit 20) x)));
  end if;
end;
$$;

create or replace function public.reset_student_password(p_student uuid, p_new_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile student_profiles%rowtype;
begin
  if not can_manage_student(p_student) then
    raise exception 'Bạn không có quyền với học viên này' using errcode = '42501';
  end if;
  if not student_password_ok(p_new_password) then
    raise exception 'Mật khẩu cần ít nhất 8 ký tự, có cả chữ và số' using errcode = '22023';
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)), updated_at = now()
  where id = p_student;
  delete from auth.refresh_tokens where user_id = p_student::text;
  delete from auth.sessions where user_id = p_student;

  update student_profiles set must_change_password = true where user_id = p_student returning * into v_profile;
  perform write_activity('password_reset', 'student', 1, format('Đặt lại mật khẩu cho học viên %s', v_profile.username),
    jsonb_build_object('user_id', p_student, 'username', v_profile.username));
end;
$$;

-- Xoá hẳn tài khoản (admin): hồ sơ, bài thi, tiến độ flashcard bị xoá theo
create or replace function public.delete_students(p_students uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_items jsonb;
  v_count integer;
begin
  if not has_permission('student.delete') then
    raise exception 'Chỉ quản trị viên được xoá tài khoản học viên' using errcode = '42501';
  end if;
  select count(*), jsonb_agg(jsonb_build_object('username', username, 'full_name', full_name))
    into v_count, v_items
  from student_profiles where user_id = any (p_students);
  if v_count = 0 then
    return;
  end if;

  delete from auth.users where id in (select user_id from student_profiles where user_id = any (p_students));

  perform write_activity('delete', 'student', v_count,
    case when v_count = 1 then format('Xoá tài khoản học viên %s', v_items -> 0 ->> 'username')
         else format('Xoá %s tài khoản học viên', v_count) end,
    jsonb_build_object('items', v_items));
end;
$$;

revoke all on function public.create_students(uuid, jsonb), public.update_student(uuid, jsonb),
  public.move_students(uuid[], uuid), public.set_students_status(uuid[], text),
  public.reset_student_password(uuid, text), public.delete_students(uuid[]) from public, anon;
grant execute on function public.create_students(uuid, jsonb), public.update_student(uuid, jsonb),
  public.move_students(uuid[], uuid), public.set_students_status(uuid[], text),
  public.reset_student_password(uuid, text), public.delete_students(uuid[]) to authenticated;

-- ------------------------------------------------------------------------------
-- Phía học viên
-- ------------------------------------------------------------------------------
-- Hồ sơ + lớp của người đang đăng nhập (null nếu không phải học viên đang hoạt động)
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
    'must_change_password', sp.must_change_password,
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

-- Học viên tự đổi mật khẩu (chính sách nhẹ hơn nhân sự: ≥ 8 ký tự, có chữ và số).
-- Đổi trực tiếp trong DB vì chính sách mật khẩu của Supabase Auth đang đặt theo nhân sự.
create or replace function public.student_change_password(p_current text, p_new text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_student() then
    return jsonb_build_object('ok', false, 'error', 'not_student');
  end if;
  if not exists (
    select 1 from auth.users where id = auth.uid() and encrypted_password = extensions.crypt(p_current, encrypted_password)
  ) then
    return jsonb_build_object('ok', false, 'error', 'wrong_password');
  end if;
  if not student_password_ok(p_new) then
    return jsonb_build_object('ok', false, 'error', 'weak_password');
  end if;
  if p_new = p_current then
    return jsonb_build_object('ok', false, 'error', 'same_password');
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(p_new, extensions.gen_salt('bf', 10)), updated_at = now()
  where id = auth.uid();
  update student_profiles set must_change_password = false where user_id = auth.uid();
  return jsonb_build_object('ok', true);
end;
$$;

-- Lưu bài thi học viên nộp (điểm do client chấm như cho khách; nhân sự làm bài không gọi hàm này)
create or replace function public.submit_exam_attempt(p_attempt jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exam_id uuid := (p_attempt ->> 'exam_id')::uuid;
  v_id uuid;
begin
  if not is_student() then
    raise exception 'Chỉ lưu bài của học viên' using errcode = '42501';
  end if;
  if not can_view_exam(v_exam_id) then
    raise exception 'Không có quyền làm đề này' using errcode = '42501';
  end if;

  insert into exam_attempts (student_id, class_id, exam_id, score, total_score, passing_score,
                             correct_count, question_count, section_scores, answers, time_spent_secs)
  values (
    auth.uid(), my_class_id(), v_exam_id,
    coalesce((p_attempt ->> 'score')::numeric, 0),
    coalesce((p_attempt ->> 'total_score')::numeric, 0),
    nullif(p_attempt ->> 'passing_score', '')::numeric,
    coalesce((p_attempt ->> 'correct_count')::integer, 0),
    coalesce((p_attempt ->> 'question_count')::integer, 0),
    coalesce(p_attempt -> 'section_scores', '[]'::jsonb),
    coalesce(p_attempt -> 'answers', '{}'::jsonb),
    nullif(p_attempt ->> 'time_spent_secs', '')::integer
  )
  returning id into v_id;
  return v_id;
end;
$$;

-- Tiến độ flashcard theo học viên của 1 lớp (cho giáo viên)
create or replace function public.class_vocab_progress(p_class_id uuid)
returns table (student_id uuid, reviewed integer, mastered integer, bookmarked integer, last_reviewed timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select sp.user_id,
         count(p.card_id) filter (where p.review_count > 0)::integer,
         count(p.card_id) filter (where p.confidence = 3)::integer,
         count(p.card_id) filter (where p.bookmarked)::integer,
         max(p.last_reviewed)
  from student_profiles sp
  left join student_card_progress p on p.student_id = sp.user_id
  where sp.class_id = p_class_id and can_manage_class(p_class_id)
  group by sp.user_id
$$;

revoke all on function public.my_student_context(), public.student_change_password(text, text),
  public.submit_exam_attempt(jsonb), public.class_vocab_progress(uuid) from public, anon;
grant execute on function public.my_student_context(), public.student_change_password(text, text),
  public.submit_exam_attempt(jsonb), public.class_vocab_progress(uuid) to authenticated;
