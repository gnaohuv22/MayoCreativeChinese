-- Kiểm tra migration 024 — luôn kèm --dry-run:
--   node scripts/db/run-sql.mjs --dry-run src/app/features/classes/data/024-paid-access.sql scripts/db/tests/024-paid-access.test.sql
-- Thêm 024b trước file test để kiểm tra cả phần "đề thi cần đăng nhập" (pg_temp.with_024b = true).

create or replace function pg_temp.act_as(p_user uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claims',
           case when p_user is null then '{"role":"anon"}'
                else json_build_object('sub', p_user, 'role', 'authenticated')::text end, true),
         set_config('request.headers', '{"x-mcc-client-ip":"203.0.113.24"}', true);
$$;

-- Số thẻ từ vựng người đang đóng vai đọc được qua RLS
create or replace function pg_temp.visible_cards(p_collection text, p_level smallint)
returns bigint
language plpgsql
as $$
declare
  v bigint;
begin
  execute format('set local role %s', case when current_setting('request.jwt.claims')::jsonb ->> 'role' = 'anon' then 'anon' else 'authenticated' end);
  select count(*) into v from public.vocab_cards where collection = p_collection and hsk_level = p_level;
  reset role;
  return v;
end;
$$;

-- Lỗi phải xảy ra
create or replace function pg_temp.expect_error(p_sql text, p_what text)
returns void
language plpgsql
as $$
begin
  execute p_sql;
  raise exception 'FAIL: phải lỗi — %', p_what;
exception when others then
  if sqlerrm like 'FAIL:%' then raise; end if;
end;
$$;

do $$
declare
  v_admin uuid := (select user_id from public.staff_profiles where username = 'admin');
  v_guest uuid;
  v_other uuid;
  v_exam uuid;
  v_level smallint;
  v_total bigint;
  v_exp timestamptz;
  v_res jsonb;
  v_024b boolean := position('auth.uid() is not null' in pg_get_functiondef('public.can_view_exam(uuid)'::regprocedure)) > 0;
