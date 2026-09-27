-- ==============================================================================
-- 013 — VAI TRÒ & QUYỀN LƯU TRONG DATABASE
-- ==============================================================================
-- Thay app_metadata.role (012) bằng bảng:
--   roles             — danh sách vai trò (admin, staff; thêm vai trò mới = thêm dòng)
--   role_permissions  — quyền của từng vai trò
--   staff_profiles    — hồ sơ nhân sự, cột role_id quyết định quyền
-- Mọi policy / hàm kiểm tra qua public.has_permission('<quyền>'), không so tên vai trò.
--
-- Quyền hiện có:
--   content.read / content.create / content.update / content.delete — đề thi, từ vựng, file
--   staff.manage  — xem danh sách nhân sự, đặt lại mật khẩu
--   activity.read — xem nhật ký hoạt động

create table if not exists public.roles (
  id          text primary key,
  label       text not null,
  description text not null default '',
  sort_order  smallint not null default 0
);

create table if not exists public.role_permissions (
  role_id    text not null references public.roles(id) on delete cascade,
  permission text not null,
  primary key (role_id, permission)
);

create table if not exists public.staff_profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  username   text not null unique,
  full_name  text not null default '',
  role_id    text not null references public.roles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_staff_profiles_role on public.staff_profiles(role_id);

drop trigger if exists trg_staff_profiles_updated_at on public.staff_profiles;
create trigger trg_staff_profiles_updated_at
  before update on public.staff_profiles
  for each row execute function update_updated_at_column();

insert into public.roles (id, label, description, sort_order) values
  ('admin', 'Quản trị viên', 'Toàn quyền nội dung, quản lý nhân sự và xem nhật ký hoạt động.', 1),
  ('staff', 'Nhân viên', 'Xem, thêm và sửa nội dung; không được xoá.', 2)
on conflict (id) do update set label = excluded.label, description = excluded.description, sort_order = excluded.sort_order;

insert into public.role_permissions (role_id, permission) values
  ('admin', 'content.read'), ('admin', 'content.create'), ('admin', 'content.update'), ('admin', 'content.delete'),
  ('admin', 'staff.manage'), ('admin', 'activity.read'),
  ('staff', 'content.read'), ('staff', 'content.create'), ('staff', 'content.update')
on conflict do nothing;

-- Chuyển tài khoản hiện có: owner → admin, editor → staff
insert into public.staff_profiles (user_id, username, full_name, role_id)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'username', split_part(u.email, '@', 1)),
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  case u.raw_app_meta_data ->> 'role' when 'owner' then 'admin' else 'staff' end
from auth.users u
where u.raw_app_meta_data ->> 'role' in ('owner', 'editor')
on conflict (user_id) do nothing;

update auth.users set raw_app_meta_data = raw_app_meta_data - 'role'
where raw_app_meta_data ? 'role';

-- ------------------------------------------------------------------------------
-- Hàm kiểm tra quyền
-- ------------------------------------------------------------------------------
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
    where s.user_id = auth.uid() and rp.permission = p_permission
  )
$$;

revoke all on function public.has_permission(text) from public;
grant execute on function public.has_permission(text) to anon, authenticated;

-- Hồ sơ + quyền của người đang đăng nhập (null nếu không phải nhân sự)
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
  where s.user_id = auth.uid()
$$;

revoke all on function public.my_staff_context() from public, anon;
grant execute on function public.my_staff_context() to authenticated;

-- ------------------------------------------------------------------------------
-- RLS cho bảng vai trò / hồ sơ
-- ------------------------------------------------------------------------------
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.staff_profiles enable row level security;

drop policy if exists "roles read" on public.roles;
create policy "roles read" on public.roles for select to authenticated using (true);

drop policy if exists "role_permissions read" on public.role_permissions;
create policy "role_permissions read" on public.role_permissions for select to authenticated using (true);

drop policy if exists "staff_profiles read" on public.staff_profiles;
create policy "staff_profiles read" on public.staff_profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.has_permission('staff.manage')));

-- Tự sửa họ tên của mình; chỉ cột full_name được cấp quyền UPDATE (không tự đổi vai trò)
drop policy if exists "staff_profiles self update" on public.staff_profiles;
create policy "staff_profiles self update" on public.staff_profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.roles, public.role_permissions, public.staff_profiles from anon;
revoke insert, update, delete on public.roles, public.role_permissions, public.staff_profiles from authenticated;
grant select on public.roles, public.role_permissions, public.staff_profiles to authenticated;
grant update (full_name) on public.staff_profiles to authenticated;

