-- Kiểm tra migration 027 — luôn kèm --dry-run:
--   node scripts/db/run-sql.mjs --dry-run src/app/features/classes/data/027-study-days-dashboards.sql scripts/db/tests/027-study-days-dashboards.test.sql

create or replace function pg_temp.act_as(p_user uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claims',
           case when p_user is null then '{"role":"anon"}'
                else json_build_object('sub', p_user, 'role', 'authenticated')::text end, true),
         set_config('request.headers', '{"x-mcc-client-ip":"203.0.113.27"}', true);
$$;

do $$
declare
  v_admin uuid := (select user_id from public.staff_profiles where username = 'admin');
  v_guest uuid;
  v_card bigint := (select min(id) from public.vocab_cards);
  v_card2 bigint := (select min(id) from public.vocab_cards where id > (select min(id) from public.vocab_cards));
  v_exam uuid := (select id from public.exams order by created_at limit 1);
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_sum jsonb;
  v_dash jsonb;
begin
  perform pg_temp.act_as(null);
  assert (public.register_guest('k027@example.com', '0399000271', 'abc12345', 'Khách 027', true) ->> 'ok')::boolean, 'tạo khách';
  select user_id into v_guest from public.student_profiles where username = '0399000271';

  -- Ôn từ 3 ngày liền (hôm kia, hôm qua, hôm nay) + 1 ngày cách xa → chuỗi hiện tại 3
  insert into public.student_card_progress (student_id, card_id, hsk_level, confidence, review_count, bookmarked, last_reviewed)
  values (v_guest, v_card, 1, 3, 1, false, now() - interval '2 days');
  update public.student_card_progress set review_count = 2, last_reviewed = now() - interval '1 day' where student_id = v_guest and card_id = v_card;
  update public.student_card_progress set review_count = 4, last_reviewed = now() where student_id = v_guest and card_id = v_card;
  update public.student_card_progress set bookmarked = true where student_id = v_guest and card_id = v_card;
  insert into public.student_card_progress (student_id, card_id, hsk_level, confidence, review_count, bookmarked, last_reviewed)
  values (v_guest, v_card2, 1, 1, 1, false, now() - interval '10 days');
  assert (select reviews from public.learner_study_days where user_id = v_guest and day = v_today) = 2, 'hôm nay +2 lượt';
  assert (select count(*) from public.learner_study_days where user_id = v_guest) = 4, '4 ngày học';

  insert into public.exam_attempts (student_id, exam_id, score, total_score, passing_score, correct_count, question_count)
  values (v_guest, v_exam, 150, 200, 120, 30, 40);
  assert (select exams from public.learner_study_days where user_id = v_guest and day = v_today) = 1, 'bài thi tính vào ngày học';

  perform pg_temp.act_as(v_guest);
  v_sum := public.my_learning_summary();
  assert (v_sum ->> 'current_streak')::int = 3, 'chuỗi hiện tại 3: ' || v_sum::text;
  assert (v_sum ->> 'longest_streak')::int = 3 and (v_sum ->> 'total_days')::int = 4, 'dài nhất 3, tổng 4';
  assert (v_sum ->> 'studied_today')::boolean, 'hôm nay đã học';
  assert jsonb_array_length(v_sum -> 'week') = 7, '7 ngày';
  assert (v_sum ->> 'words_mastered')::int = 1 and (v_sum ->> 'words_studied')::int = 2, 'số từ';
  assert (v_sum ->> 'exams_passed')::int = 1 and (v_sum ->> 'best_percent')::int = 75, 'bài thi';

  -- Nghỉ 2 ngày → chuỗi về 0
  update public.learner_study_days set day = day - 3 where user_id = v_guest;
  assert (public.my_learning_summary() ->> 'current_streak')::int = 0, 'nghỉ 2 ngày → mất chuỗi';

  -- Khách không xem được tổng quan nhân sự
  begin
    perform public.staff_dashboard();
    raise exception 'FAIL: khách xem được tổng quan nhân sự';
  exception when insufficient_privilege then null;
  end;

  -- Admin: thấy bài thi gần đây và phần Mayo+
  perform pg_temp.act_as(v_admin);
  perform public.grant_access(array[v_guest], array['exams'], now() + interval '5 days');
  v_dash := public.staff_dashboard();
  assert v_dash ? 'membership', 'admin có phần Mayo+';
  assert exists (select 1 from jsonb_array_elements(v_dash -> 'membership' -> 'expiring') e where e ->> 'full_name' = 'Khách 027'), 'sắp hết hạn có khách 027';
  assert exists (select 1 from jsonb_array_elements(v_dash -> 'recent_attempts') e where e ->> 'full_name' = 'Khách 027'), 'bài thi gần đây';
  assert jsonb_typeof(v_dash -> 'classes') = 'array', 'danh sách lớp';

  raise notice 'TẤT CẢ ĐẠT';
end $$;
