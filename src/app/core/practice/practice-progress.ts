import type { TopicSummary } from '../topics/topic.model';

import { isPracticeTaskPassed } from './practice-storage';

/** Minimal row from `practice_tasks` for progress UI. */
export interface PracticeTaskSummaryRow {
  id: string;
  topic_slug: string;
  sort_order: number;
  title: string;
}

export interface TopicPracticeProgress {
  topicSlug: string;
  topicTitle: string;
  topicSortOrder: number;
  completed: number;
  total: number;
  percent: number;
}

export interface OverallPracticeProgress {
  completed: number;
  total: number;
  percent: number;
  topics: TopicPracticeProgress[];
}

export function computeOverallPracticeProgress(
  userId: string,
  summaries: PracticeTaskSummaryRow[],
  topics: TopicSummary[],
): OverallPracticeProgress {
  const topicOrder = new Map(topics.map((t) => [t.slug, t.sort_order]));
  const topicTitle = new Map(topics.map((t) => [t.slug, t.title]));

  const bySlug = new Map<string, PracticeTaskSummaryRow[]>();
  for (const s of summaries) {
    const arr = bySlug.get(s.topic_slug) ?? [];
    arr.push(s);
    bySlug.set(s.topic_slug, arr);
  }

  const topicsProgress: TopicPracticeProgress[] = [];
  for (const [slug, taskList] of bySlug) {
    taskList.sort((a, b) => a.sort_order - b.sort_order);
    const total = taskList.length;
    const completed = taskList.filter((t) => isPracticeTaskPassed(userId, t.id)).length;
    topicsProgress.push({
      topicSlug: slug,
      topicTitle: topicTitle.get(slug) ?? slug,
      topicSortOrder: topicOrder.get(slug) ?? 9999,
      completed,
      total,
      percent: total ? Math.round((completed / total) * 100) : 0,
    });
  }
  topicsProgress.sort((a, b) => a.topicSortOrder - b.topicSortOrder);

  const totalAll = summaries.length;
  const completedAll = summaries.filter((t) => isPracticeTaskPassed(userId, t.id)).length;

  return {
    completed: completedAll,
    total: totalAll,
    percent: totalAll ? Math.round((completedAll / totalAll) * 100) : 0,
    topics: topicsProgress,
  };
}
