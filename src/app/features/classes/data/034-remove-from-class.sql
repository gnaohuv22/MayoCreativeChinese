-- ==============================================================================
-- 034 — Bỏ học viên khỏi lớp (giữ tài khoản)
-- ==============================================================================
-- Trước đây trong lớp chỉ có "Xoá" = xoá vĩnh viễn tài khoản. remove_students_from_class chỉ bỏ class_id:
-- học viên vẫn đăng nhập, giữ lịch sử bài thi / flashcard, quyền Mayo+ cấp riêng; xếp vào lớp khác là có quyền lớp lại.
-- is_student() giờ cần có lớp: tài khoản học viên không thuộc lớp nào (bỏ khỏi lớp, lớp bị xoá) là người học thường.

create or replace function public.is_student()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.student_profiles sp
    join public.classes c on c.id = sp.class_id
    where sp.user_id = auth.uid() and sp.status = 'active' and sp.account_type = 'student'
      and coalesce(public.class_access_until(c.end_date, c.finished_at) > now(), true))
$$;

create or replace function public.remove_students_from_class(p_students uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_codes text;
begin
  if coalesce(cardinality(p_students), 0) = 0 then
    return 0;
  end if;
  if exists (select 1 from unnest(p_students) s where not can_manage_student(s)) then
    raise exception 'Bạn không có quyền bỏ một số học viên đã chọn khỏi lớp' using errcode = '42501';
  end if;

  select string_agg(distinct c.code, ', ') into v_codes
  from student_profiles sp join classes c on c.id = sp.class_id
  where sp.user_id = any (p_students);

  update student_profiles set class_id = null
  where user_id = any (p_students) and class_id is not null;
  get diagnostics v_count = row_count;
  if v_count = 0 then
    return 0;
  end if;

  perform write_activity('move', 'student', v_count,
    case when v_count = 1
      then format('Bỏ học viên %s khỏi lớp %s',
                  (select username from student_profiles where user_id = any (p_students) limit 1), v_codes)
      else format('Bỏ %s học viên khỏi lớp %s', v_count, v_codes) end,
    jsonb_build_object('codes', v_codes, 'items',
      (select jsonb_agg(jsonb_build_object('username', username, 'full_name', full_name))
       from (select username, full_name from student_profiles where user_id = any (p_students) limit 20) x)));
  return v_count;
end;
$$;

revoke all on function public.remove_students_from_class(uuid[]) from public, anon;
grant execute on function public.remove_students_from_class(uuid[]) to authenticated;
