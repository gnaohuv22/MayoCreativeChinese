-- Kiểm tra migration 021 — chạy SAU file migration trong cùng lệnh, luôn kèm --dry-run:
--   node scripts/db/run-sql.mjs --dry-run src/app/features/classes/data/021-guest-accounts.sql scripts/db/tests/021-guest-accounts.test.sql

create or replace function pg_temp.act_as(p_user uuid, p_ip text default '203.0.113.7')
returns void
language sql
as $$
  select set_config('request.jwt.claims',
           case when p_user is null then '{"role":"anon"}'
                else json_build_object('sub', p_user, 'role', 'authenticated')::text end, true),
         set_config('request.headers', json_build_object('x-mcc-client-ip', p_ip)::text, true);
$$;

do $$
declare
  v_admin uuid := (select user_id from public.staff_profiles where username = 'admin');
  v_guest uuid;
  v_res jsonb;
  v_public_exam uuid := (select id from public.exams where visibility = 'public' limit 1);
  v_class uuid;
  i integer;
begin
  assert public.normalize_vn_phone('+84 912.345-678') = '0912345678', 'chuẩn hoá +84';
  assert public.normalize_vn_phone('0212345678') is null, 'số bàn không hợp lệ';

  -- Khách chưa đăng nhập
  perform pg_temp.act_as(null);
  assert public.register_guest('12345', 'abc12345', 'A', true) ->> 'error' = 'invalid_phone', 'invalid_phone';
  assert public.register_guest('0399000001', 'abcdefgh', 'A', true) ->> 'error' = 'weak_password', 'weak_password';
  assert public.register_guest('0399000001', 'abc12345', '  ', true) ->> 'error' = 'missing_name', 'missing_name';
  assert public.register_guest('0399000001', 'abc12345', 'A', false) ->> 'error' = 'no_consent', 'no_consent';

  v_res := public.register_guest('+84 399 000 001', 'abc12345', 'Khách Thử', true);
  assert (v_res ->> 'ok')::boolean, 'đăng ký phải thành công: ' || v_res::text;
  select user_id into v_guest from public.student_profiles where username = '0399000001';
  assert v_guest is not null and (select account_type from public.student_profiles where user_id = v_guest) = 'guest', 'thiếu hồ sơ khách';
  assert exists (select 1 from auth.users where id = v_guest and email = '0399000001@khach.mayocreativechinese.edu.vn'
                   and encrypted_password = extensions.crypt('abc12345', encrypted_password)), 'auth.users sai';
  assert public.register_guest('0399000001', 'abc12345', 'Khách Thử', true) ->> 'error' = 'phone_taken', 'phone_taken';

  -- Khách đã đăng nhập: là người học, không phải học viên lớp
  perform pg_temp.act_as(v_guest);
  assert public.is_learner() and not public.is_student(), 'cờ khách sai';
  assert public.my_student_context() ->> 'account_type' = 'guest', 'context thiếu account_type';
  assert not exists (select 1 from public.exams e where e.visibility = 'students' and public.can_view_exam(e.id)), 'khách mở được đề Học viên';
  if v_public_exam is not null then
    perform public.submit_exam_attempt(jsonb_build_object('exam_id', v_public_exam, 'score', 1, 'total_score', 10));
    assert exists (select 1 from public.exam_attempts where student_id = v_guest), 'khách không lưu được bài';
  end if;
  assert (public.student_change_password('abc12345', 'xyz98765') ->> 'ok')::boolean, 'khách không đổi được mật khẩu';

  -- Giới hạn 10 lần / IP / giờ (đã dùng 2)
  perform pg_temp.act_as(null);
  for i in 2..9 loop
    assert (public.register_guest('03990000' || lpad(i::text, 2, '0'), 'abc12345', 'K', true) ->> 'ok')::boolean, 'lần ' || i;
  end loop;
  assert public.register_guest('0399000010', 'abc12345', 'K', true) ->> 'error' = 'rate_limited', 'phải bị giới hạn';
  perform pg_temp.act_as(null, '198.51.100.1');
  assert (public.register_guest('0399000010', 'abc12345', 'K', true) ->> 'ok')::boolean, 'IP khác vẫn đăng ký được';

  -- Admin chuyển khách vào lớp → thành học viên; số điện thoại không đổi khi sửa hồ sơ
  perform pg_temp.act_as(v_admin);
  assert exists (select 1 from public.student_profiles where user_id = v_guest), 'admin không thấy khách';
  perform public.update_student(v_guest, '{"full_name":"Khách Đã Sửa","phone":"0900000000"}');
  assert (select phone from public.student_profiles where user_id = v_guest) = '0399000001', 'số điện thoại khách bị đổi';
  v_class := public.save_class('{"code":"TEST-GUEST-021","name":"Lớp thử 021"}');
  perform public.move_students(array[v_guest], v_class);
  perform pg_temp.act_as(v_guest);
  assert public.is_student(), 'chuyển lớp xong phải là học viên';
  assert (public.my_student_context() -> 'class' ->> 'code') = 'TEST-GUEST-021', 'chưa thấy lớp';

  raise notice 'TẤT CẢ ĐẠT';
end $$;
