-- Kiểm tra migration 031 — luôn kèm --dry-run:
--   node scripts/db/run-sql.mjs --dry-run src/app/features/courses/data/031-site-courses.sql src/app/features/courses/data/031b-site-courses-seed.sql scripts/db/tests/031-site-courses.test.sql

create or replace function pg_temp.act_as(p_user uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claims',
           case when p_user is null then '{"role":"anon"}'
                else json_build_object('sub', p_user, 'role', 'authenticated')::text end, true);
$$;

do $$
declare
  v_admin uuid := (select user_id from public.staff_profiles where username = 'admin');
  v_learner uuid := (select user_id from public.student_profiles limit 1);
  v_rows integer;
  v_logs integer := (select count(*) from public.activity_log where entity_type = 'site');
begin
  assert (select count(*) from public.site_courses) = 5, '5 khóa';
  assert (select jsonb_array_length(content -> 'tracks') from public.site_courses where slug = 'tieng-trung-tre-em') = 3, '3 chặng';

  -- Admin: sửa nội dung, ẩn khóa, không đổi được slug
  set local role authenticated;
  perform pg_temp.act_as(v_admin);
  update public.site_courses set content = jsonb_set(content, '{goal}', '"Thử 031"'), is_published = false where slug = 'gia-su';
  get diagnostics v_rows = row_count;
  assert v_rows = 1, 'admin sửa được';
  begin
    update public.site_courses set slug = 'gia-su-2' where slug = 'gia-su';
    raise exception 'đổi được slug';
  exception when insufficient_privilege then null;
  end;
  insert into public.site_courses (slug, name) values ('khoa-thu-031', 'Khóa thử');
  delete from public.site_courses where slug = 'khoa-thu-031';
  reset role;
  assert (select count(*) from public.activity_log where entity_type = 'site') = v_logs + 3, 'sửa + thêm + xoá có nhật ký';

  -- Khách: không thấy khóa đã ẩn, không ghi được
  set local role anon;
  perform pg_temp.act_as(null);
  assert (select count(*) from public.site_courses) = 4, 'anon không thấy khóa ẩn';
  begin
    update public.site_courses set name = 'x';
    raise exception 'anon không được sửa';
  exception when insufficient_privilege then null;
  end;
  reset role;

  -- Học viên: RLS chặn
  set local role authenticated;
  perform pg_temp.act_as(v_learner);
  update public.site_courses set name = 'x';
  get diagnostics v_rows = row_count;
  assert v_rows = 0, 'học viên không sửa được';
  reset role;
  raise notice '031 OK';
end;
$$;
