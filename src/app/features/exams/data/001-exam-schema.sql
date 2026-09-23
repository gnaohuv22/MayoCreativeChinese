-- ==============================================================================
-- MAYO CREATIVE CHINESE — HSK EXAM SYSTEM SCHEMA
-- ==============================================================================
-- Chạy script này trong Supabase SQL Editor để khởi tạo cấu trúc cơ sở dữ liệu.
-- Hỗ trợ cả HSK 2.0 (cũ: 6 cấp) và HSK 3.0 (mới: 9 cấp).

-- Bật extension tạo UUID ngẫu nhiên nếu chưa có
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. BẢNG exams: Lưu thông tin chung của từng đề thi
-- ==============================================================================
CREATE TABLE IF NOT EXISTS exams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,                                       -- VD: "HSK 3 — Đề thi thử số 01"
  hsk_level     SMALLINT NOT NULL CHECK (hsk_level BETWEEN 1 AND 9), -- 1-6 (HSK 2.0) hoặc 1-9 (HSK 3.0)
  hsk_version   VARCHAR(10) NOT NULL DEFAULT '2.0' CHECK (hsk_version IN ('2.0', '3.0')),
  duration_mins SMALLINT NOT NULL DEFAULT 90,                        -- Thời gian làm bài tính bằng phút
  total_score   SMALLINT NOT NULL DEFAULT 300,                       -- Điểm tối đa
  passing_score SMALLINT NOT NULL DEFAULT 180,                       -- Điểm qua môn
  description   TEXT,                                                -- Giới thiệu & lưu ý đề thi
  is_published  BOOLEAN NOT NULL DEFAULT false,                      -- Đã công khai cho học viên xem chưa
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 2. BẢNG exam_sections: Các phần thi chính (Nghe, Đọc, Viết, Nói)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS exam_sections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id      UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  section_type VARCHAR(20) NOT NULL CHECK (section_type IN ('listening', 'reading', 'writing', 'speaking')),
  title        TEXT NOT NULL,                                        -- VD: "Phần 1: Nghe hiểu (听力)"
  sort_order   SMALLINT NOT NULL DEFAULT 0,
  max_score    SMALLINT NOT NULL DEFAULT 100,                        -- Điểm tối đa cho phần thi này
  instructions TEXT,                                                 -- Hướng dẫn làm bài của phần
  audio_url    TEXT,                                                 -- File âm thanh tổng của phần Nghe (nếu có)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. BẢNG exam_parts: Từng Part/Dạng bài trong một phần thi
-- ==============================================================================
CREATE TABLE IF NOT EXISTS exam_parts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id    UUID NOT NULL REFERENCES exam_sections(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,                                       -- VD: "Phần I: Câu 1-10 (Chọn hình phù hợp)"
  question_type VARCHAR(30) NOT NULL CHECK (question_type IN (
    'single_choice',  -- Trắc nghiệm 1 đáp án (A, B, C, D)
    'true_false',     -- Đúng/Sai (对 / 错)
    'fill_blank',     -- Điền từ vào chỗ trống
    'ordering',       -- Sắp xếp cụm từ thành câu hoàn chỉnh
    'matching',       -- Nối cặp câu hỏi và câu trả lời
    'short_answer',   -- Viết chữ Hán / câu ngắn
    'essay'           -- Viết đoạn văn
  )),
  instructions  TEXT,                                                -- Hướng dẫn cụ thể cho nhóm câu hỏi
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 4. BẢNG exam_questions: Chi tiết từng câu hỏi
-- ==============================================================================
CREATE TABLE IF NOT EXISTS exam_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id        UUID NOT NULL REFERENCES exam_parts(id) ON DELETE CASCADE,
  question_num   SMALLINT NOT NULL,                                  -- Số thứ tự hiển thị trong đề (1, 2, 3...)
  content        TEXT,                                               -- Đề bài / đoạn hội thoại / câu văn
  audio_url      TEXT,                                               -- Audio riêng cho câu này (nếu có)
  image_url      TEXT,                                               -- Hình ảnh đi kèm đề bài (nếu có)
  correct_answer TEXT NOT NULL,                                      -- Đáp án chuẩn: 'A', 'B', 'true', 'false', từ điền...
  explanation    TEXT,                                               -- Giải thích chi tiết & dịch nghĩa
  score          NUMERIC(4, 2) NOT NULL DEFAULT 2.50,                 -- Điểm số của câu
  sort_order     SMALLINT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 5. BẢNG exam_options: Lựa chọn trắc nghiệm (nếu là dạng single_choice / matching)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS exam_options (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  label       VARCHAR(10) NOT NULL,                                  -- 'A', 'B', 'C', 'D', 'E', 'F'
  content     TEXT NOT NULL,                                         -- Nội dung lựa chọn
  image_url   TEXT,                                                  -- Hình ảnh cho option (VD: chọn hình ảnh A, B, C)
  sort_order  SMALLINT NOT NULL DEFAULT 0
);

-- ==============================================================================
-- INDEXES: Tối ưu hiệu năng truy vấn liên kết
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_exams_level ON exams(hsk_level);
CREATE INDEX IF NOT EXISTS idx_exams_version ON exams(hsk_version);
CREATE INDEX IF NOT EXISTS idx_exams_published ON exams(is_published);
CREATE INDEX IF NOT EXISTS idx_sections_exam ON exam_sections(exam_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_parts_section ON exam_parts(section_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_questions_part ON exam_questions(part_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_options_question ON exam_options(question_id, sort_order);

-- ==============================================================================
-- TRIGGER: Tự động cập nhật `updated_at` của bảng `exams`
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_exams_updated_at ON exams;
CREATE TRIGGER trg_exams_updated_at
  BEFORE UPDATE ON exams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Lưu ý: Vì hiện tại dự án sử dụng Supabase anon key public ở frontend và chưa
-- cấu hình Auth user, chúng ta mở quyền truy cập (ALL) cho role `anon` và `authenticated`
-- ==============================================================================
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public full access on exams" ON exams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on exam_sections" ON exam_sections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on exam_parts" ON exam_parts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on exam_questions" ON exam_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on exam_options" ON exam_options FOR ALL USING (true) WITH CHECK (true);
