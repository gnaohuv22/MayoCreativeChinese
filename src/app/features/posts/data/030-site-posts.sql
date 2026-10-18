-- ==============================================================================
-- 030 — CÂU CHUYỆN HỌC VIÊN SỬA ĐƯỢC TRONG /admin/stories
-- ==============================================================================
-- Mỗi bài = 1 dòng site_posts (tiếng Việt, như dữ liệu cứng trước đây trong student-stories.data.ts).
-- Ảnh đầu tiên trong images là ảnh bìa. body = mảng khối:
--   { kind: 'lead' | 'paragraph', text } | { kind: 'list', items: string[] }
--   | { kind: 'results', items: [{ name, level, score, note? }] }
-- Bài đã xuất bản ai cũng đọc được; bản nháp và mọi thao tác ghi cần quyền site.manage (028).
-- Nội dung ban đầu: 030b-site-posts-seed.sql (chạy ngay sau file này).

create table if not exists public.site_posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 120),
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  category     text not null default '',
  title        text not null check (length(btrim(title)) > 0),
  excerpt      text not null default '',
  images       jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array'),
  body         jsonb not null default '[]'::jsonb check (jsonb_typeof(body) = 'array'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users(id) on delete set null
);

create index if not exists idx_site_posts_order on public.site_posts (sort_order, created_at);

-- Dùng lại trigger của 028: updated_at + updated_by
drop trigger if exists site_posts_touch on public.site_posts;
create trigger site_posts_touch before update on public.site_posts
  for each row execute function public.touch_site_section();

alter table public.site_posts enable row level security;
drop policy if exists "site_posts read" on public.site_posts;
create policy "site_posts read" on public.site_posts for select to anon, authenticated
  using (is_published or (select public.has_permission('site.manage')));
drop policy if exists "site_posts insert" on public.site_posts;
create policy "site_posts insert" on public.site_posts for insert to authenticated
  with check ((select public.has_permission('site.manage')));
drop policy if exists "site_posts update" on public.site_posts;
create policy "site_posts update" on public.site_posts for update to authenticated
  using ((select public.has_permission('site.manage')))
  with check ((select public.has_permission('site.manage')));
drop policy if exists "site_posts delete" on public.site_posts;
create policy "site_posts delete" on public.site_posts for delete to authenticated
  using ((select public.has_permission('site.manage')));

revoke all on public.site_posts from anon, authenticated;
grant select on public.site_posts to anon, authenticated;
grant insert (slug, sort_order, is_published, category, title, excerpt, images, body) on public.site_posts to authenticated;
grant update (slug, sort_order, is_published, category, title, excerpt, images, body) on public.site_posts to authenticated;
grant delete on public.site_posts to authenticated;

-- ------------------------------------------------------------------------------
-- Nhật ký hoạt động (đổi thứ tự bài không ghi)
-- ------------------------------------------------------------------------------
create or replace function public.log_site_post_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

drop trigger if exists site_posts_log on public.site_posts;
create trigger site_posts_log after insert or update or delete on public.site_posts
  for each row execute function public.log_site_post_change();