-- ------------------------------------------------------------------------------
-- Nội dung: exam_* và vocab_cards
-- ------------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['exams', 'exam_sections', 'exam_parts', 'exam_questions', 'exam_options', 'vocab_cards'] loop
    execute format('drop policy if exists %I on public.%I', t || ' staff insert', t);
    execute format('drop policy if exists %I on public.%I', t || ' staff update', t);
    execute format('drop policy if exists %I on public.%I', t || ' owner delete', t);
    execute format('drop policy if exists %I on public.%I', t || ' insert', t);
    execute format('drop policy if exists %I on public.%I', t || ' update', t);
    execute format('drop policy if exists %I on public.%I', t || ' delete', t);
    execute format($p$create policy %I on public.%I for insert to authenticated
                     with check ((select public.has_permission('content.create')))$p$, t || ' insert', t);
    execute format($p$create policy %I on public.%I for update to authenticated
                     using ((select public.has_permission('content.update')))
                     with check ((select public.has_permission('content.update')))$p$, t || ' update', t);
    execute format($p$create policy %I on public.%I for delete to authenticated
                     using ((select public.has_permission('content.delete')))$p$, t || ' delete', t);
  end loop;
end $$;

drop policy if exists "exams read" on exams;
create policy "exams read" on exams for select
  using (is_published or (select public.has_permission('content.read')));

drop policy if exists "exam_sections read" on exam_sections;
create policy "exam_sections read" on exam_sections for select
  using (
    (select public.has_permission('content.read'))
    or exists (select 1 from exams e where e.id = exam_sections.exam_id and e.is_published)
  );

drop policy if exists "exam_parts read" on exam_parts;
create policy "exam_parts read" on exam_parts for select
  using (
    (select public.has_permission('content.read'))
    or exists (
      select 1 from exam_sections s join exams e on e.id = s.exam_id
      where s.id = exam_parts.section_id and e.is_published
    )
  );

drop policy if exists "exam_questions read" on exam_questions;
create policy "exam_questions read" on exam_questions for select
  using (
    (select public.has_permission('content.read'))
    or exists (
      select 1 from exam_parts p
      join exam_sections s on s.id = p.section_id
      join exams e on e.id = s.exam_id
      where p.id = exam_questions.part_id and e.is_published
    )
  );

drop policy if exists "exam_options read" on exam_options;
create policy "exam_options read" on exam_options for select
  using (
    (select public.has_permission('content.read'))
    or exists (
      select 1 from exam_questions q
      join exam_parts p on p.id = q.part_id
      join exam_sections s on s.id = p.section_id
      join exams e on e.id = s.exam_id
      where q.id = exam_options.question_id and e.is_published
    )
  );

-- Storage exam-assets
drop policy if exists "exam-assets insert" on storage.objects;
drop policy if exists "exam-assets update" on storage.objects;
drop policy if exists "exam-assets delete" on storage.objects;
create policy "exam-assets insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'exam-assets' and (select public.has_permission('content.create')));
create policy "exam-assets update" on storage.objects for update to authenticated
  using (bucket_id = 'exam-assets' and (select public.has_permission('content.update')))
  with check (bucket_id = 'exam-assets' and (select public.has_permission('content.update')));
create policy "exam-assets delete" on storage.objects for delete to authenticated
  using (bucket_id = 'exam-assets' and (select public.has_permission('content.delete')));

-- ------------------------------------------------------------------------------
-- Hàm nội dung
-- ------------------------------------------------------------------------------
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
  join exams e on e.id = s.exam_id
  where e.id = p_exam_id
    and (e.is_published or public.has_permission('content.read'))
$$;

