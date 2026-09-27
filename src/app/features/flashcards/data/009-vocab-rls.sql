-- ==============================================================================
-- 009 — RLS CHO vocab_cards
-- ==============================================================================
-- Bảng vocab_cards được tạo ngoài repo (Supabase SQL Editor) nên trạng thái RLS
-- trước đây không được ghi lại. Script này xoá mọi policy cũ rồi đặt lại:
--   * Mọi người: chỉ ĐỌC.
--   * Admin (public.is_admin(), xem 008): thêm / sửa / xoá.

do $$
declare
  p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'vocab_cards' loop
    execute format('drop policy %I on public.vocab_cards', p.policyname);
  end loop;
end $$;

alter table vocab_cards enable row level security;

create policy "vocab_cards read" on vocab_cards for select
  using (true);

create policy "vocab_cards admin write" on vocab_cards for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
