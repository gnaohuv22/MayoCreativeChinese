-- ==============================================================================
-- 018 — TÌM TỪ VỰNG THEO PINYIN KHÔNG DẤU
-- ==============================================================================
-- Học viên gõ "mama" / "ma ma" phải tìm được 妈妈 māma. Cột sinh tự động pinyin_search:
-- chữ thường, bỏ dấu thanh, bỏ khoảng trắng, ü → v (cách gõ quen thuộc: lv = lǜ).
-- Client chuẩn hoá chuỗi tìm kiếm cùng cách (VocabService.getVocabPaginated).
-- Chạy được nhiều lần.

alter table public.vocab_cards
  add column if not exists pinyin_search text
  generated always as (
    replace(
      translate(lower(pinyin), 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü', 'aaaaeeeeiiiioooouuuuvvvvv'),
      ' ', ''
    )
  ) stored;

create index if not exists idx_vocab_pinyin_search on public.vocab_cards (collection, hsk_level, pinyin_search);

-- PostgREST nhận cột mới ngay
notify pgrst, 'reload schema';
