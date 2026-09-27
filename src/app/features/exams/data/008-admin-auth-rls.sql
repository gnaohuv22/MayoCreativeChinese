-- ==============================================================================
-- 008 — ADMIN AUTH + RLS CHO ĐỀ THI VÀ STORAGE `exam-assets`
-- ==============================================================================
-- Thay các policy "mở toàn quyền cho anon" (001, 004) bằng:
--   * Học viên (anon / authenticated thường): chỉ ĐỌC đề đã xuất bản.
--   * Admin: đọc + ghi toàn bộ.
-- Admin = user Supabase Auth có app_metadata.role = 'admin'. app_metadata chỉ
-- sửa được bằng service role / SQL, người dùng tự đăng ký không tự gán được.
-- Tạo tài khoản admin: scripts/db/create-admin.mjs

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ------------------------------------------------------------------------------
-- Bảng exam_*
-- ------------------------------------------------------------------------------
drop policy if exists "Allow public full access on exams" on exams;
drop policy if exists "Allow public full access on exam_sections" on exam_sections;
drop policy if exists "Allow public full access on exam_parts" on exam_parts;
drop policy if exists "Allow public full access on exam_questions" on exam_questions;
drop policy if exists "Allow public full access on exam_options" on exam_options;

alter table exams enable row level security;
alter table exam_sections enable row level security;
alter table exam_parts enable row level security;
alter table exam_questions enable row level security;
alter table exam_options enable row level security;

-- Đọc: đề đã xuất bản (mọi người) hoặc admin
drop policy if exists "exams read" on exams;
create policy "exams read" on exams for select
  using (is_published or (select public.is_admin()));

drop policy if exists "exam_sections read" on exam_sections;
create policy "exam_sections read" on exam_sections for select
  using (
    (select public.is_admin())
    or exists (select 1 from exams e where e.id = exam_sections.exam_id and e.is_published)
  );

drop policy if exists "exam_parts read" on exam_parts;
create policy "exam_parts read" on exam_parts for select
  using (
    (select public.is_admin())
    or exists (
      select 1 from exam_sections s join exams e on e.id = s.exam_id
      where s.id = exam_parts.section_id and e.is_published
    )
  );

drop policy if exists "exam_questions read" on exam_questions;
create policy "exam_questions read" on exam_questions for select
  using (
    (select public.is_admin())
    or exists (
      select 1 from exam_parts p
      join exam_sections s on s.id = p.section_id
      join exams e on e.id = s.exam_id
      where p.id = exam_questions.part_id and e.is_published
    )
  );

drop policy if exists "exam_options read" on exam_options;
create policy "exam_options read" on exam_options for select
  using (
    (select public.is_admin())
    or exists (
      select 1 from exam_questions q
      join exam_parts p on p.id = q.part_id
      join exam_sections s on s.id = p.section_id
      join exams e on e.id = s.exam_id
      where q.id = exam_options.question_id and e.is_published
    )
  );

-- Ghi: chỉ admin
drop policy if exists "exams admin write" on exams;
create policy "exams admin write" on exams for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "exam_sections admin write" on exam_sections;
create policy "exam_sections admin write" on exam_sections for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "exam_parts admin write" on exam_parts;
create policy "exam_parts admin write" on exam_parts for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "exam_questions admin write" on exam_questions;
create policy "exam_questions admin write" on exam_questions for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "exam_options admin write" on exam_options;
create policy "exam_options admin write" on exam_options for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ------------------------------------------------------------------------------
-- Storage `exam-assets`: bucket public để phát ảnh/audio; chỉ admin được ghi
-- ------------------------------------------------------------------------------
drop policy if exists "exam-assets read" on storage.objects;
drop policy if exists "exam-assets insert" on storage.objects;
drop policy if exists "exam-assets update" on storage.objects;
drop policy if exists "exam-assets delete" on storage.objects;

create policy "exam-assets read" on storage.objects for select
  using (bucket_id = 'exam-assets');
create policy "exam-assets insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'exam-assets' and (select public.is_admin()));
create policy "exam-assets update" on storage.objects for update to authenticated
  using (bucket_id = 'exam-assets' and (select public.is_admin()))
  with check (bucket_id = 'exam-assets' and (select public.is_admin()));
create policy "exam-assets delete" on storage.objects for delete to authenticated
  using (bucket_id = 'exam-assets' and (select public.is_admin()));
