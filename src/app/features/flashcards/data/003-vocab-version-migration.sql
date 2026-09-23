-- ============================================================
-- 003-vocab-version-migration.sql
-- Migration: Support HSK 2.0 / 3.0 versioning & lesson-based vocabulary
-- ============================================================

-- 1. Add hsk_version column (default '2.0' for existing data)
ALTER TABLE vocab_cards
  ADD COLUMN IF NOT EXISTS hsk_version VARCHAR(10) NOT NULL DEFAULT '2.0'
  CHECK (hsk_version IN ('2.0', '3.0'));

-- 2. Add lesson fields for HSK 3.0 lesson-based organization
ALTER TABLE vocab_cards
  ADD COLUMN IF NOT EXISTS lesson_number SMALLINT,
  ADD COLUMN IF NOT EXISTS lesson_title TEXT;

-- 3. Update unique constraint to allow same hanzi in different versions
ALTER TABLE vocab_cards
  DROP CONSTRAINT IF EXISTS vocab_cards_hanzi_hsk_level_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vocab_cards_hanzi_level_version_key'
  ) THEN
    ALTER TABLE vocab_cards
      ADD CONSTRAINT vocab_cards_hanzi_level_version_key
      UNIQUE (hanzi, hsk_level, hsk_version);
  END IF;
END $$;

-- 4. Add indexes for optimized filtering
CREATE INDEX IF NOT EXISTS idx_vocab_version ON vocab_cards (hsk_version);
CREATE INDEX IF NOT EXISTS idx_vocab_level_version ON vocab_cards (hsk_level, hsk_version);
CREATE INDEX IF NOT EXISTS idx_vocab_lesson ON vocab_cards (hsk_level, hsk_version, lesson_number);
