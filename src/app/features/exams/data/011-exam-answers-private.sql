-- ==============================================================================
-- 011 — ẨN ĐÁP ÁN KHỎI HỌC VIÊN KHI ĐANG LÀM BÀI
-- ==============================================================================
-- anon không còn đọc được exam_questions.correct_answer / explanation qua API.
-- Đáp án chỉ lấy qua get_exam_answers() — trang làm bài gọi khi nộp bài / hết giờ.
-- authenticated (chỉ có admin, đăng ký công khai đã tắt) giữ quyền đọc đủ cột
-- cho trang soạn đề; RLS (008) vẫn giới hạn dòng.

revoke select on exam_questions from anon;
grant select (id, part_id, question_num, content, audio_url, image_url, score, sort_order, created_at)
  on exam_questions to anon;

create or replace function public.get_exam_answers(p_exam_id uuid)
returns table (question_id uuid, correct_answer text, explanation text)
language sql
stable
security definer
set search_path = public
as $$
  select q.id, q.correct_answer, q.explanation
  from exam_questions q
  join exam_parts p on p.id = q.part_id
  join exam_sections s on s.id = p.section_id
  join exams e on e.id = s.exam_id
  where e.id = p_exam_id
    and (e.is_published or public.is_admin())
$$;

revoke all on function public.get_exam_answers(uuid) from public;
grant execute on function public.get_exam_answers(uuid) to anon, authenticated;
