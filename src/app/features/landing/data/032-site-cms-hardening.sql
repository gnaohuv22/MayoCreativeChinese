-- ==============================================================================
-- 032 — SIẾT LẠI CMS TRANG CHỦ (sau review 028–031)
-- ==============================================================================
-- 1. Đổi thứ tự bài / khóa: 1 RPC, 1 transaction, chỉ ghi dòng đổi vị trí, KHÔNG đổi updated_at
--    (trước đây mỗi dòng 1 PATCH, updated_at nhảy → client nhận stamp mới mà không tải lại nội dung,
--    có thể ghi đè bài người khác vừa sửa; hoặc báo xung đột giả cho người đang mở bài).
-- 2. Đổi tên chuyên mục: 1 RPC, 1 dòng nhật ký thay vì 1 dòng / bài.
-- 3. Không xoá được khóa học đang có lớp gắn vào (classes.course_slug, 019).
-- 4. updated_by (id tài khoản quản trị) không còn đọc được qua API.

-- ------------------------------------------------------------------------------
-- 1. updated_at chỉ đổi khi nội dung đổi (đổi sort_order không tính)
-- ------------------------------------------------------------------------------
create or replace function public.touch_site_row()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (to_jsonb(new) - 'sort_order' - 'updated_at' - 'updated_by') is not distinct from
     (to_jsonb(old) - 'sort_order' - 'updated_at' - 'updated_by') then
    new.updated_at := old.updated_at;
    new.updated_by := old.updated_by;
  else
    new.updated_at := now();
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists site_posts_touch on public.site_posts;
create trigger site_posts_touch before update on public.site_posts
  for each row execute function public.touch_site_row();
drop trigger if exists site_courses_touch on public.site_courses;
create trigger site_courses_touch before update on public.site_courses
  for each row execute function public.touch_site_row();

-- Quyền gọi do RLS update của bảng quyết định (security invoker) — thêm kiểm tra để báo lỗi rõ
create or replace function public.reorder_site_posts(p_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.has_permission('site.manage') then
    raise exception 'Không có quyền sửa trang chủ' using errcode = '42501';
  end if;
  update public.site_posts p set sort_order = o.pos
  from unnest(p_ids) with ordinality as o(id, pos)
  where p.id = o.id and p.sort_order is distinct from o.pos::integer;
end;
$$;

create or replace function public.reorder_site_courses(p_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.has_permission('site.manage') then
    raise exception 'Không có quyền sửa trang chủ' using errcode = '42501';
  end if;
  update public.site_courses c set sort_order = o.pos
  from unnest(p_ids) with ordinality as o(id, pos)
  where c.id = o.id and c.sort_order is distinct from o.pos::integer;
end;
$$;

revoke all on function public.reorder_site_posts(uuid[]) from public, anon;
revoke all on function public.reorder_site_courses(uuid[]) from public, anon;
grant execute on function public.reorder_site_posts(uuid[]) to authenticated;
grant execute on function public.reorder_site_courses(uuid[]) to authenticated;

-- ------------------------------------------------------------------------------
-- 2. Đổi tên chuyên mục: 1 dòng nhật ký
-- ------------------------------------------------------------------------------
create or replace function public.log_site_post_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Đang trong rename_story_category(): hàm đó tự ghi 1 dòng
  if current_setting('mcc.bulk_post_change', true) = 'on' then
    return null;
  end if;
  if tg_op = 'INSERT' then
    perform write_activity('create', 'site', 1, format('Thêm câu chuyện “%s”', new.title), jsonb_build_object('post', new.id));
  elsif tg_op = 'DELETE' then
    perform write_activity('delete', 'site', 1, format('Xoá câu chuyện “%s”', old.title), jsonb_build_object('post', old.id));
  elsif (to_jsonb(old) - 'sort_order' - 'updated_at' - 'updated_by') is distinct from (to_jsonb(new) - 'sort_order' - 'updated_at' - 'updated_by') then
    perform write_activity('update', 'site', 1, format('Sửa câu chuyện “%s”', new.title), jsonb_build_object('post', new.id));
  end if;
  return null;
end;
$$;
revoke all on function public.log_site_post_change() from public, anon, authenticated;

-- security definer chỉ để ghi nhật ký (write_activity); quyền kiểm tra tường minh ở đầu hàm
create or replace function public.rename_story_category(p_from text, p_to text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not public.has_permission('site.manage') then
    raise exception 'Không có quyền sửa trang chủ' using errcode = '42501';
  end if;
  p_to := btrim(coalesce(p_to, ''));
  if p_to = '' or length(p_to) > 60 then
    raise exception 'Tên chuyên mục không hợp lệ' using errcode = '22023';
  end if;
  perform set_config('mcc.bulk_post_change', 'on', true);
  update public.site_posts set category = p_to where category = p_from;
  get diagnostics v_count = row_count;
  perform set_config('mcc.bulk_post_change', 'off', true);
  if v_count > 0 then
    perform public.write_activity('update', 'site', v_count,
      format('Đổi tên chuyên mục “%s” → “%s” (%s bài)', p_from, p_to, v_count),
      jsonb_build_object('from', p_from, 'to', p_to));
  end if;
  return v_count;
end;
$$;
revoke all on function public.rename_story_category(text, text) from public, anon;
grant execute on function public.rename_story_category(text, text) to authenticated;

-- ------------------------------------------------------------------------------
-- 3. Không xoá khóa đang có lớp
-- ------------------------------------------------------------------------------
create or replace function public.guard_site_course_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.classes where course_slug = old.slug;
  if v_count > 0 then
    raise exception 'Khóa học đang gắn với % lớp — đổi khóa của các lớp đó hoặc chỉ ẩn khóa thay vì xoá', v_count
      using errcode = '23503';
  end if;
  return old;
end;
$$;
revoke all on function public.guard_site_course_delete() from public, anon, authenticated;

drop trigger if exists site_courses_guard_delete on public.site_courses;
create trigger site_courses_guard_delete before delete on public.site_courses
  for each row execute function public.guard_site_course_delete();

-- ------------------------------------------------------------------------------
-- 4. Ẩn updated_by khỏi API (chỉ cấp quyền đọc từng cột)
-- ------------------------------------------------------------------------------
revoke select on public.site_sections, public.site_posts, public.site_courses from anon, authenticated;
grant select (id, content, updated_at) on public.site_sections to anon, authenticated;
grant select (id, slug, sort_order, is_published, category, title, excerpt, images, body, created_at, updated_at)
  on public.site_posts to anon, authenticated;
grant select (id, slug, sort_order, is_published, name, content, created_at, updated_at)
  on public.site_courses to anon, authenticated;

-- Hàm cũ không còn trigger nào dùng cho 2 bảng trên; site_sections vẫn dùng touch_site_section (028)

-- ------------------------------------------------------------------------------
-- 5. Tên khóa cho trang lớp học: mọi tài khoản đăng nhập đọc được cả khóa đang ẩn
--    (lớp học vẫn gắn khóa đã ẩn — trước 031 tên khóa luôn có trong code)
-- ------------------------------------------------------------------------------
create or replace function public.site_course_names()
returns table (slug text, name text, is_published boolean, audiences jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select c.slug, c.name, c.is_published, c.content -> 'audiences'
  from public.site_courses c
  order by c.sort_order, c.created_at
$$;
revoke all on function public.site_course_names() from public, anon;
grant execute on function public.site_course_names() to authenticated;
