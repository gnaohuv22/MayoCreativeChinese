-- ==============================================================================
-- 027 — NGÀY HỌC (STREAK) + TỔNG QUAN HỌC VIÊN / NHÂN SỰ
-- ==============================================================================
--   learner_study_days  — mỗi học viên 1 dòng / ngày (giờ Việt Nam): số lượt ôn từ, số bài thi.
--                         Ghi tự động bằng trigger khi tiến độ flashcard tăng hoặc nộp bài thi.
--   my_learning_summary — học viên: chuỗi ngày học, 7 ngày gần nhất, số từ, bài thi
--   staff_dashboard     — nhân sự: lớp mình phụ trách (tiến độ, học viên vắng, bài thi gần đây);
--                         thêm phần Mayo+ (sắp hết hạn, đã hết hạn, mức sử dụng) cho người có access.manage
-- Chạy được nhiều lần.

create table if not exists public.learner_study_days (
  user_id uuid not null references public.student_profiles(user_id) on delete cascade,
  day     date not null,
  reviews integer not null default 0,
  exams   integer not null default 0,
  primary key (user_id, day)
);
alter table public.learner_study_days enable row level security;
revoke all on public.learner_study_days from public, anon, authenticated;

create or replace function private.vn_day(p_at timestamptz)
returns date
language sql
stable
as $$ select (coalesce(p_at, now()) at time zone 'Asia/Ho_Chi_Minh')::date $$;

-- Tiến độ flashcard tăng lượt ôn → cộng vào ngày ôn (theo last_reviewed, nên tải tiến độ cũ lên vẫn đúng ngày)
create or replace function private.track_review_day()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delta integer := new.review_count - coalesce(case when tg_op = 'UPDATE' then old.review_count end, 0);
begin
  if v_delta > 0 and exists (select 1 from public.student_profiles where user_id = new.student_id) then
    insert into public.learner_study_days as d (user_id, day, reviews)
    values (new.student_id, private.vn_day(new.last_reviewed), v_delta)
    on conflict (user_id, day) do update set reviews = d.reviews + excluded.reviews;
  end if;
  return null;
end;
$$;

drop trigger if exists track_review_day on public.student_card_progress;
create trigger track_review_day after insert or update of review_count on public.student_card_progress
  for each row execute function private.track_review_day();

create or replace function private.track_exam_day()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.student_profiles where user_id = new.student_id) then
    insert into public.learner_study_days as d (user_id, day, exams)
    values (new.student_id, private.vn_day(new.submitted_at), 1)
    on conflict (user_id, day) do update set exams = d.exams + 1;
  end if;
  return null;
end;
$$;

drop trigger if exists track_exam_day on public.exam_attempts;
create trigger track_exam_day after insert on public.exam_attempts
  for each row execute function private.track_exam_day();

-- Dữ liệu cũ: mỗi thẻ đã ôn tính 1 lượt vào ngày ôn gần nhất, mỗi bài thi vào ngày nộp (chỉ chạy khi bảng trống)
insert into public.learner_study_days (user_id, day, reviews, exams)
select user_id, day, sum(reviews)::int, sum(exams)::int
from (
  select p.student_id as user_id, private.vn_day(p.last_reviewed) as day, 1 reviews, 0 exams
  from public.student_card_progress p join public.student_profiles sp on sp.user_id = p.student_id
  where p.review_count > 0 and p.last_reviewed is not null
  union all
  select a.student_id, private.vn_day(a.submitted_at), 0, 1
  from public.exam_attempts a join public.student_profiles sp on sp.user_id = a.student_id
) x
where not exists (select 1 from public.learner_study_days)
group by user_id, day;

