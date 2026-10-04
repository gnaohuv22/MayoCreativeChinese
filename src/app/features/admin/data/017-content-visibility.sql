-- ==============================================================================
-- 017 — HIỂN THỊ 3 MỨC CHO ĐỀ THI VÀ TỪ VỰNG
-- ==============================================================================
--   private — bản nháp: chỉ thấy trong khu quản trị
--   staff   — nội bộ: nhân sự (content.read) học/thi được như thật; khách thấy "Sắp ra mắt"
--   public  — công khai cho mọi người
--
-- Đề thi: exams.visibility thay cho is_published. is_published được giữ lại dưới dạng
-- cột sinh tự động (visibility = 'public') để bản web cũ còn đọc được trong lúc deploy.
-- Khách đọc được dòng exams của đề nội bộ (tên, cấp — để hiện thẻ "Sắp ra mắt"),
-- nhưng không đọc được phần / câu hỏi / đáp án.
--
-- Từ vựng: vocab_level_visibility đặt mức cho từng (bộ, cấp). Không có dòng = public
-- (giữ nguyên hành vi trước 017). Đổi mức qua RPC set_vocab_visibility (có ghi nhật ký).
-- Chạy được nhiều lần.

-- ------------------------------------------------------------------------------
-- Đề thi
-- ------------------------------------------------------------------------------
alter table public.exams add column if not exists visibility text not null default 'private';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'exams_visibility_check') then
    alter table public.exams
      add constraint exams_visibility_check check (visibility in ('private', 'staff', 'public'));
  end if;
end $$;

-- Policy cũ tham chiếu is_published → bỏ trước khi đổi cột
drop policy if exists "exams read" on public.exams;
drop policy if exists "exam_sections read" on public.exam_sections;
drop policy if exists "exam_parts read" on public.exam_parts;
drop policy if exists "exam_questions read" on public.exam_questions;
drop policy if exists "exam_options read" on public.exam_options;

-- Chỉ chép dữ liệu từ is_published ở lần chạy đầu (khi cột còn là cột thường)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'exams' and column_name = 'is_published' and is_generated = 'NEVER'
  ) then
    -- Chuyển dữ liệu, không ghi nhật ký "Cập nhật N đề thi"
    alter table public.exams disable trigger trg_log_exams_update;
    update public.exams set visibility = case when is_published then 'public' else 'private' end;
    alter table public.exams enable trigger trg_log_exams_update;
    alter table public.exams drop column is_published;
    alter table public.exams add column is_published boolean generated always as (visibility = 'public') stored;
  end if;
end $$;

create index if not exists idx_exams_visibility on public.exams (visibility);

create policy "exams read" on public.exams for select
  using (visibility in ('staff', 'public') or (select public.has_permission('content.read')));

create policy "exam_sections read" on public.exam_sections for select
  using (
    (select public.has_permission('content.read'))
    or exists (select 1 from exams e where e.id = exam_sections.exam_id and e.visibility = 'public')
  );

create policy "exam_parts read" on public.exam_parts for select
  using (
    (select public.has_permission('content.read'))
    or exists (
      select 1 from exam_sections s join exams e on e.id = s.exam_id
      where s.id = exam_parts.section_id and e.visibility = 'public'
    )
  );

create policy "exam_questions read" on public.exam_questions for select
  using (
    (select public.has_permission('content.read'))
    or exists (
      select 1 from exam_parts p
      join exam_sections s on s.id = p.section_id
      join exams e on e.id = s.exam_id
      where p.id = exam_questions.part_id and e.visibility = 'public'
    )
  );

