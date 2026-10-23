-- Kiểm tra migration 034 — luôn kèm --dry-run:
--   node scripts/db/run-sql.mjs --dry-run src/app/features/classes/data/034-remove-from-class.sql scripts/db/tests/034-remove-from-class.test.sql

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
  v_admin uuid := (select user_id from public.staff_profiles where role_id = 'admin' limit 1);
  v_teacher uuid := (select user_id from public.staff_profiles where role_id = 'staff' limit 1);
  v_class uuid;
begin
  if v_student is null or v_admin is null then raise exception 'FAIL: thiếu học viên / quản trị viên để thử'; end if;

  insert into public.classes (code, name, status) values ('T034', 'Lớp thử 034', 'active') returning id into v_class;
  update public.student_profiles set class_id = v_class where user_id = v_student;

  perform pg_temp.act_as(v_student);
  assert public.is_student(), 'đang trong lớp';

  -- Giáo viên không phụ trách lớp này thì không bỏ được
  if v_teacher is not null then
    perform pg_temp.act_as(v_teacher);
    begin
      perform public.remove_students_from_class(array[v_student]);
      raise exception 'FAIL: giáo viên ngoài lớp bỏ được học viên';
    exception when insufficient_privilege then null;
    end;
  end if;

  perform pg_temp.act_as(v_admin);
  assert public.remove_students_from_class(array[v_student]) = 1, 'bỏ 1 học viên';
  assert public.remove_students_from_class(array[v_student]) = 0, 'gọi lại không đổi gì';
  assert exists (select 1 from auth.users where id = v_student), 'tài khoản vẫn còn';
  assert (select class_id is null and status = 'active' and account_type = 'student'
          from public.student_profiles where user_id = v_student), 'chỉ bỏ lớp';

  perform pg_temp.act_as(v_student);
  assert not public.is_student(), 'không còn quyền học viên lớp';
  assert public.is_learner(), 'vẫn là người học';
  assert (public.my_student_context() -> 'class') = 'null'::jsonb, 'ngữ cảnh không còn lớp';

  raise notice '034 OK';
end;
$$;
