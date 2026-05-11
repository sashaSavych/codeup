-- Gamification: daily points, streak, freezes, class leaderboard.
-- Run after: profiles.sql, admin.sql, practice_progress.sql (needs profiles, practice_task_passes).
-- Calendar "day" for streaks and daily caps: Europe/Kyiv local date.

-- ---------------------------------------------------------------------------
-- Columns on profiles
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists competition_opt_in boolean not null default false;

alter table public.profiles
  add column if not exists leaderboard_nickname text;

alter table public.profiles
  add column if not exists competition_score int not null default 0;

alter table public.profiles
  add column if not exists streak_days int not null default 0;

alter table public.profiles
  add column if not exists last_competition_activity_date date;

alter table public.profiles
  add column if not exists freeze_balance int not null default 0;

-- ---------------------------------------------------------------------------
-- Daily points audit (Kyiv calendar dates)
-- ---------------------------------------------------------------------------
create table if not exists public.gamification_daily_scores (
  user_id uuid not null references public.profiles (id) on delete cascade,
  activity_date date not null,
  points int not null default 0 check (points >= 0),
  primary key (user_id, activity_date)
);

create index if not exists gamification_daily_scores_user_idx
  on public.gamification_daily_scores (user_id);

alter table public.gamification_daily_scores enable row level security;

drop policy if exists "gamification_daily_scores_select_own" on public.gamification_daily_scores;
create policy "gamification_daily_scores_select_own"
  on public.gamification_daily_scores for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "gamification_daily_scores_no_client_write" on public.gamification_daily_scores;
create policy "gamification_daily_scores_no_client_write"
  on public.gamification_daily_scores for all
  to authenticated
  using (false)
  with check (false);

-- ---------------------------------------------------------------------------
-- Unique nickname per class among opted-in participants
-- ---------------------------------------------------------------------------
create unique index if not exists profiles_leaderboard_nickname_class_unique
  on public.profiles (class_id, lower(trim(leaderboard_nickname)))
  where
    competition_opt_in
    and class_id is not null
    and leaderboard_nickname is not null
    and length(trim(leaderboard_nickname)) > 0;

-- ---------------------------------------------------------------------------
-- Non-admins cannot change leaderboard_nickname once set (clear allowed when opting out)
-- ---------------------------------------------------------------------------
create or replace function public.profiles_leaderboard_nickname_lock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_current_user_admin() then
    return new;
  end if;
  if tg_op <> 'UPDATE' then
    return new;
  end if;
  if old.leaderboard_nickname is null then
    return new;
  end if;
  if new.leaderboard_nickname is not distinct from old.leaderboard_nickname then
    return new;
  end if;
  if new.competition_opt_in is distinct from true and new.leaderboard_nickname is null then
    return new;
  end if;
  raise exception 'Псевдонім для змагання можна задати лише один раз. Зверніться до адміністратора, якщо потрібна зміна.';
end;
$$;

drop trigger if exists profiles_leaderboard_nickname_lock_trg on public.profiles;
create trigger profiles_leaderboard_nickname_lock_trg
  before update on public.profiles
  for each row
  execute procedure public.profiles_leaderboard_nickname_lock();

-- ---------------------------------------------------------------------------
-- Kyiv "today"
-- ---------------------------------------------------------------------------
create or replace function public.gamification_kyiv_today()
returns date
language sql
stable
as $$
  select (current_timestamp at time zone 'Europe/Kyiv')::date;
$$;

revoke all on function public.gamification_kyiv_today() from public;

-- ---------------------------------------------------------------------------
-- Missed calendar days between last activity date and yesterday (Kyiv).
-- ---------------------------------------------------------------------------
create or replace function public.gamification_apply_idle_gaps(
  p_last date,
  p_score int,
  p_streak int,
  p_freeze int,
  out o_score int,
  out o_streak int,
  out o_freeze int,
  out o_had_reset boolean
)
language plpgsql
as $$
declare
  today date := public.gamification_kyiv_today();
  num_missed int;
  j int;
begin
  o_score := p_score;
  o_streak := p_streak;
  o_freeze := p_freeze;
  o_had_reset := false;
  if p_last is null then
    return;
  end if;
  if p_last >= today then
    return;
  end if;
  num_missed := (today - p_last)::int - 1;
  if num_missed < 1 then
    return;
  end if;
  for j in 1..num_missed loop
    if o_freeze > 0 then
      o_freeze := o_freeze - 1;
    else
      o_score := 0;
      o_streak := 0;
      o_had_reset := true;
      exit;
    end if;
  end loop;
end;
$$;

revoke all on function public.gamification_apply_idle_gaps(date, int, int, int) from public;

-- ---------------------------------------------------------------------------
-- Trigger: new practice_task_passes row (+1 point / day cap 50 Kyiv)
-- ---------------------------------------------------------------------------
create or replace function public.gamification_on_practice_task_pass()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := public.gamification_kyiv_today();
  last_before date;
  score int;
  streak int;
  freeze_bal int;
  opt_in boolean;
  blocked boolean;
  r text;
  had_reset boolean;
  gap_score int;
  gap_streak int;
  gap_freeze int;
  today_pts int;
  old_streak int;
  new_streak int;
  add_point boolean := true;
