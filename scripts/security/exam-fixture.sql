-- Isolated-only fixture, never apply to Supabase. Helper functions model identity/access;
-- the migration, SQL privileges, RPCs, grading and answer-state logic run unmodified.
create role anon;
create role authenticated;
create schema auth;
grant usage on schema auth, public to anon, authenticated;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
create table public.classes(id uuid primary key);
create table public.student_profiles(user_id uuid primary key, class_id uuid references classes);
create function public.is_learner() returns boolean language sql stable security definer as $$ select exists(select 1 from public.student_profiles where user_id=auth.uid()) $$;
create function public.my_class_id() returns uuid language sql stable security definer as $$ select class_id from public.student_profiles where user_id=auth.uid() $$;
create function public.has_permission(text) returns boolean language sql stable as $$ select coalesce(current_setting('test.staff',true),'')='true' $$;
create function public.can_view_exam(uuid) returns boolean language sql stable as $$ select auth.uid() is not null and coalesce(current_setting('test.denied',true),'')<>'true' $$;
