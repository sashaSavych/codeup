-- Workload report for content editors (run in Supabase SQL Editor).
-- Requires: topics, practice_tasks, practice_task_passes, profiles.

-- Tasks per topic (catalog)
select
  t.slug,
  t.sort_order,
  t.title,
  count(pt.id)::int as task_count
from public.topics t
left join public.practice_tasks pt on pt.topic_slug = t.slug
group by t.slug, t.sort_order, t.title
order by t.sort_order;

-- Passes per topic (all users)
select
  t.slug,
  t.title,
  count(distinct p.user_id)::int as users_with_any_pass,
  count(*)::int as total_pass_events,
  count(distinct pt.id)::int as tasks_in_topic
from public.topics t
join public.practice_tasks pt on pt.topic_slug = t.slug
left join public.practice_task_passes p on p.task_id = pt.id
group by t.slug, t.title, t.sort_order
order by t.sort_order;

-- Per-topic completion rate among students who started the topic
with student_passes as (
  select
    pr.class_id,
    pt.topic_slug,
    p.user_id,
    count(*)::int as passed_in_topic
  from public.practice_task_passes p
  join public.practice_tasks pt on pt.id = p.task_id
  join public.profiles pr on pr.id = p.user_id
  where pr.role = 'student'
  group by pr.class_id, pt.topic_slug, p.user_id
),
topic_totals as (
  select topic_slug, count(*)::int as tasks_in_topic
  from public.practice_tasks
  group by topic_slug
)
select
  sp.topic_slug,
  sp.class_id,
  count(*)::int as students_with_progress,
  round(avg(100.0 * sp.passed_in_topic / nullif(tt.tasks_in_topic, 0)), 1) as avg_topic_percent
from student_passes sp
join topic_totals tt on tt.topic_slug = sp.topic_slug
group by sp.topic_slug, sp.class_id
order by sp.topic_slug, sp.class_id;