-- Chuỗi ngày học: hiện tại (tính đến hôm nay hoặc hôm qua) và dài nhất
create or replace function private.study_streaks(p_user uuid)
returns table (current_streak integer, longest_streak integer, total_days integer, last_day date)
language sql
stable
as $$
  with days as (
    select day, day - (row_number() over (order by day))::int as grp
    from public.learner_study_days where user_id = p_user
  ), runs as (
    select min(day) first_day, max(day) last_day, count(*)::int len from days group by grp
  )
  select
    coalesce((select len from runs where last_day >= private.vn_day(now()) - 1 order by last_day desc limit 1), 0),
    coalesce((select max(len) from runs), 0),
    coalesce((select sum(len)::int from runs), 0),
    (select max(last_day) from runs)
$$;

-- ------------------------------------------------------------------------------
-- Học viên
-- ------------------------------------------------------------------------------
create or replace function public.my_learning_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_today date := private.vn_day(now());
  v_streak record;
begin
  if not is_learner() then
    return null;
  end if;
  select * into v_streak from private.study_streaks(auth.uid());
  return jsonb_build_object(
    'current_streak', v_streak.current_streak,
    'longest_streak', v_streak.longest_streak,
    'total_days', v_streak.total_days,
    'last_day', v_streak.last_day,
    'studied_today', exists (select 1 from learner_study_days where user_id = auth.uid() and day = v_today),
    'week', (
      select jsonb_agg(jsonb_build_object('day', g.day, 'reviews', coalesce(d.reviews, 0), 'exams', coalesce(d.exams, 0)) order by g.day)
      from (select (v_today - i)::date as day from generate_series(0, 6) i) g
      left join learner_study_days d on d.user_id = auth.uid() and d.day = g.day
    ),
    'words_studied', (select count(*) from student_card_progress where student_id = auth.uid() and review_count > 0),
    'words_mastered', (select count(*) from student_card_progress where student_id = auth.uid() and confidence = 3),
    'exams_taken', (select count(*) from exam_attempts where student_id = auth.uid()),
    'exams_passed', (select count(*) from exam_attempts where student_id = auth.uid()
                       and passing_score is not null and score >= passing_score),
    'best_percent', (select round(max(score / nullif(total_score, 0)) * 100) from exam_attempts where student_id = auth.uid())
  );
end;
$$;

-- ------------------------------------------------------------------------------
-- Nhân sự
-- ------------------------------------------------------------------------------
create or replace function public.staff_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_today date := private.vn_day(now());
  v_all boolean := has_permission('class.all');
  v_result jsonb;