-- save_full_exam: tạo mới cần content.create, lưu đề có sẵn cần content.update.
-- Thân hàm giống 010/012, chỉ khác phần kiểm tra quyền.
create or replace function public.save_full_exam(p_exam jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exam_id uuid := nullif(p_exam ->> 'id', '')::uuid;
  v_sec jsonb;
  v_sec_ord bigint;
  v_sec_id uuid;
  v_part jsonb;
  v_part_ord bigint;
  v_part_id uuid;
  v_q jsonb;
  v_q_ord bigint;
  v_q_id uuid;
begin
  if not public.has_permission(case when v_exam_id is null then 'content.create' else 'content.update' end) then
    raise exception 'Bạn không có quyền lưu đề thi' using errcode = '42501';
  end if;

  if v_exam_id is null then
    insert into exams (title, hsk_level, hsk_version, duration_mins, total_score, passing_score, description, is_published)
    values (
      p_exam ->> 'title',
      (p_exam ->> 'hsk_level')::smallint,
      coalesce(p_exam ->> 'hsk_version', '2.0'),
      coalesce((p_exam ->> 'duration_mins')::smallint, 90),
      coalesce((p_exam ->> 'total_score')::smallint, 300),
      coalesce((p_exam ->> 'passing_score')::smallint, 180),
      nullif(p_exam ->> 'description', ''),
      coalesce((p_exam ->> 'is_published')::boolean, false)
    )
    returning id into v_exam_id;
  else
    update exams set
      title         = p_exam ->> 'title',
      hsk_level     = (p_exam ->> 'hsk_level')::smallint,
      hsk_version   = coalesce(p_exam ->> 'hsk_version', '2.0'),
      duration_mins = coalesce((p_exam ->> 'duration_mins')::smallint, 90),
      total_score   = coalesce((p_exam ->> 'total_score')::smallint, 300),
      passing_score = coalesce((p_exam ->> 'passing_score')::smallint, 180),
      description   = nullif(p_exam ->> 'description', ''),
      is_published  = coalesce((p_exam ->> 'is_published')::boolean, false)
    where id = v_exam_id;

    if not found then
      raise exception 'Không tìm thấy đề thi %', v_exam_id using errcode = 'P0002';
    end if;

    delete from exam_sections where exam_id = v_exam_id;
  end if;

  for v_sec, v_sec_ord in
    select value, ordinality from jsonb_array_elements(coalesce(p_exam -> 'sections', '[]'::jsonb)) with ordinality
  loop
    insert into exam_sections (exam_id, section_type, title, sort_order, max_score, instructions, audio_url)
    values (
      v_exam_id,
      v_sec ->> 'section_type',
      v_sec ->> 'title',
      v_sec_ord,
      coalesce(nullif((v_sec ->> 'max_score')::numeric, 0), 100),
      nullif(v_sec ->> 'instructions', ''),
      nullif(v_sec ->> 'audio_url', '')
    )
    returning id into v_sec_id;

    for v_part, v_part_ord in
      select value, ordinality from jsonb_array_elements(coalesce(v_sec -> 'parts', '[]'::jsonb)) with ordinality
    loop
      insert into exam_parts (
        section_id, title, question_type, instructions, example_text, stimulus_text,
        stimulus_image_url, stimulus_audio_url, option_labels, sort_order
      )
      values (
        v_sec_id,
        v_part ->> 'title',
        v_part ->> 'question_type',
        nullif(v_part ->> 'instructions', ''),
        nullif(v_part ->> 'example_text', ''),
        nullif(v_part ->> 'stimulus_text', ''),
        nullif(v_part ->> 'stimulus_image_url', ''),
        nullif(v_part ->> 'stimulus_audio_url', ''),
        nullif(v_part ->> 'option_labels', ''),
        v_part_ord
      )
      returning id into v_part_id;

      for v_q, v_q_ord in
        select value, ordinality from jsonb_array_elements(coalesce(v_part -> 'questions', '[]'::jsonb)) with ordinality
      loop
        insert into exam_questions (part_id, question_num, content, audio_url, image_url, correct_answer, explanation, score, sort_order)
        values (
          v_part_id,
          coalesce(nullif((v_q ->> 'question_num')::smallint, 0), v_q_ord),
          nullif(v_q ->> 'content', ''),
          nullif(v_q ->> 'audio_url', ''),
          nullif(v_q ->> 'image_url', ''),
          coalesce(v_q ->> 'correct_answer', ''),
          nullif(v_q ->> 'explanation', ''),
          coalesce(nullif((v_q ->> 'score')::numeric, 0), 2.5),
          v_q_ord
        )
        returning id into v_q_id;

        insert into exam_options (question_id, label, content, image_url, sort_order)
        select v_q_id, o.value ->> 'label', coalesce(o.value ->> 'content', ''), nullif(o.value ->> 'image_url', ''), o.ordinality
        from jsonb_array_elements(coalesce(v_q -> 'options', '[]'::jsonb)) with ordinality as o;
      end loop;
    end loop;
  end loop;

  return v_exam_id;
end;
$$;

revoke all on function public.save_full_exam(jsonb) from public, anon;
grant execute on function public.save_full_exam(jsonb) to authenticated;

drop function if exists public.is_owner();
drop function if exists public.is_staff();
drop function if exists public.staff_role();