begin
  if v_admin is null then raise exception 'FAIL: không thấy tài khoản admin'; end if;

  perform pg_temp.act_as(null);
  assert (public.register_guest('k024@example.com', '0399000241', 'abc12345', 'Khách 024', true) ->> 'ok')::boolean, 'tạo khách';
  assert (public.register_guest('k024b@example.com', '0399000242', 'abc12345', 'Khách 024 B', true) ->> 'ok')::boolean, 'tạo khách 2';
  select user_id into v_guest from public.student_profiles where username = '0399000241';
  select user_id into v_other from public.student_profiles where username = '0399000242';

  -- Dữ liệu thử: 1 đề + 1 cấp từ vựng có thẻ
  select id into v_exam from public.exams order by created_at limit 1;
  select hsk_level into v_level from public.vocab_cards where collection = 'hsk2' group by hsk_level order by hsk_level limit 1;
  select count(*) into v_total from public.vocab_cards where collection = 'hsk2' and hsk_level = v_level;
  assert v_exam is not null and v_total > 0, 'cần có sẵn đề thi và từ vựng hsk2';

  assert public.visibility_label('paid') = 'Trả phí' and public.visibility_label('members') = 'Thành viên', 'nhãn';

  -- ---- Mức Thành viên ----
  update public.exams set visibility = 'members' where id = v_exam;
  insert into public.vocab_level_visibility (collection, hsk_level, visibility) values ('hsk2', v_level, 'members')
  on conflict (collection, hsk_level) do update set visibility = excluded.visibility;
  perform pg_temp.act_as(null);
  assert not public.can_view_exam(v_exam), 'khách chưa đăng nhập không xem đề Thành viên';
  assert pg_temp.visible_cards('hsk2', v_level) = 0, 'khách chưa đăng nhập không đọc thẻ Thành viên';
  perform pg_temp.act_as(v_guest);
  assert public.can_view_exam(v_exam), 'tài khoản khách xem được đề Thành viên';
  assert pg_temp.visible_cards('hsk2', v_level) = v_total, 'tài khoản khách đọc được thẻ Thành viên';

  -- ---- Mức Trả phí ----
  update public.exams set visibility = 'paid' where id = v_exam;
  update public.vocab_level_visibility set visibility = 'paid' where collection = 'hsk2' and hsk_level = v_level;
  perform pg_temp.act_as(v_guest);
  assert not public.can_view_exam(v_exam), 'chưa được cấp → không xem đề Trả phí';
  assert pg_temp.visible_cards('hsk2', v_level) = 0, 'chưa được cấp → không đọc thẻ Trả phí';
  assert public.my_student_context() -> 'access' = '[]'::jsonb, 'chưa có quyền nào';
  perform pg_temp.expect_error(format('select public.grant_access(array[%L]::uuid[], array[''exams''])', v_guest), 'khách tự cấp quyền');

  perform pg_temp.act_as(v_admin);
  assert public.has_permission('access.manage'), 'admin phải có access.manage';
  assert public.can_view_exam(v_exam) and pg_temp.visible_cards('hsk2', v_level) = v_total, 'nhân sự xem được mọi mức';
  perform pg_temp.expect_error(format('select public.grant_access(array[%L]::uuid[], array[''video''])', v_guest), 'module lạ');
  perform pg_temp.expect_error(format('select public.grant_access(array[%L]::uuid[], array[''exams''], now() - interval ''1 day'')', v_guest), 'hạn trong quá khứ');
  perform pg_temp.expect_error(format('select public.grant_access(array[%L]::uuid[], array[''exams''], null, interval ''-1 day'')', v_guest), 'thời lượng âm');
  perform pg_temp.expect_error(format('select public.grant_access(array[%L]::uuid[], array[''exams''])', v_admin), 'cấp cho nhân sự');
  v_res := public.grant_access(array[v_guest], array['exams'], null, interval '30 days', 'Chuyển khoản 16/10');
  assert (v_res ->> 'ok')::boolean and (v_res ->> 'count')::int = 1, 'cấp quyền: ' || v_res::text;
  select expires_at into v_exp from public.access_grants where user_id = v_guest and module = 'exams';
  assert v_exp between now() + interval '29 days 23 hours' and now() + interval '30 days 1 hour', 'hạn 30 ngày';

  perform pg_temp.act_as(v_guest);
  assert public.can_view_exam(v_exam), 'được cấp đề thi → xem đề Trả phí';
  assert public.has_access('exams') and not public.has_access('flashcards'), 'chỉ module đã cấp';
  assert pg_temp.visible_cards('hsk2', v_level) = 0, 'quyền đề thi không mở flashcards';
  assert public.my_student_context() -> 'access' -> 0 ->> 'module' = 'exams', 'ngữ cảnh có quyền';
  perform pg_temp.act_as(v_other);
  assert not public.can_view_exam(v_exam), 'tài khoản khác không được hưởng';

  -- Gia hạn cộng dồn, cấp nhiều người nhiều module
  perform pg_temp.act_as(v_admin);
  perform public.grant_access(array[v_guest, v_other], array['exams', 'flashcards'], null, interval '1 month');
  select expires_at into v_exp from public.access_grants where user_id = v_guest and module = 'exams';
  assert v_exp > now() + interval '57 days', 'gia hạn phải cộng vào hạn còn lại';
  assert (select note from public.access_grants where user_id = v_guest and module = 'exams') = 'Chuyển khoản 16/10', 'giữ ghi chú cũ';
  assert (select count(*) from public.access_grants where user_id in (v_guest, v_other)) = 4, '4 dòng quyền';
  perform pg_temp.act_as(v_guest);
  assert pg_temp.visible_cards('hsk2', v_level) = v_total, 'được cấp flashcards → đọc thẻ Trả phí';

  assert exists (select 1 from public.activity_log where action = 'grant' and created_at = now() and summary like '%(thêm 1 tháng)%'),
    'nhật ký ghi thời lượng tiếng Việt';
  perform pg_temp.act_as(v_guest);
  -- Học viên chỉ đọc quyền của mình
  execute 'set local role authenticated';
  assert (select count(*) from public.access_grants) = 2, 'khách chỉ thấy 2 dòng của mình';
  reset role;

  -- Hết hạn
  update public.access_grants set expires_at = now() - interval '1 minute' where user_id = v_guest;
  assert not public.can_view_exam(v_exam) and pg_temp.visible_cards('hsk2', v_level) = 0, 'hết hạn → khoá lại';
  assert public.my_student_context() -> 'access' = '[]'::jsonb, 'quyền hết hạn không hiện';

  -- Gia hạn sau khi hết hạn tính từ bây giờ; không thời hạn; ngày cụ thể
  perform pg_temp.act_as(v_admin);
  perform public.grant_access(array[v_guest], array['exams'], null, interval '7 days');
  select expires_at into v_exp from public.access_grants where user_id = v_guest and module = 'exams';
  assert v_exp between now() + interval '6 days 23 hours' and now() + interval '7 days 1 hour', 'hết hạn rồi → tính từ bây giờ';
  perform public.grant_access(array[v_guest], array['exams']);
  assert (select expires_at from public.access_grants where user_id = v_guest and module = 'exams') is null, 'không thời hạn';
  perform public.grant_access(array[v_guest], array['exams'], null, interval '1 month');
  assert (select expires_at from public.access_grants where user_id = v_guest and module = 'exams') is null, 'cộng thời lượng không rút ngắn quyền không thời hạn';
  perform public.grant_access(array[v_guest], array['exams'], date_trunc('day', now()) + interval '90 days');
  assert (select expires_at from public.access_grants where user_id = v_guest and module = 'exams')
         = date_trunc('day', now()) + interval '90 days', 'ngày cụ thể';

  -- Khoá tài khoản → mất quyền dù còn hạn
  update public.student_profiles set status = 'locked' where user_id = v_guest;
  perform pg_temp.act_as(v_guest);
  assert not public.has_access('exams'), 'tài khoản bị khoá không dùng quyền';
  update public.student_profiles set status = 'active' where user_id = v_guest;

  -- Thu hồi
  perform pg_temp.act_as(v_admin);
  v_res := public.revoke_access(array[v_guest], array['exams']);
  assert (v_res ->> 'count')::int = 1, 'thu hồi 1 dòng';
  perform pg_temp.act_as(v_guest);
  assert not public.can_view_exam(v_exam), 'thu hồi đề thi';
  assert exists (select 1 from public.access_grants where user_id = v_guest and module = 'flashcards'), 'giữ quyền flashcards';
  perform pg_temp.expect_error(format('select public.revoke_access(array[%L]::uuid[], array[''flashcards''])', v_guest), 'khách tự thu hồi');

  -- Nhật ký
  assert (select count(*) from public.activity_log where action in ('grant', 'revoke') and created_at >= now() - interval '1 minute') >= 5,
    'phải ghi nhật ký cấp / thu hồi';
  perform pg_temp.act_as(v_admin);
  perform public.set_vocab_visibility('hsk2', array[v_level], 'paid');
  assert (select action from public.activity_log where entity_type = 'vocab' order by created_at desc limit 1) = 'paid_only', 'nhật ký Trả phí';

  -- Đề Công khai: khách chưa đăng nhập chỉ bị chặn khi đã áp 024b
  update public.exams set visibility = 'public' where id = v_exam;
  perform pg_temp.act_as(null);
  assert public.can_view_exam(v_exam) = not v_024b, 'đề Công khai với khách chưa đăng nhập (024b = ' || v_024b || ')';
  perform pg_temp.act_as(v_other);
  assert public.can_view_exam(v_exam), 'tài khoản xem được đề Công khai';

  raise notice 'TẤT CẢ ĐẠT (024b: %)', v_024b;
end $$;
