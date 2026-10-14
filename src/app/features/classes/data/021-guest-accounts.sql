-- ==============================================================================
-- 021 — KHÁCH TỰ ĐĂNG KÝ TÀI KHOẢN (SỐ ĐIỆN THOẠI + MẬT KHẨU)
-- ==============================================================================
-- Khách dùng chung bảng student_profiles với học viên lớp:
--   account_type = 'guest'   — tự đăng ký, không thuộc lớp, tên đăng nhập = số điện thoại
--   account_type = 'student' — tài khoản do nhân sự tạo theo lớp (019)
-- Email đăng nhập nội bộ của khách: <số điện thoại>@khach.mayocreativechinese.edu.vn
--
-- is_student()  — chỉ học viên lớp (mở nội dung "Học viên")
-- is_learner()  — học viên + khách (lưu tiến độ flashcard, bài thi, tự đổi mật khẩu)
-- Nhân sự chuyển khách vào lớp → khách thành học viên, giữ nguyên đăng nhập.
--
-- register_guest() gọi được khi chưa đăng nhập. Chỉ đi qua proxy (015 chặn anon gọi thẳng);
-- proxy gắn IP người dùng vào header x-mcc-client-ip để giới hạn số tài khoản tạo mỗi giờ.
-- Chạy được nhiều lần.

alter table public.student_profiles add column if not exists account_type text not null default 'student';
alter table public.student_profiles drop constraint if exists student_profiles_account_type_check;
alter table public.student_profiles add constraint student_profiles_account_type_check
  check (account_type in ('student', 'guest'));
alter table public.student_profiles add column if not exists consented_at timestamptz;

create unique index if not exists uq_student_profiles_guest_phone
  on public.student_profiles (phone) where account_type = 'guest';

create table if not exists private.guest_signups (
  ip         text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_guest_signups_ip on private.guest_signups (ip, created_at);
revoke all on private.guest_signups from public, anon, authenticated;

-- ------------------------------------------------------------------------------
-- Kiểm tra vai trò người học
-- ------------------------------------------------------------------------------
create or replace function public.is_student()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.student_profiles
                 where user_id = auth.uid() and status = 'active' and account_type = 'student')
$$;

create or replace function public.is_learner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.student_profiles where user_id = auth.uid() and status = 'active')
$$;
revoke all on function public.is_learner() from public;
grant execute on function public.is_learner() to anon, authenticated;

drop policy if exists "student_card_progress own" on public.student_card_progress;
create policy "student_card_progress own" on public.student_card_progress for all to authenticated
  using (student_id = (select auth.uid()) and (select public.is_learner()))
  with check (student_id = (select auth.uid()) and (select public.is_learner()));