begin
  if not exists (select 1 from staff_profiles where user_id = auth.uid() and status = 'active') then
    raise exception 'Chỉ dành cho nhân sự' using errcode = '42501';
  end if;

  with my_classes as (
    select c.* from classes c where c.archived_at is null and can_manage_class(c.id)
  ), class_students as (
    select sp.user_id, sp.full_name, sp.class_id from student_profiles sp
    join my_classes c on c.id = sp.class_id where sp.status = 'active'
  )
  select jsonb_build_object(
    'can_see_all', v_all,
    'classes', coalesce((
      select jsonb_agg(row_to_json(x)::jsonb order by x.status_rank, x.code)
      from (
        select c.id, c.code, c.name, c.status, c.hsk_level, c.hsk_version,
               case c.status when 'active' then 0 when 'planned' then 1 else 2 end status_rank,
               (select count(*) from class_students s where s.class_id = c.id) students,
               (select count(distinct d.user_id) from learner_study_days d
                  join class_students s on s.user_id = d.user_id and s.class_id = c.id
                where d.day > v_today - 7) active_7d,
               (select round(avg(m.mastered)) from (
                  select (select count(*) from student_card_progress p where p.student_id = s.user_id and p.confidence = 3) mastered
                  from class_students s where s.class_id = c.id) m) mastered_avg,
               (select count(*) from exam_attempts a where a.class_id = c.id and a.submitted_at > now() - interval '30 days') attempts_30d,
               (select round(avg(a.score / nullif(a.total_score, 0)) * 100) from exam_attempts a
                where a.class_id = c.id and a.submitted_at > now() - interval '30 days') avg_percent_30d,
               (select round(100.0 * count(*) filter (where a.score >= a.passing_score) / nullif(count(*) filter (where a.passing_score is not null), 0))
                from exam_attempts a where a.class_id = c.id and a.submitted_at > now() - interval '30 days') pass_rate_30d
        from my_classes c
      ) x), '[]'::jsonb),
    -- Học viên lớp không học ngày nào trong 7 ngày qua
    'inactive_students', coalesce((
      select jsonb_agg(row_to_json(x)::jsonb order by x.last_day nulls first, x.full_name)
      from (
        select s.user_id, s.full_name, c.code class_code, c.id class_id,
               (select max(day) from learner_study_days d where d.user_id = s.user_id) last_day
        from class_students s join my_classes c on c.id = s.class_id
        where c.status = 'active'
          and not exists (select 1 from learner_study_days d where d.user_id = s.user_id and d.day > v_today - 7)
        limit 30
      ) x), '[]'::jsonb),
    'recent_attempts', coalesce((
      select jsonb_agg(row_to_json(x)::jsonb order by x.submitted_at desc)
      from (
        select a.id, a.submitted_at, a.score, a.total_score, a.passing_score, a.time_spent_secs,
               sp.full_name, sp.account_type, c.code class_code, a.class_id, e.title exam_title, e.hsk_level, e.hsk_version
        from exam_attempts a
        join student_profiles sp on sp.user_id = a.student_id
        left join classes c on c.id = a.class_id
        left join exams e on e.id = a.exam_id
        where v_all or (a.class_id is not null and can_manage_class(a.class_id))
        order by a.submitted_at desc
        limit 15
      ) x), '[]'::jsonb)
  ) into v_result;

  if has_permission('access.manage') then
    v_result := v_result || jsonb_build_object('membership', jsonb_build_object(
      'active', (select count(distinct user_id) from access_grants where expires_at is null or expires_at > now()),
      'active_by_module', (select jsonb_object_agg(module, n) from (
          select module, count(*) n from access_grants where expires_at is null or expires_at > now() group by module) m),
      -- Thành viên Mayo+ có học trong 7 ngày qua
      'active_learning_7d', (select count(distinct g.user_id) from access_grants g
          where (g.expires_at is null or g.expires_at > now())
            and exists (select 1 from learner_study_days d where d.user_id = g.user_id and d.day > v_today - 7)),
      'expiring', coalesce((
        select jsonb_agg(row_to_json(x)::jsonb order by x.expires_at)
        from (
          select g.user_id, sp.full_name, sp.phone, sp.email, g.module, g.expires_at,
                 (select max(day) from learner_study_days d where d.user_id = g.user_id) last_day
          from access_grants g join student_profiles sp on sp.user_id = g.user_id
          where g.expires_at > now() and g.expires_at <= now() + interval '14 days'
        ) x), '[]'::jsonb),
      'expired', coalesce((
        select jsonb_agg(row_to_json(x)::jsonb order by x.expires_at desc)
        from (
          select g.user_id, sp.full_name, sp.phone, sp.email, g.module, g.expires_at,
                 (select max(day) from learner_study_days d where d.user_id = g.user_id) last_day
          from access_grants g join student_profiles sp on sp.user_id = g.user_id
          where g.expires_at <= now() and g.expires_at > now() - interval '30 days'
        ) x), '[]'::jsonb),
      'new_signups_7d', (select count(*) from student_profiles where account_type = 'guest' and created_at > now() - interval '7 days'),
      'guests', (select count(*) from student_profiles where account_type = 'guest' and status = 'active')
    ));
  end if;
  return v_result;
end;
$$;

revoke all on function public.my_learning_summary(), public.staff_dashboard() from public;
grant execute on function public.my_learning_summary(), public.staff_dashboard() to authenticated;
