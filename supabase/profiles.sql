-- Run in Supabase Dashboard → SQL Editor (once per project).
-- Script order: see supabase/README.md (this file is step 1).
-- Stores learner profile fields linked to auth.users.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  gender text,
  class_name text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);
