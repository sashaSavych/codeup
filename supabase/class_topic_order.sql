-- Per-class topic order overrides. Run after admin.sql (needs classes + topics).
-- Script order: see supabase/README.md

create table if not exists public.class_topic_order (
  class_id uuid not null references public.classes (id) on delete cascade,
  topic_slug text not null references public.topics (slug) on delete cascade,
  sort_order int not null,
  primary key (class_id, topic_slug),
  unique (class_id, sort_order)
);

create index if not exists class_topic_order_class_idx on public.class_topic_order (class_id, sort_order);

alter table public.class_topic_order enable row level security;

drop policy if exists "class_topic_order_select_authenticated" on public.class_topic_order;
create policy "class_topic_order_select_authenticated"
  on public.class_topic_order
  for select
  to authenticated
  using (true);

drop policy if exists "class_topic_order_write_teacher_admin" on public.class_topic_order;
create policy "class_topic_order_write_teacher_admin"
  on public.class_topic_order
  for all
  to authenticated
  using (public.is_current_user_admin() or public.is_current_user_teacher())
  with check (public.is_current_user_admin() or public.is_current_user_teacher());

grant select, insert, update, delete on table public.class_topic_order to authenticated;

-- Bulk replace order for one class (delete missing slugs from override set).
create or replace function public.upsert_class_topic_order(p_class_id uuid, p_slugs text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_current_user_admin() or public.is_current_user_teacher()) then
    raise exception 'not allowed';
  end if;
  if p_class_id is null then
    raise exception 'class_id required';
  end if;

  delete from public.class_topic_order where class_id = p_class_id;

  if p_slugs is null or array_length(p_slugs, 1) is null then
    return;
  end if;

  insert into public.class_topic_order (class_id, topic_slug, sort_order)
  select p_class_id, s.slug, s.ord::int
  from unnest(p_slugs) with ordinality as s(slug, ord);
end;
$$;

revoke all on function public.upsert_class_topic_order(uuid, text[]) from public;
grant execute on function public.upsert_class_topic_order(uuid, text[]) to authenticated;
