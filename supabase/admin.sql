-- Admin: classes list, user roles, blocking. Run in Supabase SQL Editor.
-- Full script order: supabase/README.md (this file after profiles.sql; before practice_progress.sql).
-- First admin: update public.profiles set role = 'admin' where id = '<your-auth-user-uuid>';
--
-- Order matters: profiles.role must exist before is_current_user_admin() is created.

-- ---------------------------------------------------------------------------
-- Classes table (policies that need admin — added after role column + helper)
-- ---------------------------------------------------------------------------
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (name)
);

create index if not exists classes_sort_order_idx on public.classes (sort_order, name);

alter table public.classes enable row level security;

drop policy if exists "classes_select_authenticated" on public.classes;
create policy "classes_select_authenticated"
  on public.classes for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Profiles: role, block flag, link to class (before functions that reference role)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'student'
    check (role in ('student', 'teacher', 'admin'));

alter table public.profiles
  add column if not exists is_blocked boolean not null default false;

alter table public.profiles
  add column if not exists class_id uuid references public.classes (id) on delete set null;

create index if not exists profiles_class_id_idx on public.profiles (class_id);
create index if not exists profiles_is_blocked_idx on public.profiles (is_blocked) where is_blocked;

alter table public.profiles
  add column if not exists teacher_role_requested boolean not null default false;

create index if not exists profiles_teacher_role_req_idx
  on public.profiles (teacher_role_requested)
  where teacher_role_requested;

-- ---------------------------------------------------------------------------
-- Helper: avoids RLS recursion when policies on profiles reference profiles
-- ---------------------------------------------------------------------------
create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.role = 'admin' from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to authenticated;

create or replace function public.is_current_user_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.role = 'teacher' from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_current_user_teacher() from public;
grant execute on function public.is_current_user_teacher() to authenticated;

-- ---------------------------------------------------------------------------
-- Classes: admin-only write policies (after is_current_user_admin exists)
-- ---------------------------------------------------------------------------
drop policy if exists "classes_insert_admin" on public.classes;
create policy "classes_insert_admin"
  on public.classes for insert
  to authenticated
  with check (public.is_current_user_admin());

drop policy if exists "classes_update_admin" on public.classes;
create policy "classes_update_admin"
  on public.classes for update
  to authenticated
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "classes_delete_admin" on public.classes;
create policy "classes_delete_admin"
  on public.classes for delete
  to authenticated
  using (public.is_current_user_admin());

-- ---------------------------------------------------------------------------
-- Trigger: non-admins cannot change own role / is_blocked
-- ---------------------------------------------------------------------------
create or replace function public.profiles_lock_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_current_user_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.role := coalesce(new.role, 'student');
    if new.role is distinct from 'student' then
      new.role := 'student';
    end if;
    new.is_blocked := false;
    -- teacher_role_requested may be set by the new user (e.g. signup / profile); admins set role later
    return new;
  end if;
  if tg_op = 'UPDATE' and new.id = auth.uid() then
    new.role := old.role;
    new.is_blocked := old.is_blocked;
    -- teacher_role_requested: user may toggle own request; admins bypass above
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_lock_privileged_fields_trg on public.profiles;
create trigger profiles_lock_privileged_fields_trg
  before insert or update on public.profiles
  for each row
  execute procedure public.profiles_lock_privileged_fields();

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  to authenticated
  using (public.is_current_user_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

-- ---------------------------------------------------------------------------
-- RPC: list users with email (admin only; empty for others)
-- ---------------------------------------------------------------------------
-- Postgres does not allow CREATE OR REPLACE when OUT/return row shape changes; drop first.
drop function if exists public.admin_list_users_with_email();

create function public.admin_list_users_with_email()
returns table (
  id uuid,
  email text,
  first_name text,
  last_name text,
  role text,
  is_blocked boolean,
  class_id uuid,
  class_list_name text,
  class_free_name text,
  teacher_role_requested boolean,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    u.email::text,
    p.first_name,
    p.last_name,
    p.role,
    p.is_blocked,
    p.class_id,
    c.name,
    p.class_name,
    p.teacher_role_requested,
    p.updated_at
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.classes c on c.id = p.class_id
  where public.is_current_user_admin();
$$;

revoke all on function public.admin_list_users_with_email() from public;
grant execute on function public.admin_list_users_with_email() to authenticated;
