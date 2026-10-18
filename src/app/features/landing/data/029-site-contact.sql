-- ==============================================================================
-- 029 — THÔNG TIN LIÊN HỆ Ở CHÂN TRANG SỬA ĐƯỢC TRONG /admin/site
-- ==============================================================================
-- Thêm khối 'contact' vào site_sections (028): địa chỉ, hotline, email, link Facebook / Messenger,
-- câu giới thiệu và dòng bản quyền ở chân trang. Hotline cũng là số Zalo trên trang chủ.
-- Nội dung ban đầu: 029b-site-contact-seed.sql (chạy ngay sau file này).

alter table public.site_sections drop constraint if exists site_sections_id_check;
alter table public.site_sections add constraint site_sections_id_check
  check (id in ('hero', 'about', 'teachers', 'courses', 'gallery', 'contact'));

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
        when 'courses' then 'khóa học' when 'gallery' then 'thư viện ảnh' when 'contact' then 'liên hệ'
        else new.id end),
      jsonb_build_object('section', new.id));
  end if;
  return null;
end;
$$;
revoke all on function public.log_site_section_change() from public, anon, authenticated;