-- "0912 345 678", "+84912345678", "84912345678" → "0912345678"; null nếu không phải số di động VN
create or replace function public.normalize_vn_phone(p_phone text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when d ~ '^0[35789][0-9]{8}$' then d end
  from (
    select case when x ~ '^84[0-9]{9}$' then '0' || substr(x, 3) else x end as d
    from (select regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g') as x) a
  ) b
$$;
grant execute on function public.normalize_vn_phone(text) to anon, authenticated;

-- ------------------------------------------------------------------------------
-- Khách tự đăng ký
-- ------------------------------------------------------------------------------
-- Trả {ok} hoặc {ok:false, error}: invalid_phone | missing_name | weak_password | no_consent | phone_taken | rate_limited
-- Giới hạn: 10 lần thử / IP / giờ, 100 lần / giờ toàn hệ thống.
create or replace function public.register_guest(p_phone text, p_password text, p_full_name text, p_consent boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := normalize_vn_phone(p_phone);
  v_name text := trim(coalesce(p_full_name, ''));
  v_ip text := coalesce(nullif(current_setting('request.headers', true)::json ->> 'x-mcc-client-ip', ''), 'unknown');
  v_email text;
  v_id uuid;
begin
  if v_phone is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_phone');
  end if;
  if v_name = '' or length(v_name) > 100 then
    return jsonb_build_object('ok', false, 'error', 'missing_name');
  end if;
  if not student_password_ok(coalesce(p_password, '')) then
    return jsonb_build_object('ok', false, 'error', 'weak_password');
  end if;
  if not coalesce(p_consent, false) then
    return jsonb_build_object('ok', false, 'error', 'no_consent');
  end if;

  delete from private.guest_signups where created_at < now() - interval '1 day';
  if (select count(*) from private.guest_signups where ip = v_ip and created_at > now() - interval '1 hour') >= 10
     or (select count(*) from private.guest_signups where created_at > now() - interval '1 hour') >= 100 then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  -- Tính cả lần trùng số, để không dò hàng loạt số điện thoại nào đã có tài khoản
  insert into private.guest_signups (ip) values (v_ip);

  v_email := v_phone || '@khach.mayocreativechinese.edu.vn';
  if exists (select 1 from student_profiles where account_type = 'guest' and phone = v_phone)
     or exists (select 1 from auth.users where email = v_email) then
    return jsonb_build_object('ok', false, 'error', 'phone_taken');
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf', 10)), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
    '', '', '', ''
  )
  returning id into v_id;

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
          jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
          'email', now(), now(), now());

  insert into student_profiles (user_id, username, full_name, phone, account_type, must_change_password, consented_at)
  values (v_id, v_phone, v_name, v_phone, 'guest', false, now());

  return jsonb_build_object('ok', true);
exception when unique_violation then
  -- Hai lần bấm cùng lúc với cùng số điện thoại
  return jsonb_build_object('ok', false, 'error', 'phone_taken');
end;
$$;
revoke all on function public.register_guest(text, text, text, boolean) from public;
grant execute on function public.register_guest(text, text, text, boolean) to anon, authenticated;

-- ------------------------------------------------------------------------------
-- Hàm của 019 nay áp dụng cho cả khách
-- ------------------------------------------------------------------------------
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

create or replace function public.student_change_password(p_current text, p_new text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_learner() then
    return jsonb_build_object('ok', false, 'error', 'not_student');
  end if;
  if not exists (
    select 1 from auth.users where id = auth.uid() and encrypted_password = extensions.crypt(p_current, encrypted_password)
  ) then
    return jsonb_build_object('ok', false, 'error', 'wrong_password');
  end if;
  if not student_password_ok(p_new) then
    return jsonb_build_object('ok', false, 'error', 'weak_password');
  end if;
  if p_new = p_current then
    return jsonb_build_object('ok', false, 'error', 'same_password');
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(p_new, extensions.gen_salt('bf', 10)), updated_at = now()
  where id = auth.uid();
  update student_profiles set must_change_password = false where user_id = auth.uid();
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.submit_exam_attempt(p_attempt jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exam_id uuid := (p_attempt ->> 'exam_id')::uuid;
  v_id uuid;
begin
  if not is_learner() then
    raise exception 'Chỉ lưu bài của học viên' using errcode = '42501';
  end if;
  if not can_view_exam(v_exam_id) then
    raise exception 'Không có quyền làm đề này' using errcode = '42501';
  end if;

  insert into exam_attempts (student_id, class_id, exam_id, score, total_score, passing_score,
                             correct_count, question_count, section_scores, answers, time_spent_secs)
  values (
    auth.uid(), my_class_id(), v_exam_id,
    coalesce((p_attempt ->> 'score')::numeric, 0),
    coalesce((p_attempt ->> 'total_score')::numeric, 0),
    nullif(p_attempt ->> 'passing_score', '')::numeric,
    coalesce((p_attempt ->> 'correct_count')::integer, 0),
    coalesce((p_attempt ->> 'question_count')::integer, 0),
    coalesce(p_attempt -> 'section_scores', '[]'::jsonb),
    coalesce(p_attempt -> 'answers', '{}'::jsonb),
    nullif(p_attempt ->> 'time_spent_secs', '')::integer
  )
  returning id into v_id;
  return v_id;
end;
$$;

-- Chuyển vào lớp: khách trở thành học viên của lớp (giữ đăng nhập bằng số điện thoại)
create or replace function public.move_students(p_students uuid[], p_class_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class classes%rowtype;
  v_count integer;
begin
  if coalesce(cardinality(p_students), 0) = 0 then
    return;
  end if;
  if exists (select 1 from unnest(p_students) s where not can_manage_student(s)) then
    raise exception 'Bạn không có quyền chuyển một số học viên đã chọn' using errcode = '42501';
  end if;
  select * into v_class from classes where id = p_class_id and archived_at is null;
  if not found then
    raise exception 'Lớp đích không tồn tại hoặc đã lưu trữ' using errcode = 'P0002';
  end if;

  update student_profiles set class_id = p_class_id, account_type = 'student'
  where user_id = any (p_students) and (class_id is distinct from p_class_id or account_type <> 'student');
  get diagnostics v_count = row_count;
  if v_count = 0 then
    return;
  end if;

  perform write_activity('move', 'student', v_count,
    case when v_count = 1
      then format('Chuyển học viên %s sang lớp %s',
                  (select username from student_profiles where user_id = any (p_students) limit 1), v_class.code)
      else format('Chuyển %s học viên sang lớp %s', v_count, v_class.code) end,
    jsonb_build_object('class_id', p_class_id, 'code', v_class.code, 'items',
      (select jsonb_agg(jsonb_build_object('username', username, 'full_name', full_name))
       from (select username, full_name from student_profiles where user_id = any (p_students) limit 20) x)));
end;
$$;

-- Sửa hồ sơ: số điện thoại của khách là tên đăng nhập → giữ nguyên
create or replace function public.update_student(p_student uuid, p_data jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile student_profiles%rowtype;
begin
  if not can_manage_student(p_student) then
    raise exception 'Bạn không có quyền sửa học viên này' using errcode = '42501';
  end if;
  if trim(coalesce(p_data ->> 'full_name', '')) = '' then
    raise exception 'Cần nhập họ tên' using errcode = '22023';
  end if;
  update student_profiles set
    full_name    = trim(p_data ->> 'full_name'),
    birth_year   = nullif(p_data ->> 'birth_year', '')::smallint,
    phone        = case when account_type = 'guest' then phone else trim(coalesce(p_data ->> 'phone', '')) end,
    email        = trim(coalesce(p_data ->> 'email', '')),
    parent_phone = trim(coalesce(p_data ->> 'parent_phone', '')),
    notes        = trim(coalesce(p_data ->> 'notes', ''))
  where user_id = p_student
  returning * into v_profile;
  perform write_activity('update', 'student', 1, format('Cập nhật học viên %s (%s)', v_profile.username, v_profile.full_name),
    jsonb_build_object('user_id', p_student, 'username', v_profile.username));
end;
$$;
