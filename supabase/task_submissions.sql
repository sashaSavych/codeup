-- Peer solution sharing (opt-in snapshots). Run after practice_progress.sql + admin.sql.
-- Script order: see supabase/README.md

alter table public.classes
  add column if not exists peer_solutions_enabled boolean not null default false;

create table if not exists public.task_submissions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id text not null references public.practice_tasks (id) on delete cascade,
  code_snapshot text not null,
  share_opt_in boolean not null default false,
  submitted_at timestamptz not null default now(),
  primary key (user_id, task_id)
);

create index if not exists task_submissions_task_share_idx
  on public.task_submissions (task_id)
  where share_opt_in = true;

alter table public.task_submissions enable row level security;

-- Learners manage only their rows; no peer SELECT on table (use RPC).
drop policy if exists "task_submissions_select_own" on public.task_submissions;
create policy "task_submissions_select_own"
  on public.task_submissions
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_current_user_admin() or public.is_current_user_teacher());

drop policy if exists "task_submissions_insert_own" on public.task_submissions;
create policy "task_submissions_insert_own"
  on public.task_submissions
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "task_submissions_update_own" on public.task_submissions;
create policy "task_submissions_update_own"
  on public.task_submissions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on table public.task_submissions to authenticated;

-- Anonymous peer gallery: ≥3 opt-in from same class with peer_solutions_enabled.
create or replace function public.list_peer_solutions(p_task_id text)
returns table (code_snapshot text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_class_id uuid;
  v_enabled boolean;
  v_count int;
begin
  select p.class_id into v_class_id
  from public.profiles p
  where p.id = auth.uid();

  if v_class_id is null then
    return;
  end if;

  select c.peer_solutions_enabled into v_enabled
  from public.classes c
  where c.id = v_class_id;

  if not coalesce(v_enabled, false) then
    return;
  end if;

  select count(*)::int into v_count
  from public.task_submissions ts
  join public.profiles p on p.id = ts.user_id
  where ts.task_id = p_task_id
    and ts.share_opt_in = true
    and p.class_id = v_class_id;

  if v_count < 3 then
    return;
  end if;

  return query
  select ts.code_snapshot
  from public.task_submissions ts
  join public.profiles p on p.id = ts.user_id
  where ts.task_id = p_task_id
    and ts.share_opt_in = true
    and p.class_id = v_class_id
  order by ts.submitted_at desc
  limit 20;
end;
$$;

revoke all on function public.list_peer_solutions(text) from public;
grant execute on function public.list_peer_solutions(text) to authenticated;

-- Count for UI threshold messaging (same rules, no snapshots until ≥3).
create or replace function public.peer_solutions_count(p_task_id text)
returns int
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_class_id uuid;
  v_enabled boolean;
begin
  select p.class_id into v_class_id
  from public.profiles p
  where p.id = auth.uid();

  if v_class_id is null then
    return 0;
  end if;

  select c.peer_solutions_enabled into v_enabled
  from public.classes c
  where c.id = v_class_id;

  if not coalesce(v_enabled, false) then
    return 0;
  end if;

  return (
    select count(*)::int
    from public.task_submissions ts
    join public.profiles p on p.id = ts.user_id
    where ts.task_id = p_task_id
      and ts.share_opt_in = true
      and p.class_id = v_class_id
  );
end;
$$;

revoke all on function public.peer_solutions_count(text) from public;
grant execute on function public.peer_solutions_count(text) to authenticated;
