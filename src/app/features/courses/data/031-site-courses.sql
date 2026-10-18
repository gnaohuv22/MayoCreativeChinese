-- ==============================================================================
-- 031 — TRANG CHI TIẾT KHÓA HỌC SỬA ĐƯỢC TRONG /admin/courses
-- ==============================================================================
-- Mỗi khóa = 1 dòng site_courses. slug là đường dẫn /khoa-hoc/<slug> và là khoá mà
-- classes.course_slug trỏ tới (019) — khu quản trị không cho đổi slug sau khi tạo.
-- content = phần còn lại của CourseDetail (features/courses/models/course-detail.model.ts):
--   goal, lead, chips, stats, blocks, info, tracks?, audiences?, audienceNote?, banner?, cardId
-- Khóa đã xuất bản ai cũng đọc được; bản nháp và mọi thao tác ghi cần quyền site.manage (028).
-- Nội dung ban đầu: 031b-site-courses-seed.sql (chạy ngay sau file này).

create table if not exists public.site_courses (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 120),
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  name         text not null check (length(btrim(name)) > 0),
  content      jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users(id) on delete set null
);

create index if not exists idx_site_courses_order on public.site_courses (sort_order, created_at);

drop trigger if exists site_courses_touch on public.site_courses;
create trigger site_courses_touch before update on public.site_courses
  for each row execute function public.touch_site_section();

alter table public.site_courses enable row level security;
drop policy if exists "site_courses read" on public.site_courses;
create policy "site_courses read" on public.site_courses for select to anon, authenticated
  using (is_published or (select public.has_permission('site.manage')));
drop policy if exists "site_courses insert" on public.site_courses;
create policy "site_courses insert" on public.site_courses for insert to authenticated
  with check ((select public.has_permission('site.manage')));
drop policy if exists "site_courses update" on public.site_courses;
create policy "site_courses update" on public.site_courses for update to authenticated
  using ((select public.has_permission('site.manage')))
  with check ((select public.has_permission('site.manage')));
drop policy if exists "site_courses delete" on public.site_courses;
create policy "site_courses delete" on public.site_courses for delete to authenticated
  using ((select public.has_permission('site.manage')));

revoke all on public.site_courses from anon, authenticated;
grant select on public.site_courses to anon, authenticated;
grant insert (slug, sort_order, is_published, name, content) on public.site_courses to authenticated;
-- Không cấp update slug: lớp học tham chiếu khóa theo slug
grant update (sort_order, is_published, name, content) on public.site_courses to authenticated;
grant delete on public.site_courses to authenticated;

-- ------------------------------------------------------------------------------
-- Nhật ký hoạt động (đổi thứ tự không ghi)
-- ------------------------------------------------------------------------------
create or replace function public.log_site_course_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform write_activity('create', 'site', 1, format('Thêm trang khóa học “%s”', new.name), jsonb_build_object('course', new.slug));
  elsif tg_op = 'DELETE' then
    perform write_activity('delete', 'site', 1, format('Xoá trang khóa học “%s”', old.name), jsonb_build_object('course', old.slug));
  elsif (to_jsonb(old) - 'sort_order' - 'updated_at' - 'updated_by') is distinct from (to_jsonb(new) - 'sort_order' - 'updated_at' - 'updated_by') then
    perform write_activity('update', 'site', 1, format('Sửa trang khóa học “%s”', new.name), jsonb_build_object('course', new.slug));
  end if;
  return null;
end;
$$;
revoke all on function public.log_site_course_change() from public, anon, authenticated;

drop trigger if exists site_courses_log on public.site_courses;
create trigger site_courses_log after insert or update or delete on public.site_courses
  for each row execute function public.log_site_course_change();
