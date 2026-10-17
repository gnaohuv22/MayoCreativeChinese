-- Kiểm tra migration 026 — luôn kèm --dry-run:
--   node scripts/db/run-sql.mjs --dry-run src/app/features/classes/data/026-device-limit.sql scripts/db/tests/026-device-limit.test.sql

-- Đóng vai: người dùng + phiên + thiết bị (null = không gửi header) + đường dẫn request
create or replace function pg_temp.act_as(p_user uuid, p_session uuid, p_device text, p_path text default '/vocab_cards')
returns void
language sql
as $$
  select set_config('request.jwt.claims',
           case when p_user is null then '{"role":"anon"}'
                else json_build_object('sub', p_user, 'role', 'authenticated', 'session_id', p_session)::text end, true),
         set_config('request.headers',
           (json_build_object('x-mcc-client-ip', '203.0.113.26') :: jsonb
            || case when p_device is null then '{}'::jsonb else jsonb_build_object('x-mcc-device', p_device) end)::text, true),
         set_config('request.path', p_path, true);
$$;

-- Cổng chặn có cho request đi qua không
create or replace function pg_temp.gate_ok()
returns boolean
language plpgsql
as $$
begin
  perform public.check_rest_proxy();
  return true;
exception when others then
  if sqlerrm = 'device_not_registered' then return false; end if;
  raise;
end;
$$;

create or replace function pg_temp.new_session(p_user uuid)
returns uuid
language sql
as $$
  insert into auth.sessions (id, user_id, created_at, updated_at) values (gen_random_uuid(), p_user, now(), now()) returning id
$$;

do $$
declare
  v_admin uuid := (select user_id from public.staff_profiles where username = 'admin');
  v_guest uuid;
  s1 uuid; s2 uuid; s3 uuid; s4 uuid;
  d1 text := 'dev-aaaaaaaaaaaaaaaa1';
  d2 text := 'dev-aaaaaaaaaaaaaaaa2';
  d3 text := 'dev-aaaaaaaaaaaaaaaa3';
  d4 text := 'dev-aaaaaaaaaaaaaaaa4';
  v_res jsonb;
