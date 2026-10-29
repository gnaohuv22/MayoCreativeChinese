-- 035: Server-derived practice results and answer release. Apply as a NEW migration.
-- Existing attempts are retained as legacy-client and do not unlock answer keys.
-- Practice policy: an authenticated learner may review/retry after one server-graded
-- submission. This does not implement a closed-book, one-shot assessment or a trusted timer.

alter table public.exam_attempts add column if not exists grading_version text not null default 'legacy-client';

-- RLS restricts rows, not columns. Every authenticated learner shares this role.
revoke select on public.exam_questions from public, anon, authenticated;
revoke select (correct_answer, explanation) on public.exam_questions from public, anon, authenticated;
grant select (id, part_id, question_num, content, audio_url, image_url, score, sort_order, created_at)
  on public.exam_questions to anon, authenticated;
revoke insert, update, delete on public.exam_attempts from public, anon, authenticated;

-- Canonical ordering representation: numeric/circled orders become the token sentence.
-- Comparing token sentences also treats identical duplicate words as interchangeable.
create or replace function public.exam_ordering_key(p_answer text, p_content text)
returns text language plpgsql immutable set search_path = '' as $$
declare
  v text := trim(coalesce(p_answer, ''));
  marks text := '';
  token text[];
  words jsonb := '{}'::jsonb;
  part text;
  n integer;
  result text := '';
begin
  for token in select regexp_matches(coalesce(p_content, ''), '([①-⑳])\s*([^①-⑳]*)', 'g') loop
    if trim(token[2]) <> '' and not words ? token[1] then words := words || jsonb_build_object(token[1], trim(token[2])); end if;
  end loop;
  select coalesce(string_agg(m[1], ''), '') into marks from regexp_matches(v, '([①-⑳])', 'g') m;
  if marks = '' and v ~ '^[0-9\s,.–>→-]+$' then
    if v ~ '^[0-9]+$' then
      for part in select regexp_split_to_table(v, '') loop
        n := part::integer;
        if n < 1 or n > (case when words = '{}' then 20 else (select count(*) from jsonb_object_keys(words)) end) then return lower(regexp_replace(v, '\s', '', 'g')); end if;
        marks := marks || chr(9311+n);
      end loop;
    else
      for token in select regexp_matches(v, '([0-9]+)', 'g') loop
        n := token[1]::integer;
        if n < 1 or n > 20 then return lower(regexp_replace(v, '\s', '', 'g')); end if;
        marks := marks || chr(9311+n);
      end loop;
    end if;
  end if;
  if marks <> '' then
    if words = '{}' then return marks; end if;
    for part in select regexp_split_to_table(marks, '') loop
      if not words ? part then return marks; end if;
      result := result || (words ->> part);
    end loop;
    v := result;
  end if;
  return lower(regexp_replace(v, '[\s。，、！？!?,.;；:："“”''‘’…]', '', 'g'));
end $$;

create or replace function public.exam_answer_matches(p_user text, p_correct text, p_type text, p_content text)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  u text := lower(trim(coalesce(p_user, '')));
  c text := lower(trim(coalesce(p_correct, '')));
  alt text;
begin
  if u = '' then return false; end if;
  if p_type = 'ordering' then
    for alt in select regexp_split_to_table(coalesce(p_correct, ''), '/|\||hoặc', 'i') loop
      if public.exam_ordering_key(p_user, p_content) = public.exam_ordering_key(alt, p_content) then return true; end if;
    end loop;
    return false;
  end if;
  if p_type = 'true_false' then
    if c = any(array['true','t','1','đúng','dung','对','dui']) then return u = any(array['true','t','1','đúng','dung','对','dui']); end if;
    if c = any(array['false','f','0','sai','错','cuo']) then return u = any(array['false','f','0','sai','错','cuo']); end if;
  end if;
  u := regexp_replace(u, '\s', '', 'g');
  for alt in select regexp_split_to_table(c, '[/|,]|hoặc') loop
    if u = regexp_replace(trim(alt), '\s', '', 'g') then return true; end if;
  end loop;
  return u = regexp_replace(c, '\s', '', 'g');
end $$;