create policy "exam_options read" on public.exam_options for select
  using (
    (select public.has_permission('content.read'))
    or exists (
      select 1 from exam_questions q
      join exam_parts p on p.id = q.part_id
      join exam_sections s on s.id = p.section_id
      join exams e on e.id = s.exam_id
      where q.id = exam_options.question_id and e.visibility = 'public'
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
  join exams e on e.id = s.exam_id
  where e.id = p_exam_id
    and (e.visibility = 'public' or public.has_permission('content.read'))
$$;

-- save_full_exam: như 013, ghi visibility thay cho is_published.
-- Client cũ chỉ gửi is_published → true = public, còn lại = private.
create or replace function public.save_full_exam(p_exam jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exam_id uuid := nullif(p_exam ->> 'id', '')::uuid;
  v_visibility text := coalesce(
    nullif(p_exam ->> 'visibility', ''),
    case when (p_exam ->> 'is_published')::boolean then 'public' else 'private' end
  );
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
    insert into exams (title, hsk_level, hsk_version, duration_mins, total_score, passing_score, description, visibility)
    values (
      p_exam ->> 'title',
      (p_exam ->> 'hsk_level')::smallint,
      coalesce(p_exam ->> 'hsk_version', '2.0'),
      coalesce((p_exam ->> 'duration_mins')::smallint, 90),
      coalesce((p_exam ->> 'total_score')::smallint, 300),
      coalesce((p_exam ->> 'passing_score')::smallint, 180),
      nullif(p_exam ->> 'description', ''),
      v_visibility
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
      visibility    = v_visibility
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

-- Nhãn tiếng Việt của mức hiển thị (dùng trong nhật ký)
create or replace function public.visibility_label(p_visibility text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_visibility when 'public' then 'Công khai' when 'staff' then 'Nội bộ' else 'Bản nháp' end
$$;

-- Nhật ký đề thi: như 014, đổi mức hiển thị → publish / staff_only / unpublish
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
        v_action := case v_visibility when 'public' then 'publish' when 'staff' then 'staff_only' else 'unpublish' end;
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
create table if not exists public.vocab_level_visibility (
  collection varchar(20) not null check (collection in ('hsk2', 'hsk3', 'combined', 'supplement')),
  hsk_level  smallint not null check (hsk_level between 1 and 9),
  visibility text not null check (visibility in ('private', 'staff', 'public')),
  updated_at timestamptz not null default now(),
  primary key (collection, hsk_level)
);

alter table public.vocab_level_visibility enable row level security;
drop policy if exists "vocab_level_visibility read" on public.vocab_level_visibility;
create policy "vocab_level_visibility read" on public.vocab_level_visibility for select using (true);
revoke insert, update, delete, truncate on public.vocab_level_visibility from anon, authenticated;
grant select on public.vocab_level_visibility to anon, authenticated;

drop policy if exists "vocab_cards read" on public.vocab_cards;
create policy "vocab_cards read" on public.vocab_cards for select
  using (
    (select public.has_permission('content.read'))
    or not exists (
      select 1 from public.vocab_level_visibility v
      where v.collection = vocab_cards.collection
        and v.hsk_level = vocab_cards.hsk_level
        and v.visibility <> 'public'
    )
  );

-- Đặt mức hiển thị cho các cấp của 1 bộ (bộ HSK 1-9 gửi 7, 8, 9 cùng lúc)
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
  if p_visibility not in ('private', 'staff', 'public') then
    raise exception 'Mức hiển thị không hợp lệ: %', p_visibility using errcode = '22023';
  end if;
  if coalesce(cardinality(p_levels), 0) = 0 then
    return;
  end if;

  insert into vocab_level_visibility (collection, hsk_level, visibility, updated_at)
  select p_collection, l, p_visibility, now() from unnest(p_levels) l
  on conflict (collection, hsk_level) do update set visibility = excluded.visibility, updated_at = excluded.updated_at;

  perform write_activity(
    case p_visibility when 'public' then 'publish' when 'staff' then 'staff_only' else 'unpublish' end,
    'vocab', 1,
    format('Đổi từ vựng %s cấp %s sang %s', v_label, v_levels, visibility_label(p_visibility)),
    jsonb_build_object('collection', p_collection, 'levels', to_jsonb(p_levels), 'visibility', p_visibility));
end;
$$;

revoke all on function public.set_vocab_visibility(text, smallint[], text) from public, anon;
grant execute on function public.set_vocab_visibility(text, smallint[], text) to authenticated;
