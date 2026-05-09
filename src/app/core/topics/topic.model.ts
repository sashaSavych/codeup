/** Row from `public.topics` (list view — без повного тексту теорії). */
export interface TopicSummary {
  slug: string;
  sort_order: number;
  title: string;
  summary: string;
}

/** Повна тема з теорією в Markdown (рендер у HTML на клієнті). */
export interface TopicDetail extends TopicSummary {
  theory_md: string;
}
