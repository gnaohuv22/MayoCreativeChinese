-- ==============================================================================
-- 025 — ĐẾM SỐ TỪ THEO CẤP TRONG 1 LẦN GỌI
-- ==============================================================================
-- Trang Flashcard và khu quản trị từ vựng từng tải toàn bộ ~20.000 dòng vocab_cards (20 trang x 1000)
-- chỉ để đếm số từ mỗi cấp. Hàm này đếm sẵn trên server. SECURITY INVOKER: RLS của vocab_cards vẫn áp
-- dụng, nên cấp người xem không được đọc trả về 0 / không có dòng — như kết quả tải từng dòng trước đây.
-- Chạy được nhiều lần.

create or replace function public.vocab_level_counts()
returns table (collection text, hsk_level smallint, cards bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.collection, c.hsk_level, count(*)
  from public.vocab_cards c
  group by c.collection, c.hsk_level
$$;
revoke all on function public.vocab_level_counts() from public;
grant execute on function public.vocab_level_counts() to anon, authenticated;
