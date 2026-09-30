-- ==============================================================================
-- 015 — CHỈ CHO PHÉP ANON GỌI REST QUA PROXY (api/rest.mjs)
-- ==============================================================================
-- Proxy trên Vercel gắn header x-mcc-proxy = bí mật; Vercel Firewall giới hạn tần suất
-- trước proxy. Request anon gọi thẳng supabase.co không có header này sẽ bị từ chối.
-- Bí mật lưu trong private.settings (không lộ qua API). Chưa có bí mật = chưa chặn,
-- nên có thể chạy file này trước khi deploy proxy.
--
-- Bật chặn (chạy riêng, KHÔNG commit giá trị):
--   insert into private.settings (key, value) values ('proxy_secret', '<bí mật>')
--   on conflict (key) do update set value = excluded.value;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.settings (
  key   text primary key,
  value text not null
);
revoke all on private.settings from public, anon, authenticated;

create or replace function public.check_rest_proxy()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  if coalesce(current_setting('request.jwt.claims', true)::json ->> 'role', 'anon') <> 'anon' then
    return;
  end if;

  select value into v_secret from private.settings where key = 'proxy_secret';
  if v_secret is null then
    return;
  end if;

  if coalesce(current_setting('request.headers', true)::json ->> 'x-mcc-proxy', '') <> v_secret then
    raise insufficient_privilege using message = 'Direct API access is not allowed';
  end if;
end;
$$;

revoke all on function public.check_rest_proxy() from public;
grant execute on function public.check_rest_proxy() to anon, authenticated;

alter role authenticator set pgrst.db_pre_request = 'public.check_rest_proxy';
notify pgrst, 'reload config';
