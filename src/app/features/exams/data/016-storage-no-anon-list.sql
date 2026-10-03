-- ==============================================================================
-- 016 — KHÔNG CHO ANON LIỆT KÊ FILE TRONG BUCKET `exam-assets`
-- ==============================================================================
-- Policy "exam-assets read" (008) cho mọi người SELECT trên storage.objects, nên ai có
-- khoá anon cũng gọi được API list → lấy trọn danh sách ảnh/audio để tải hàng loạt.
-- Bucket public phát file qua /object/public/... không cần policy SELECT, nên link
-- ảnh/audio trong đề vẫn chạy. Nhân sự (content.read) vẫn list được: upload dùng
-- upsert (cần SELECT) và scripts/storage/clean-orphan-assets.mjs cần list.

drop policy if exists "exam-assets read" on storage.objects;
create policy "exam-assets read" on storage.objects for select to authenticated
  using (bucket_id = 'exam-assets' and (select public.has_permission('content.read')));
