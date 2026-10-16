-- ==============================================================================
-- 023 — SỬA learner_reset_password: phiên từ link khôi phục có amr = otp
-- ==============================================================================
-- Supabase Auth (luồng implicit) ghi amr method = 'otp' cho phiên mở từ link khôi phục, không phải
-- 'recovery' như 022 giả định → trang /dat-lai-mat-khau luôn báo link hết hạn.
-- Chấp nhận 'recovery' hoặc 'otp', nhưng chỉ khi tài khoản vừa yêu cầu khôi phục (recovery_sent_at
-- trong 1 giờ) và phiên được mở sau lúc gửi thư. Phiên từ link xác nhận đăng ký / đổi email cũng là
-- 'otp' nhưng không có yêu cầu khôi phục nên không đặt lại được. Chạy được nhiều lần.

create or replace function public.learner_reset_password(p_new text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sent timestamptz;
begin
  select recovery_sent_at into v_sent from auth.users where id = auth.uid();
  if v_sent is null or v_sent < now() - interval '1 hour' or not exists (
    select 1 from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) a
    where a ->> 'method' in ('recovery', 'otp')
      and to_timestamp((a ->> 'timestamp')::bigint) >= date_trunc('second', v_sent)
  ) then
    return jsonb_build_object('ok', false, 'error', 'not_recovery');
  end if;
  if not is_learner() or exists (select 1 from staff_profiles where user_id = auth.uid()) then
    return jsonb_build_object('ok', false, 'error', 'not_student');
  end if;
  if not student_password_ok(coalesce(p_new, '')) then
    return jsonb_build_object('ok', false, 'error', 'weak_password');
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(p_new, extensions.gen_salt('bf', 10)),
      recovery_sent_at = null,
      updated_at = now()
  where id = auth.uid();
  update student_profiles set must_change_password = false where user_id = auth.uid();
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.learner_reset_password(text) from public;
grant execute on function public.learner_reset_password(text) to authenticated;
