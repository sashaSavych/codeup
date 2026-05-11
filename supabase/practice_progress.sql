-- Server-side practice completion (for teachers viewing pupil progress).
-- Full script order: supabase/README.md (run after profiles.sql, topics.sql, practice_tasks.sql, admin.sql).

create table if not exists public.practice_task_passes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id text not null references public.practice_tasks (id) on delete cascade,
  passed_at timestamptz not null default now(),
  primary key (user_id, task_id)
);

create index if not exists practice_task_passes_user_idx on public.practice_task_passes (user_id);

alter table public.practice_task_passes enable row level security;

drop policy if exists "practice_task_passes_select_scope" on public.practice_task_passes;
create policy "practice_task_passes_select_scope"
  on public.practice_task_passes
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_current_user_teacher()
    or public.is_current_user_admin()
  );

drop policy if exists "practice_task_passes_insert_own" on public.practice_task_passes;
create policy "practice_task_passes_insert_own"
  on public.practice_task_passes
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "practice_task_passes_update_own" on public.practice_task_passes;
create policy "practice_task_passes_update_own"
  on public.practice_task_passes
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on table public.practice_task_passes to authenticated;

-- ---------------------------------------------------------------------------
-- Teachers / admins: summary list of pupils (learners) with practice counts
-- ---------------------------------------------------------------------------
create or replace function public.teacher_list_pupils_progress()
returns table (
  pupil_id uuid,
  email text,
  first_name text,
  last_name text,
  class_display_name text,
  completed bigint,
  total_tasks bigint
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
    coalesce(c.name, p.class_name, ''::text),
    (select count(*)::bigint from public.practice_task_passes x where x.user_id = p.id),
    (select count(*)::bigint from public.practice_tasks pt)
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.classes c on c.id = p.class_id
  where
    (public.is_current_user_teacher() or public.is_current_user_admin())
    and p.role = 'student'
    and not p.is_blocked;
$$;

revoke all on function public.teacher_list_pupils_progress() from public;
grant execute on function public.teacher_list_pupils_progress() to authenticated;
