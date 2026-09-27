-- ==============================================================================
-- 005 — CHO PHÉP CÙNG HÁN TỰ NHƯNG KHÁC PINYIN / NGHĨA
-- ==============================================================================
-- Trước: UNIQUE (hanzi, hsk_level, hsk_version) → 对 "Đúng" và 对 "Đối với" không thể cùng tồn tại.
-- Sau:   chỉ coi là trùng khi hanzi + pinyin + meaning (cùng level, version) đều giống nhau.

alter table vocab_cards drop constraint if exists vocab_cards_hanzi_level_version_key;
alter table vocab_cards drop constraint if exists vocab_cards_hanzi_hsk_level_key;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'vocab_cards_entry_key') then
    alter table vocab_cards
      add constraint vocab_cards_entry_key
      unique (hanzi, pinyin, meaning, hsk_level, hsk_version);
  end if;
end $$;
