-- ==============================================================================
-- 028 — NỘI DUNG TRANG CHỦ DO QUẢN TRỊ SỬA (/admin/site)
-- ==============================================================================
-- Mỗi khối của trang chủ (hero, about, teachers, courses, gallery) là 1 dòng JSON.
-- Chữ lưu theo ngôn ngữ: { "vi": "...", "en": "...", ... } — thiếu ngôn ngữ nào thì trang hiện tiếng Việt.
-- Ai cũng đọc được (trang chủ công khai); sửa cần quyền site.manage.
-- Ảnh tải lên bucket public `site-media` (anon không liệt kê được, như 016).
-- Nội dung ban đầu: 028b-site-content-seed.sql (chạy ngay sau file này).

insert into public.permissions (id, label, description, grp, sort_order) values
  ('site.manage', 'Sửa trang chủ', 'Sửa chữ và ảnh trên trang chủ: giới thiệu, giáo viên, khóa học, thư viện ảnh.', 'content', 5)
on conflict (id) do update set label = excluded.label, description = excluded.description,
  grp = excluded.grp, sort_order = excluded.sort_order;
insert into public.role_permissions (role_id, permission) values ('admin', 'site.manage')
on conflict do nothing;

create table if not exists public.site_sections (
  id         text primary key check (id in ('hero', 'about', 'teachers', 'courses', 'gallery')),
  content    jsonb not null check (jsonb_typeof(content) = 'object'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create or replace function public.touch_site_section()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists site_sections_touch on public.site_sections;
create trigger site_sections_touch before update on public.site_sections
  for each row execute function public.touch_site_section();

alter table public.site_sections enable row level security;
drop policy if exists "site_sections read" on public.site_sections;
create policy "site_sections read" on public.site_sections for select to anon, authenticated using (true);
drop policy if exists "site_sections update" on public.site_sections;
create policy "site_sections update" on public.site_sections for update to authenticated
  using ((select public.has_permission('site.manage')))
  with check ((select public.has_permission('site.manage')));

-- Khối cố định: chỉ sửa, không thêm / xoá qua API
revoke all on public.site_sections from anon, authenticated;
grant select on public.site_sections to anon, authenticated;
grant update (content) on public.site_sections to authenticated;

-- ------------------------------------------------------------------------------
-- Nhật ký hoạt động
-- ------------------------------------------------------------------------------
create or replace function public.log_site_section_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.content is distinct from new.content then
    perform write_activity('update', 'site', 1,
      format('Sửa trang chủ: %s', case new.id
        when 'hero' then 'phần mở đầu' when 'about' then 'giới thiệu' when 'teachers' then 'giáo viên'
        when 'courses' then 'khóa học' when 'gallery' then 'thư viện ảnh' else new.id end),
      jsonb_build_object('section', new.id));
  end if;
  return null;
end;
$$;
revoke all on function public.log_site_section_change() from public, anon, authenticated;

drop trigger if exists site_sections_log on public.site_sections;
create trigger site_sections_log after update on public.site_sections
  for each row execute function public.log_site_section_change();

-- ------------------------------------------------------------------------------
-- Ảnh trang chủ
-- ------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "site-media read" on storage.objects;
create policy "site-media read" on storage.objects for select to authenticated
  using (bucket_id = 'site-media' and (select public.has_permission('site.manage')));
drop policy if exists "site-media insert" on storage.objects;
create policy "site-media insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'site-media' and (select public.has_permission('site.manage')));
drop policy if exists "site-media update" on storage.objects;
create policy "site-media update" on storage.objects for update to authenticated
  using (bucket_id = 'site-media' and (select public.has_permission('site.manage')))
  with check (bucket_id = 'site-media' and (select public.has_permission('site.manage')));
drop policy if exists "site-media delete" on storage.objects;
create policy "site-media delete" on storage.objects for delete to authenticated
  using (bucket_id = 'site-media' and (select public.has_permission('site.manage')));
