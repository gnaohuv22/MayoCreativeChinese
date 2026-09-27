-- ============================================================
-- 007-vocab-collections.sql
-- 4 bộ từ vựng độc lập: mỗi từ thuộc đúng 1 bộ (collection).
--   hsk2       — Từ vựng HSK 2.0 (HSK 1-6)
--   hsk3       — Từ vựng NEW HSK 3.0 (chia theo bài học)
--   combined   — Từ vựng HSK 1-9 (7-9 gộp khi hiển thị)
--   supplement — Từ vựng bổ sung 2.0 → 3.0 (HSK 3-6, chia theo chủ đề)
-- hsk_version được giữ lại để tương thích (hsk2 → '2.0', các bộ khác → '3.0').
-- ============================================================

ALTER TABLE vocab_cards
  ADD COLUMN IF NOT EXISTS collection VARCHAR(20),
  ADD COLUMN IF NOT EXISTS topic TEXT;

-- Dữ liệu cũ: 2.0 → hsk2, 3.0 → hsk3
UPDATE vocab_cards
  SET collection = CASE WHEN hsk_version = '3.0' THEN 'hsk3' ELSE 'hsk2' END
  WHERE collection IS NULL;

ALTER TABLE vocab_cards
  ALTER COLUMN collection SET NOT NULL,
  ALTER COLUMN collection SET DEFAULT 'hsk2';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vocab_cards_collection_check') THEN
    ALTER TABLE vocab_cards
      ADD CONSTRAINT vocab_cards_collection_check
      CHECK (collection IN ('hsk2', 'hsk3', 'combined', 'supplement'));
  END IF;
END $$;

-- Trùng hoàn toàn = cùng bộ + cấp + Hán tự + pinyin + nghĩa
ALTER TABLE vocab_cards DROP CONSTRAINT IF EXISTS vocab_cards_entry_key;
ALTER TABLE vocab_cards
  ADD CONSTRAINT vocab_cards_entry_key UNIQUE (collection, hsk_level, hanzi, pinyin, meaning);

CREATE INDEX IF NOT EXISTS idx_vocab_collection_level ON vocab_cards (collection, hsk_level);
CREATE INDEX IF NOT EXISTS idx_vocab_collection_lesson ON vocab_cards (collection, hsk_level, lesson_number);
CREATE INDEX IF NOT EXISTS idx_vocab_collection_topic ON vocab_cards (collection, hsk_level, topic);
