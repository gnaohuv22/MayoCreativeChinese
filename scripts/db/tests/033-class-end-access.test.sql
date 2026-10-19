-- Kiểm tra migration 033 — luôn kèm --dry-run:
--   node scripts/db/run-sql.mjs --dry-run src/app/features/classes/data/033-class-end-access.sql scripts/db/tests/033-class-end-access.test.sql

create or replace function pg_temp.act_as(p_user uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

do $$
declare
  v_student uuid := (select user_id from public.student_profiles
                     where account_type = 'student' and status = 'active' limit 1);
  v_class uuid;
  v_ctx jsonb;
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  if v_student is null then raise exception 'FAIL: không có học viên lớp nào để thử'; end if;

  insert into public.classes (code, name, status) values ('T033', 'Lớp thử 033', 'active') returning id into v_class;
  update public.student_profiles set class_id = v_class where user_id = v_student;
  perform pg_temp.act_as(v_student);

  -- Chưa có ngày kết thúc
  assert public.is_student(), 'lớp đang học, chưa có ngày kết thúc';
  v_ctx := public.my_student_context();
  assert (v_ctx ->> 'student_access')::boolean and v_ctx -> 'student_access_until' = 'null'::jsonb, 'ngữ cảnh chưa có hạn';

  -- Kết thúc hôm qua: còn trong 30 ngày gia hạn
  update public.classes set end_date = v_today - 1 where id = v_class;
  assert public.is_student(), 'trong thời gian gia hạn';
  assert (public.my_student_context() ->> 'student_access_until')::timestamptz > now(), 'hạn ở tương lai';

  -- Kết thúc 30 ngày trước: hết quyền học viên nhưng vẫn là người học
  update public.classes set end_date = v_today - 30 where id = v_class;
  assert not public.is_student(), 'hết gia hạn';
  assert public.is_learner(), 'vẫn là người học';
  assert not (public.my_student_context() ->> 'student_access')::boolean, 'ngữ cảnh báo hết quyền';

  -- Ngày kết thúc ở tương lai nhưng đã chuyển "finished" từ 31 ngày trước
  update public.classes set end_date = v_today + 60, status = 'finished' where id = v_class;
  assert (select finished_at from public.classes where id = v_class) is not null, 'trigger ghi finished_at';
  update public.classes set finished_at = now() - interval '31 days' where id = v_class;
  assert not public.is_student(), 'finished quá 30 ngày';

  -- Sửa lớp không đổi trạng thái thì giữ mốc cũ; mở lại lớp thì có quyền lại
  update public.classes set status = 'finished', name = 'Lớp thử 033 b' where id = v_class;
  assert not public.is_student(), 'giữ mốc finished cũ';
  update public.classes set status = 'active' where id = v_class;
  assert (select finished_at from public.classes where id = v_class) is null, 'mở lại xoá finished_at';
  assert public.is_student(), 'mở lại lớp';

  raise notice '033 OK';
end;
$$;
