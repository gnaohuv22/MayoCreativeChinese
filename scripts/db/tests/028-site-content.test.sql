-- Kiểm tra migration 028 — luôn kèm --dry-run:
--   node scripts/db/run-sql.mjs --dry-run src/app/features/landing/data/028-site-content.sql src/app/features/landing/data/028b-site-content-seed.sql src/app/features/landing/data/029-site-contact.sql src/app/features/landing/data/029b-site-contact-seed.sql scripts/db/tests/028-site-content.test.sql

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
  assert (select count(*) from public.site_sections) = 6, '6 khối';
  assert (select content #>> '{items,0,name,vi}' from public.site_sections where id = 'teachers') = 'Chị giáo Lưu Ngọc Mai', 'có giáo viên';

  -- Khách: đọc được, không sửa được
  set local role anon;
  perform pg_temp.act_as(null);
  assert (select count(*) from public.site_sections) = 6, 'anon đọc được';
  begin
    update public.site_sections set content = '{}' where id = 'hero';
    raise exception 'anon không được sửa';
  exception when insufficient_privilege then null;
  end;
  reset role;

  -- Học viên: RLS chặn (0 dòng)
  set local role authenticated;
  perform pg_temp.act_as(v_learner);
  update public.site_sections set content = '{"x":1}' where id = 'hero';
  get diagnostics v_rows = row_count;
  assert v_rows = 0, 'học viên không sửa được';
  begin
    insert into public.site_sections (id, content) values ('hero', '{}');
    raise exception 'không được thêm khối';
  exception when insufficient_privilege then null;
  end;

  -- Admin: sửa được, ghi nhật ký, updated_by = admin
  perform pg_temp.act_as(v_admin);
  update public.site_sections set content = jsonb_set(content, '{badge,vi}', '"Thử 028"') where id = 'hero';
  get diagnostics v_rows = row_count;
  assert v_rows = 1, 'admin sửa được';
  reset role;
  assert (select content #>> '{badge,vi}' from public.site_sections where id = 'hero') = 'Thử 028', 'đã lưu';
  assert (select updated_by from public.site_sections where id = 'hero') = v_admin, 'updated_by';
  assert (select count(*) from public.activity_log where entity_type = 'site') = v_logs + 1, 'có nhật ký';
  assert (select content ->> 'phone' from public.site_sections where id = 'contact') = '0353 149 176', 'có liên hệ';
  raise notice '028 OK';
end;
$$;
