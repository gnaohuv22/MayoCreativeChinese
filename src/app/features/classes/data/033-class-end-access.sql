-- ==============================================================================
-- 033 — Lớp kết thúc thì học viên hết quyền "học viên lớp" sau 30 ngày gia hạn
-- ==============================================================================
-- Lớp kết thúc = qua hết ngày end_date (giờ Việt Nam) hoặc chuyển trạng thái "finished", lấy mốc sớm hơn.
-- Sau mốc đó 30 ngày, is_student() trả false: tài khoản vẫn đăng nhập, giữ lịch sử, vẫn là người học
-- (is_learner) và vẫn dùng quyền Mayo+ được cấp riêng. Xếp học viên sang lớp mới / mở lại lớp là có quyền lại.

-- Mốc chuyển sang "finished" (bỏ khi lớp mở lại)
alter table public.classes add column if not exists finished_at timestamptz;

update public.classes set finished_at = updated_at where status = 'finished' and finished_at is null;

create or replace function public.set_class_finished_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'finished' then
    new.finished_at := case when tg_op = 'UPDATE' and old.status = 'finished' then old.finished_at else now() end;
  else
    new.finished_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists set_class_finished_at on public.classes;
create trigger set_class_finished_at before insert or update of status on public.classes
  for each row execute function public.set_class_finished_at();

-- Hạn quyền học viên của lớp; null = chưa có mốc kết thúc
create or replace function public.class_access_until(p_end_date date, p_finished_at timestamptz)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select least((p_end_date + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh', p_finished_at) + interval '30 days'
$$;

create or replace function public.is_student()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.student_profiles sp
    left join public.classes c on c.id = sp.class_id
    where sp.user_id = auth.uid() and sp.status = 'active' and sp.account_type = 'student'
      and coalesce(public.class_access_until(c.end_date, c.finished_at) > now(), true))
$$;

-- Ngữ cảnh học viên: thêm student_access (còn quyền học viên lớp) và student_access_until (hạn, nếu có)
create or replace function public.my_student_context()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'username', sp.username,
    'full_name', sp.full_name,
    'account_type', sp.account_type,
    'must_change_password', sp.must_change_password,
    'student_access', public.is_student(),
    'student_access_until', case when sp.account_type = 'student'
                                 then public.class_access_until(c.end_date, c.finished_at) end,
    'access', coalesce((
      select jsonb_agg(jsonb_build_object('module', g.module, 'expires_at', g.expires_at) order by g.module)
      from public.access_grants g
      where g.user_id = sp.user_id and (g.expires_at is null or g.expires_at > now())), '[]'::jsonb),
    'class', case when c.id is null then null else jsonb_build_object(
      'id', c.id, 'code', c.code, 'name', c.name, 'course_slug', c.course_slug,
      'hsk_level', c.hsk_level, 'hsk_version', c.hsk_version, 'study_mode', c.study_mode,
      'start_date', c.start_date, 'end_date', c.end_date, 'schedule', c.schedule, 'status', c.status,
      'archived', c.archived_at is not null,
      'staff', coalesce((
        select jsonb_agg(jsonb_build_object('full_name', coalesce(nullif(s.full_name, ''), s.username), 'role', cs.role)
                         order by cs.role desc, s.full_name)
        from public.class_staff cs join public.staff_profiles s on s.user_id = cs.user_id
        where cs.class_id = c.id), '[]'::jsonb)
    ) end
  )
  from public.student_profiles sp
  left join public.classes c on c.id = sp.class_id
  where sp.user_id = auth.uid() and sp.status = 'active'
$$;
