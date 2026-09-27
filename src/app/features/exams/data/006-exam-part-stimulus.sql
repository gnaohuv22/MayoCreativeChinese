-- ==============================================================================
-- 006 — "VÍ DỤ / ĐỀ BÀI CHUNG" CHO TỪNG PART + DẠNG BÀI CHỌN TỪ NGÂN HÀNG
-- ==============================================================================
-- Mỗi Part có thể có 1 khối dùng chung cho mọi câu hỏi trong Part:
--   * example_text        : ví dụ mẫu (例如), audio cũng đọc phần này
--   * stimulus_text       : ngân hàng từ / đoạn văn chung (A 因为 B 远 ...)
--   * stimulus_image_url  : tranh chung (ngân hàng tranh A–F)
--   * stimulus_audio_url  : audio chung của Part (tuỳ chọn)
--   * option_labels       : nhãn đáp án dùng chung cho dạng 'matching', VD 'A,B,C,D,E,F'
-- Chỉ thêm cột (additive) — không ảnh hưởng dữ liệu cũ.

alter table exam_parts
  add column if not exists example_text       text,
  add column if not exists stimulus_text      text,
  add column if not exists stimulus_image_url text,
  add column if not exists stimulus_audio_url text,
  add column if not exists option_labels      text;
