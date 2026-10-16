-- ==============================================================================
-- 024b — ĐỀ THI CẦN ĐĂNG NHẬP (áp khi đưa bản staging có 024 lên www)
-- ==============================================================================
-- Khách chưa đăng nhập vẫn xem được danh sách đề (bảng exams) nhưng không đọc được câu hỏi / đáp án
-- của đề nào. Áp SAU 024, cùng lúc deploy bản web có nút "Đăng nhập để làm bài" (bản www trước đó
-- cho khách làm đề Công khai — áp sớm sẽ làm đề hiện trống). Chạy được nhiều lần.

create or replace function public.can_view_exam(p_exam_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.exams e
    where e.id = p_exam_id
      and (
        public.has_permission('content.read')
        or (auth.uid() is not null and (
              e.visibility = 'public'
              or (e.visibility = 'members' and public.is_learner())
              or (e.visibility = 'paid' and public.has_access('exams'))
              or (e.visibility = 'students' and public.is_student())
              or (e.visibility = 'staff' and exists (
                    select 1 from public.class_suggestions cs
                    where cs.kind = 'exam' and cs.exam_id = e.id and cs.class_id = public.my_class_id()))))
      )
  )
$$;