begin
  select
    p.competition_score,
    p.streak_days,
    p.freeze_balance,
    p.last_competition_activity_date,
    p.competition_opt_in,
    p.is_blocked,
    p.role::text
  into score, streak, freeze_bal, last_before, opt_in, blocked, r
  from public.profiles p
  where p.id = new.user_id
  for update;

  if not found then
    return new;
  end if;

  if blocked or r is distinct from 'student' or not opt_in then
    return new;
  end if;

  select d.points
  into today_pts
  from public.gamification_daily_scores d
  where d.user_id = new.user_id and d.activity_date = today;

  today_pts := coalesce(today_pts, 0);

  if today_pts >= 50 then
    add_point := false;
  end if;

  select
    g.o_score,
    g.o_streak,
    g.o_freeze,
    g.o_had_reset
  into gap_score, gap_streak, gap_freeze, had_reset
  from public.gamification_apply_idle_gaps(last_before, score, streak, freeze_bal) g;

  old_streak := gap_streak;

  if add_point then
    insert into public.gamification_daily_scores (user_id, activity_date, points)
    values (new.user_id, today, 1)
    on conflict (user_id, activity_date) do update
      set points = public.gamification_daily_scores.points + excluded.points;

    gap_score := gap_score + 1;
  end if;

  if not add_point then
    update public.profiles
    set
      competition_score = gap_score,
      streak_days = gap_streak,
      freeze_balance = gap_freeze
    where id = new.user_id;
    return new;
  end if;

  -- Streak (only when a competition point was earned this insert)
  if last_before is null then
    new_streak := 1;
  elsif last_before = today then
    new_streak := old_streak;
  elsif last_before = today - 1 then
    new_streak := old_streak + 1;
  elsif had_reset then
    new_streak := 1;
  else
    -- missed one or more days; all covered by freezes
    new_streak := old_streak + 1;
  end if;

  if new_streak > old_streak and new_streak > 0 and new_streak % 7 = 0 and gap_freeze < 3 then
    gap_freeze := gap_freeze + 1;
  end if;

  update public.profiles
  set
    competition_score = gap_score,
    streak_days = new_streak,
    freeze_balance = gap_freeze,
    last_competition_activity_date = today
  where id = new.user_id;

  return new;
end;
$$;

drop trigger if exists gamification_practice_pass_trg on public.practice_task_passes;
create trigger gamification_practice_pass_trg
  after insert on public.practice_task_passes
  for each row
  execute procedure public.gamification_on_practice_task_pass();

-- ---------------------------------------------------------------------------
-- Reconcile idle gaps without awarding a new point (e.g. on login / profile)
-- ---------------------------------------------------------------------------
drop function if exists public.gamification_reconcile();

create or replace function public.gamification_reconcile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  last_before date;
  score int;
  streak int;
  freeze_bal int;
  opt_in boolean;
  blocked boolean;
  r text;
  had_reset boolean;
  gap_score int;
  gap_streak int;
  gap_freeze int;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select
    p.competition_score,
    p.streak_days,
    p.freeze_balance,
    p.last_competition_activity_date,
    p.competition_opt_in,
    p.is_blocked,
    p.role::text
  into score, streak, freeze_bal, last_before, opt_in, blocked, r
  from public.profiles p
  where p.id = uid
  for update;

  if not found then
    return;
  end if;

  if blocked or r is distinct from 'student' or not opt_in then
    return;
  end if;

  select
    g.o_score,
    g.o_streak,
    g.o_freeze,
    g.o_had_reset
  into gap_score, gap_streak, gap_freeze, had_reset
  from public.gamification_apply_idle_gaps(last_before, score, streak, freeze_bal) g;

  update public.profiles
  set
    competition_score = gap_score,
    streak_days = gap_streak,
    freeze_balance = gap_freeze
  where id = uid;
end;
$$;

revoke all on function public.gamification_reconcile() from public;
grant execute on function public.gamification_reconcile() to authenticated;

-- ---------------------------------------------------------------------------
-- Leaderboard: same class as caller, opted-in students only
-- ---------------------------------------------------------------------------
drop function if exists public.gamification_leaderboard(integer);

create or replace function public.gamification_leaderboard(p_limit integer default 100)
returns table (
  rank bigint,
  nickname text,
  competition_score int,
  streak_days int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  lim int := coalesce(nullif(p_limit, 0), 100);
  my_class uuid;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if lim < 1 then
    lim := 1;
  end if;
  if lim > 100 then
    lim := 100;
  end if;

  select p.class_id into my_class
  from public.profiles p
  where p.id = uid;

  if my_class is null then
    return;
  end if;

  return query
  select
    row_number() over (order by p.competition_score desc, p.leaderboard_nickname asc)::bigint,
    trim(p.leaderboard_nickname)::text,
    p.competition_score,
    p.streak_days
  from public.profiles p
  where
    p.class_id = my_class
    and p.competition_opt_in
    and p.role = 'student'
    and not p.is_blocked
    and p.leaderboard_nickname is not null
    and length(trim(p.leaderboard_nickname)) > 0
  order by p.competition_score desc, p.leaderboard_nickname asc
  limit lim;
end;
$$;

revoke all on function public.gamification_leaderboard(integer) from public;
grant execute on function public.gamification_leaderboard(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Own stats (after reconcile — caller should invoke reconcile first if needed)
-- ---------------------------------------------------------------------------
drop function if exists public.gamification_status();

create or replace function public.gamification_status()
returns table (
  competition_score int,
  streak_days int,
  freeze_balance int,
  last_competition_activity_date date,
  competition_opt_in boolean
)
language sql
security definer
set search_path = public
as $$
  select
    p.competition_score,
    p.streak_days,
    p.freeze_balance,
    p.last_competition_activity_date,
    p.competition_opt_in
  from public.profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.gamification_status() from public;
grant execute on function public.gamification_status() to authenticated;
