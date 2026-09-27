-- ==============================================================================
-- 012 — PHÂN QUYỀN NHÂN SỰ: owner / editor
-- ==============================================================================
-- app_metadata.role (chỉ đặt được bằng SQL / service role, xem scripts/db/create-admin.mjs):
--   owner  — toàn quyền (xem, thêm, sửa, XOÁ).
--   editor — xem, thêm, sửa; không được xoá.
-- Vai trò mới sau này (lớp học, học viên...) chỉ cần thêm vào is_staff() / policy riêng.
-- Thay thế public.is_admin() của 008.

create or replace function public.staff_role()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.staff_role() in ('owner', 'editor')
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.staff_role() = 'owner'
$$;

grant execute on function public.staff_role(), public.is_staff(), public.is_owner() to anon, authenticated;

-- ------------------------------------------------------------------------------
-- Bảng exam_* và vocab_cards: đọc/thêm/sửa = staff, xoá = owner
-- ------------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['exams', 'exam_sections', 'exam_parts', 'exam_questions', 'exam_options', 'vocab_cards'] loop
    execute format('drop policy if exists %I on public.%I', t || ' admin write', t);
    execute format('drop policy if exists %I on public.%I', t || ' staff insert', t);
    execute format('drop policy if exists %I on public.%I', t || ' staff update', t);
    execute format('drop policy if exists %I on public.%I', t || ' owner delete', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select public.is_staff()))', t || ' staff insert', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()))', t || ' staff update', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select public.is_owner()))', t || ' owner delete', t);
  end loop;
end $$;

-- Đọc đề nháp / đầy đủ: staff (thay is_admin trong policy đọc của 008)
drop policy if exists "exams read" on exams;
create policy "exams read" on exams for select
  using (is_published or (select public.is_staff()));

drop policy if exists "exam_sections read" on exam_sections;
create policy "exam_sections read" on exam_sections for select
  using (
    (select public.is_staff())
    or exists (select 1 from exams e where e.id = exam_sections.exam_id and e.is_published)
  );

drop policy if exists "exam_parts read" on exam_parts;
create policy "exam_parts read" on exam_parts for select
  using (
    (select public.is_staff())
    or exists (
      select 1 from exam_sections s join exams e on e.id = s.exam_id
      where s.id = exam_parts.section_id and e.is_published
    )
  );

drop policy if exists "exam_questions read" on exam_questions;
create policy "exam_questions read" on exam_questions for select
  using (
    (select public.is_staff())
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
    (select public.is_staff())
    or exists (
      select 1 from exam_questions q
      join exam_parts p on p.id = q.part_id
      join exam_sections s on s.id = p.section_id
      join exams e on e.id = s.exam_id
      where q.id = exam_options.question_id and e.is_published
    )
  );

-- ------------------------------------------------------------------------------
-- Storage exam-assets: staff tải lên / ghi đè, owner xoá
-- ------------------------------------------------------------------------------
drop policy if exists "exam-assets insert" on storage.objects;
drop policy if exists "exam-assets update" on storage.objects;
drop policy if exists "exam-assets delete" on storage.objects;
create policy "exam-assets insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'exam-assets' and (select public.is_staff()));
create policy "exam-assets update" on storage.objects for update to authenticated
  using (bucket_id = 'exam-assets' and (select public.is_staff()))
  with check (bucket_id = 'exam-assets' and (select public.is_staff()));
create policy "exam-assets delete" on storage.objects for delete to authenticated
  using (bucket_id = 'exam-assets' and (select public.is_owner()));

-- ------------------------------------------------------------------------------
-- Hàm dùng is_admin() → is_staff()
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
    and (e.is_published or public.is_staff())
$$;

-- save_full_exam: với người dùng, lưu lại đề là "sửa", dù bên trong phải thay toàn bộ phần con.
-- SECURITY DEFINER để editor (không có quyền DELETE) vẫn lưu được; hàm tự kiểm tra is_staff().
-- Thân hàm giống 010, chỉ khác kiểm tra quyền và security definer.
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
  if not public.is_staff() then
    raise exception 'Chỉ quản trị viên mới được lưu đề thi' using errcode = '42501';
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

    -- Cascade xoá parts / questions / options cũ
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

drop function if exists public.is_admin();

-- ------------------------------------------------------------------------------
-- Tài khoản hiện có: admin + MaiLN = owner, còn lại = editor
-- ------------------------------------------------------------------------------
update auth.users
set raw_app_meta_data = raw_app_meta_data || jsonb_build_object(
  'role',
  case when email in ('admin@mayocreativechinese.edu.vn', 'mailn@mayocreativechinese.edu.vn') then 'owner' else 'editor' end
)
where raw_app_meta_data ->> 'role' = 'admin';
