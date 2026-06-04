import type { TopicSummary } from './topic.model';
import type { ClassTopicOrderRow } from './class-topic-order.service';

/** Apply class-specific sort_order; topics without override keep global order at the end. */
export function mergeTopicsWithClassOrder(
  globalTopics: TopicSummary[],
  overrides: ClassTopicOrderRow[],
): TopicSummary[] {
  if (!overrides.length) {
    return [...globalTopics].sort((a, b) => a.sort_order - b.sort_order);
  }

  const overrideMap = new Map(overrides.map((o) => [o.topic_slug, o.sort_order]));
  const overridden = globalTopics
    .filter((t) => overrideMap.has(t.slug))
    .map((t) => ({ ...t, sort_order: overrideMap.get(t.slug)! }))
    .sort((a, b) => a.sort_order - b.sort_order);

  const maxOverride = Math.max(...overrides.map((o) => o.sort_order), 0);
  const rest = globalTopics
    .filter((t) => !overrideMap.has(t.slug))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((t, i) => ({ ...t, sort_order: maxOverride + 1 + i }));

  return [...overridden, ...rest];
}
