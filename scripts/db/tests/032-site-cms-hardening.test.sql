-- Kiểm tra migration 032 — luôn kèm --dry-run:
--   node scripts/db/run-sql.mjs --dry-run src/app/features/landing/data/032-site-cms-hardening.sql scripts/db/tests/032-site-cms-hardening.test.sql

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
  v_ids uuid[];
  v_stamp timestamptz;
  v_logs integer;
  v_cat text := (select category from public.site_posts where category <> '' group by category order by count(*) desc limit 1);
begin
  -- Đổi thứ tự: đảo 2 bài đầu, updated_at không đổi
  select array_agg(id order by sort_order, created_at) into v_ids from public.site_posts;
  select updated_at into v_stamp from public.site_posts where id = v_ids[1];
  set local role authenticated;
  perform pg_temp.act_as(v_admin);
  perform public.reorder_site_posts(array[v_ids[2], v_ids[1]] || v_ids[3:]);
  reset role;
  assert (select sort_order from public.site_posts where id = v_ids[2]) = 1, 'bài 2 lên đầu';
  assert (select updated_at from public.site_posts where id = v_ids[1]) = v_stamp, 'updated_at giữ nguyên khi chỉ đổi thứ tự';

  -- Sửa nội dung vẫn đổi updated_at
  set local role authenticated;
  perform pg_temp.act_as(v_admin);
  update public.site_posts set excerpt = excerpt || ' ' where id = v_ids[1];
  reset role;
  assert (select updated_at from public.site_posts where id = v_ids[1]) > v_stamp, 'sửa nội dung đổi updated_at';

  -- Đổi tên chuyên mục: 1 dòng nhật ký
  v_logs := (select count(*) from public.activity_log where entity_type = 'site');
  set local role authenticated;
  perform pg_temp.act_as(v_admin);
  assert public.rename_story_category(v_cat, v_cat || ' 032') >= 1, 'đổi tên';
  reset role;
  assert (select count(*) from public.activity_log where entity_type = 'site') = v_logs + 1, '1 dòng nhật ký';

  -- Học viên không gọi được RPC sửa
  set local role authenticated;
  perform pg_temp.act_as(v_learner);
  begin
    perform public.reorder_site_posts(v_ids);
    raise exception 'học viên đổi được thứ tự';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.rename_story_category(v_cat || ' 032', 'x');
    raise exception 'học viên đổi được chuyên mục';
  exception when insufficient_privilege then null;
  end;
  -- ...nhưng đọc được tên khóa, kể cả khóa ẩn
  assert (select count(*) from public.site_course_names()) = (select count(*) from public.site_courses), 'đủ tên khóa';
  begin
    perform updated_by from public.site_posts limit 1;
    raise exception 'đọc được updated_by';
  exception when insufficient_privilege then null;
  end;
  reset role;

  -- Không xoá được khóa có lớp
  insert into public.classes (code, name, course_slug) values ('T032', 'Lớp thử 032', 'gia-su');
  set local role authenticated;
  perform pg_temp.act_as(v_admin);
  begin
    delete from public.site_courses where slug = 'gia-su';
    raise exception 'xoá được khóa có lớp';
  exception when foreign_key_violation then null;
  end;
  reset role;

  -- Khách vẫn đọc được trang công khai
  set local role anon;
  perform pg_temp.act_as(null);
  assert (select count(*) from (select id, content, updated_at from public.site_sections) x) = 6, 'anon đọc site_sections';
  assert (select count(*) from (select slug, title, images from public.site_posts) x) >= 1, 'anon đọc site_posts';
  reset role;
  raise notice '032 OK';
end;
$$;