begin
  perform pg_temp.act_as(null, null, null);
  assert (public.register_guest('k026@example.com', '0399000261', 'abc12345', 'Khách 026', true) ->> 'ok')::boolean, 'tạo khách';
  select user_id into v_guest from public.student_profiles where username = '0399000261';
  s1 := pg_temp.new_session(v_guest); s2 := pg_temp.new_session(v_guest);
  s3 := pg_temp.new_session(v_guest); s4 := pg_temp.new_session(v_guest);

  -- Bản web cũ (không gửi header) vẫn chạy khi chưa bật chế độ nghiêm
  perform pg_temp.act_as(v_guest, s1, null);
  assert pg_temp.gate_ok(), 'không header + chưa nghiêm → cho qua';

  -- Có header, chưa đăng ký → chặn, trừ RPC đăng ký
  perform pg_temp.act_as(v_guest, s1, d1);
  assert not pg_temp.gate_ok(), 'thiết bị chưa đăng ký phải bị chặn';
  perform pg_temp.act_as(v_guest, s1, d1, '/rpc/register_device');
  assert pg_temp.gate_ok(), 'register_device luôn được gọi';
  assert public.register_device('ngắn', 'x') ->> 'error' = 'invalid_device', 'mã thiết bị sai';
  assert (public.register_device(d1, 'Chrome · Windows') ->> 'ok')::boolean, 'đăng ký thiết bị 1';
  perform pg_temp.act_as(v_guest, s1, d1);
  assert pg_temp.gate_ok(), 'thiết bị 1 đã đăng ký → qua';
  -- Mã thiết bị bị chép sang phiên khác
  perform pg_temp.act_as(v_guest, s2, d1);
  assert not pg_temp.gate_ok(), 'cùng mã thiết bị nhưng phiên khác → chặn';

  -- Thiết bị 2, 3 → được; thiết bị 4 → vượt giới hạn
  perform pg_temp.act_as(v_guest, s2, d2, '/rpc/register_device');
  assert (public.register_device(d2, 'Safari · iPhone') ->> 'ok')::boolean, 'thiết bị 2';
  perform pg_temp.act_as(v_guest, s3, d3, '/rpc/register_device');
  assert (public.register_device(d3, 'Edge · Windows') ->> 'ok')::boolean, 'thiết bị 3';
  perform pg_temp.act_as(v_guest, s4, d4, '/rpc/register_device');
  v_res := public.register_device(d4, 'Firefox · Linux');
  assert v_res ->> 'error' = 'device_limit' and jsonb_array_length(v_res -> 'devices') = 3, 'thiết bị 4 vượt giới hạn: ' || v_res::text;
  perform pg_temp.act_as(v_guest, s4, d4);
  assert not pg_temp.gate_ok(), 'thiết bị 4 bị chặn';

  -- Đăng nhập lại trên thiết bị 1 (phiên mới) → cập nhật phiên, không tốn chỗ
  perform pg_temp.act_as(v_guest, s4, d1, '/rpc/register_device');
  assert (public.register_device(d1, 'Chrome · Windows') ->> 'ok')::boolean, 'thiết bị cũ đăng nhập lại';
  assert (select count(*) from public.learner_devices where user_id = v_guest) = 3, 'vẫn 3 thiết bị';

  -- Tự gỡ: không gỡ thiết bị đang dùng, gỡ thiết bị khác 1 lần / 30 ngày, phiên bị xoá
  perform pg_temp.act_as(v_guest, s4, d1, '/rpc/remove_my_device');
  assert public.remove_my_device(d1) ->> 'error' = 'current_device', 'không tự gỡ thiết bị đang dùng';
  v_res := public.remove_my_device(d2);
  assert (v_res ->> 'ok')::boolean and jsonb_array_length(v_res -> 'devices') = 2, 'gỡ thiết bị 2: ' || v_res::text;
  assert not exists (select 1 from auth.sessions where id = s2), 'phiên của thiết bị 2 phải bị xoá';
  assert public.remove_my_device(d3) ->> 'error' = 'too_soon', 'lần gỡ thứ 2 trong 30 ngày';
  assert (public.my_devices() ->> 'next_removal_at') is not null, 'có ngày được gỡ tiếp';

  -- Khách không gọi được hàm của nhân sự
  begin
    perform public.admin_remove_device(v_guest, d3);
    raise exception 'FAIL: khách gỡ được qua hàm nhân sự';
  exception when insufficient_privilege then null;
  end;

  -- Nhân sự: không bị giới hạn, xem + gỡ bất kỳ lúc nào
  perform pg_temp.act_as(v_admin, pg_temp.new_session(v_admin), d4);
  assert pg_temp.gate_ok(), 'nhân sự không bị giới hạn';
  assert (public.register_device(d4) ->> 'exempt')::boolean, 'nhân sự được miễn';
  assert jsonb_array_length(public.student_devices(v_guest) -> 'devices') = 2, 'admin xem được 2 thiết bị';
  assert (public.admin_remove_device(v_guest, d3) ->> 'ok')::boolean, 'admin gỡ thiết bị 3';
  assert not exists (select 1 from auth.sessions where id = s3), 'phiên thiết bị 3 bị xoá';

  -- Chế độ nghiêm: không header → chặn học viên
  insert into private.settings (key, value) values ('device_limit_strict', 'on')
  on conflict (key) do update set value = excluded.value;
  perform pg_temp.act_as(v_guest, s1, null);
  assert not pg_temp.gate_ok(), 'chế độ nghiêm: không header → chặn';
  perform pg_temp.act_as(v_guest, s1, null, '/rpc/my_student_context');
  assert pg_temp.gate_ok(), 'chế độ nghiêm: vẫn nạp được ngữ cảnh';

  raise notice 'TẤT CẢ ĐẠT';
end $$;
