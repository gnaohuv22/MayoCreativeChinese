-- ==============================================================================
-- 010 — RPC save_full_exam(p_exam jsonb) → uuid
-- ==============================================================================
-- Lưu toàn bộ đề (exam → sections → parts → questions → options) trong MỘT
-- transaction: lỗi ở bất kỳ bước nào sẽ rollback toàn bộ, đề cũ giữ nguyên.
-- SECURITY INVOKER: RLS (008) vẫn áp dụng; kiểm tra admin sớm để báo lỗi rõ ràng.
-- p_exam có dạng giống interface Exam ở exam.model.ts (có hoặc không có "id").

create or replace function public.save_full_exam(p_exam jsonb)
returns uuid
language plpgsql
security invoker
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
  if not public.is_admin() then
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