create or replace function public.submit_exam_attempt(p_attempt jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_exam_id uuid := (p_attempt ->> 'exam_id')::uuid;
  v_exam public.exams%rowtype;
  v_answers jsonb := coalesce(p_attempt -> 'answers', '{}'::jsonb);
  v_secs integer := nullif(p_attempt ->> 'time_spent_secs', '')::integer;
  v_id uuid;
  v_sections jsonb;
  v_earned numeric;
  v_possible numeric;
  v_correct integer;
  v_count integer;
begin
  if auth.uid() is null or not public.is_learner() or not public.can_view_exam(v_exam_id) then
    raise exception 'Exam access denied' using errcode = '42501';
  end if;
  if jsonb_typeof(v_answers) is distinct from 'object' or octet_length(v_answers::text) > 1048576 or v_secs < 0 or v_secs > 86400 then
    raise exception 'Invalid attempt' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_each(v_answers) a where jsonb_typeof(a.value) <> 'string' or length(a.value #>> '{}') > 10000
    or not exists (select 1 from public.exam_questions q join public.exam_parts p on p.id = q.part_id join public.exam_sections s on s.id = p.section_id where s.exam_id = v_exam_id and q.id::text = a.key)) then
    raise exception 'Invalid answers' using errcode = '22023';
  end if;
  select * into strict v_exam from public.exams where id = v_exam_id;
  with graded as (
    select s.id, s.section_type, s.title, s.sort_order, coalesce(nullif(s.max_score,0),100) as section_max,
      coalesce(nullif(q.score,0),2.5) as possible,
      public.exam_answer_matches(v_answers ->> q.id::text, q.correct_answer, p.question_type, q.content) as correct
    from public.exam_sections s join public.exam_parts p on p.section_id = s.id join public.exam_questions q on q.part_id = p.id
    where s.exam_id = v_exam_id
  ), sections as (
    select id, section_type, title, sort_order, section_max, sum(possible) as possible,
      sum(case when correct then possible else 0 end) as earned, count(*) as count,
      count(*) filter (where correct) as correct from graded group by id, section_type, title, sort_order, section_max
  )
  select sum(earned), sum(possible), sum(correct), sum(count),
    jsonb_agg(jsonb_build_object('section_type', section_type, 'title', title,
      'score', round(earned / nullif(possible,0) * section_max,1), 'max_score', section_max) order by sort_order)
  into v_earned, v_possible, v_correct, v_count, v_sections from sections;
  if coalesce(v_count,0) = 0 then raise exception 'Empty exam' using errcode = '22023'; end if;
  insert into public.exam_attempts(student_id,class_id,exam_id,score,total_score,passing_score,correct_count,question_count,section_scores,answers,time_spent_secs,grading_version)
  values(auth.uid(),public.my_class_id(),v_exam_id,
    round(v_earned/nullif(v_possible,0)*coalesce(nullif(v_exam.total_score,0),300),1),
    coalesce(nullif(v_exam.total_score,0),300),coalesce(nullif(v_exam.passing_score,0),180),
    v_correct,v_count,v_sections,v_answers,v_secs,'server-v1') returning id into v_id;
  return v_id;
end $$;

create or replace function public.get_exam_answers(p_exam_id uuid)
returns table(question_id uuid, correct_answer text, explanation text)
language sql stable security definer set search_path = '' as $$
  select q.id,q.correct_answer,q.explanation from public.exam_questions q
  join public.exam_parts p on p.id=q.part_id join public.exam_sections s on s.id=p.section_id
  where s.exam_id=p_exam_id and public.can_view_exam(p_exam_id)
    and (public.has_permission('content.read') or (auth.uid() is not null and public.is_learner() and exists (
      select 1 from public.exam_attempts a where a.exam_id=p_exam_id and a.student_id=auth.uid() and a.grading_version='server-v1'
    )))
$$;
revoke all on function public.submit_exam_attempt(jsonb), public.get_exam_answers(uuid) from public, anon;
grant execute on function public.submit_exam_attempt(jsonb), public.get_exam_answers(uuid) to authenticated;
revoke all on function public.exam_answer_matches(text,text,text,text), public.exam_ordering_key(text,text) from public, anon, authenticated;
