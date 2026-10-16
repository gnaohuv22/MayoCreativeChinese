-- Kiểm tra migration 023 — luôn kèm --dry-run:
--   node scripts/db/run-sql.mjs --dry-run src/app/features/classes/data/023-learner-reset-otp.sql scripts/db/tests/023-learner-reset-otp.test.sql

create or replace function pg_temp.act_as(p_user uuid, p_method text, p_at timestamptz)
returns void
language sql
as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated',
           'amr', json_build_array(json_build_object('method', p_method, 'timestamp', extract(epoch from p_at)::bigint)))::text, true),
         set_config('request.headers', '{"x-mcc-client-ip":"203.0.113.23"}', true);
$$;

do $$
declare
  v_guest uuid;
begin
  perform set_config('request.headers', '{"x-mcc-client-ip":"203.0.113.23"}', true);
  assert (public.register_guest('k023@example.com', '0399000231', 'abc12345', 'Khách 023', true) ->> 'ok')::boolean, 'tạo khách';
  select user_id into v_guest from public.student_profiles where username = '0399000231';

  -- Chưa yêu cầu khôi phục: phiên otp (vd. từ link xác nhận đăng ký) không đặt lại được
  perform pg_temp.act_as(v_guest, 'otp', now());
  assert public.learner_reset_password('moi12345') ->> 'error' = 'not_recovery', 'không có yêu cầu khôi phục';

  -- Có yêu cầu khôi phục 10 phút trước, phiên otp mở sau đó → được
  update auth.users set recovery_sent_at = now() - interval '10 minutes' where id = v_guest;
  perform pg_temp.act_as(v_guest, 'password', now());
  assert public.learner_reset_password('moi12345') ->> 'error' = 'not_recovery', 'phiên mật khẩu thường không được';
  perform pg_temp.act_as(v_guest, 'otp', now() - interval '20 minutes');
  assert public.learner_reset_password('moi12345') ->> 'error' = 'not_recovery', 'phiên mở trước khi gửi thư';
  perform pg_temp.act_as(v_guest, 'otp', now());
  assert (public.learner_reset_password('moi12345') ->> 'ok')::boolean, 'phải đặt lại được';
  assert exists (select 1 from auth.users where id = v_guest and recovery_sent_at is null
                   and encrypted_password = extensions.crypt('moi12345', encrypted_password)), 'mật khẩu chưa đổi';
  assert public.learner_reset_password('lan2abc1') ->> 'error' = 'not_recovery', 'link chỉ dùng 1 lần';

  -- Yêu cầu quá 1 giờ
  update auth.users set recovery_sent_at = now() - interval '2 hours' where id = v_guest;
  perform pg_temp.act_as(v_guest, 'recovery', now());
  assert public.learner_reset_password('moi12345') ->> 'error' = 'not_recovery', 'yêu cầu quá 1 giờ';

  raise notice 'TẤT CẢ ĐẠT';
end $$;
