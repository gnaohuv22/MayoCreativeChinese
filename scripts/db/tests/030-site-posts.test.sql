-- Kiểm tra migration 030 — luôn kèm --dry-run:
--   node scripts/db/run-sql.mjs --dry-run src/app/features/posts/data/030-site-posts.sql src/app/features/posts/data/030b-site-posts-seed.sql scripts/db/tests/030-site-posts.test.sql

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
  v_id uuid;
  v_logs integer := (select count(*) from public.activity_log where entity_type = 'site');
begin
  assert (select count(*) from public.site_posts) = 5, '5 bài';
  assert (select jsonb_array_length(images) from public.site_posts where slug = 'ket-qua-thi-hsk-18-07-2026') = 8, '8 ảnh';

  -- Admin: thêm bản nháp, sửa, đổi thứ tự (không ghi nhật ký), xoá
  set local role authenticated;
  perform pg_temp.act_as(v_admin);
  insert into public.site_posts (slug, title, is_published) values ('bai-thu-030', 'Bài thử 030', false) returning id into v_id;
  update public.site_posts set excerpt = 'Tóm tắt' where id = v_id;
  update public.site_posts set sort_order = 99 where id = v_id;
  assert (select count(*) from public.site_posts) = 6, 'admin thấy bản nháp';
  reset role;
  assert (select count(*) from public.activity_log where entity_type = 'site') = v_logs + 2, 'thêm + sửa có nhật ký, đổi thứ tự không';
  assert (select updated_by from public.site_posts where id = v_id) = v_admin, 'updated_by';

  begin
    insert into public.site_posts (slug, title) values ('Sai Slug', 'x');
    raise exception 'slug sai vẫn vào';
  exception when check_violation then null;
  end;

  -- Khách: chỉ thấy bài đã xuất bản, không ghi được
  set local role anon;
  perform pg_temp.act_as(null);
  assert (select count(*) from public.site_posts) = 5, 'anon không thấy bản nháp';
  begin
    update public.site_posts set title = 'x';
    raise exception 'anon không được sửa';
  exception when insufficient_privilege then null;
  end;
  reset role;

  -- Học viên: RLS chặn
  set local role authenticated;
  perform pg_temp.act_as(v_learner);
  update public.site_posts set title = 'x';
  get diagnostics v_rows = row_count;
  assert v_rows = 0, 'học viên không sửa được';
  delete from public.site_posts;
  get diagnostics v_rows = row_count;
  assert v_rows = 0, 'học viên không xoá được';

  perform pg_temp.act_as(v_admin);
  delete from public.site_posts where id = v_id;
  get diagnostics v_rows = row_count;
  assert v_rows = 1, 'admin xoá được';
  reset role;
  raise notice '030 OK';
end;
$$;
