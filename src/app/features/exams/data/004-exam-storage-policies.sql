-- ==============================================================================
-- 004 — STORAGE POLICIES CHO BUCKET `exam-assets`
-- ==============================================================================
-- Sửa lỗi upload ảnh/audio: "new row violates row-level security policy".
-- Bucket trước đây là private và không có policy nào trên storage.objects.
-- Giống các bảng exam_*: tạm mở quyền cho anon cho tới khi có Auth admin.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exam-assets', 'exam-assets', true, 20971520, array['image/*', 'audio/*'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "exam-assets read" on storage.objects;
drop policy if exists "exam-assets insert" on storage.objects;
drop policy if exists "exam-assets update" on storage.objects;
drop policy if exists "exam-assets delete" on storage.objects;

create policy "exam-assets read"   on storage.objects for select using (bucket_id = 'exam-assets');
create policy "exam-assets insert" on storage.objects for insert with check (bucket_id = 'exam-assets');
-- upload() dùng upsert: true nên cần thêm quyền UPDATE
create policy "exam-assets update" on storage.objects for update using (bucket_id = 'exam-assets') with check (bucket_id = 'exam-assets');
