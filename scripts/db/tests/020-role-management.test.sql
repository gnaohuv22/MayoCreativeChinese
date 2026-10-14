-- Kiểm tra migration 020 — chạy SAU file migration trong cùng lệnh, luôn kèm --dry-run:
--   node scripts/db/run-sql.mjs --dry-run src/app/features/admin/data/020-role-management.sql scripts/db/tests/020-role-management.test.sql
-- Đóng vai tài khoản "admin" (và 1 tài khoản nhân sự tạo thử), mọi thay đổi bị rollback.

create or replace function pg_temp.act_as(p_user uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

create or replace function pg_temp.expect_error(p_sql text, p_label text)
returns void
language plpgsql
as $$
begin
  execute p_sql;
  raise exception 'FAIL: % — lẽ ra phải bị từ chối', p_label;
exception when others then
  if sqlerrm like 'FAIL:%' then raise; end if;
  raise notice 'ok (bị từ chối đúng): % — %', p_label, sqlerrm;
end;
$$;

do $$
declare
  v_admin uuid := (select user_id from public.staff_profiles where username = 'admin');
  v_new uuid;
begin
  if v_admin is null then raise exception 'FAIL: không thấy tài khoản admin'; end if;
  perform pg_temp.act_as(v_admin);

  assert public.has_permission('role.manage'), 'admin phải có role.manage';
  assert (public.my_staff_context() -> 'permissions') ? 'role.manage', 'my_staff_context thiếu role.manage';

  -- Tạo vai trò mới
  perform public.save_role('{"id":"tro_giang_test","label":"Trợ giảng (thử)","description":"","permissions":["content.read","class.manage"],"create":true}');
  assert (select count(*) from public.role_permissions where role_id = 'tro_giang_test') = 2, 'vai trò mới phải có 2 quyền';

  -- Sửa vai trò: thêm 1, bỏ 1
  perform public.save_role('{"id":"tro_giang_test","label":"Trợ giảng (thử)","description":"x","permissions":["content.read","content.update"],"create":false}');
  assert exists (select 1 from public.role_permissions where role_id = 'tro_giang_test' and permission = 'content.update'), 'thiếu content.update';
  assert not exists (select 1 from public.role_permissions where role_id = 'tro_giang_test' and permission = 'class.manage'), 'class.manage phải bị bỏ';

  perform pg_temp.expect_error($s$select public.save_role('{"id":"tro_giang_test","label":"X","permissions":[],"create":true}')$s$, 'tạo trùng mã');
  perform pg_temp.expect_error($s$select public.save_role('{"id":"tro_giang_test","label":"X","permissions":["khong.co"]}')$s$, 'quyền không tồn tại');
  perform pg_temp.expect_error($s$select public.save_role('{"id":"admin","label":"Quản trị viên","permissions":["content.read"]}')$s$, 'bỏ role.manage khỏi vai trò của mình');
  perform pg_temp.expect_error($s$select public.delete_role('admin')$s$, 'xoá vai trò admin');

  -- Tạo nhân sự thử
  perform pg_temp.expect_error($s$select public.create_staff('{"username":"TestRoleXY","full_name":"Thử","role_id":"tro_giang_test","password":"yeu"}')$s$, 'mật khẩu yếu');
  perform pg_temp.expect_error($s$select public.create_staff('{"username":"admin","full_name":"Thử","role_id":"staff","password":"Abcdefgh12345!x"}')$s$, 'trùng tên đăng nhập');
  v_new := public.create_staff('{"username":"TestRoleXY","full_name":"Nhân sự thử","role_id":"tro_giang_test","password":"Abcdefgh12345!x"}');
  assert exists (select 1 from auth.users where id = v_new and email = 'testrolexy@mayocreativechinese.edu.vn'), 'thiếu auth.users';
  assert exists (select 1 from auth.identities where user_id = v_new), 'thiếu auth.identities';

  perform pg_temp.expect_error(format('select public.delete_role(%L)', 'tro_giang_test'), 'xoá vai trò còn nhân sự');
  perform pg_temp.expect_error(format('select public.set_staff_role(%L, %L)', v_admin, 'staff'), 'tự đổi vai trò');
  perform pg_temp.expect_error(format('select public.set_staff_status(%L, %L)', v_admin, 'locked'), 'tự khoá');

  -- Đổi vai trò + khoá
  perform public.set_staff_role(v_new, 'staff');
  assert (select role_id from public.staff_profiles where user_id = v_new) = 'staff', 'đổi vai trò không ăn';
  perform public.set_staff_status(v_new, 'locked');
  assert (select banned_until from auth.users where id = v_new) = 'infinity', 'khoá phải đặt banned_until';

  -- Nhân sự bị khoá mất quyền ngay, kể cả token còn hạn
  perform pg_temp.act_as(v_new);
  assert not public.has_permission('content.read'), 'tài khoản khoá vẫn còn quyền';
  assert public.my_staff_context() is null, 'tài khoản khoá vẫn có staff context';
  perform pg_temp.expect_error($s$select public.save_role('{"id":"x1","label":"X1","permissions":[],"create":true}')$s$, 'người không có role.manage tạo vai trò');

  perform pg_temp.act_as(v_admin);
  perform public.set_staff_status(v_new, 'active');
  perform pg_temp.act_as(v_new);
  assert public.has_permission('content.read'), 'mở khoá phải trả lại quyền';

  perform pg_temp.act_as(v_admin);
  perform public.set_staff_role(v_new, 'tro_giang_test');
  delete from auth.users where id = v_new;
  perform public.delete_role('tro_giang_test');
  assert not exists (select 1 from public.roles where id = 'tro_giang_test'), 'xoá vai trò không ăn';

  assert (select count(*) from public.activity_log where entity_type = 'role' and created_at = now()) >= 3, 'thiếu nhật ký vai trò';
  raise notice 'TẤT CẢ ĐẠT';
end $$;

select r.id, r.label, array_agg(rp.permission order by rp.permission) as permissions
from public.roles r left join public.role_permissions rp on rp.role_id = r.id
group by r.id, r.label order by r.id;
