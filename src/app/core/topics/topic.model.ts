/** Row from `public.topics` (list view omits full theory body). */
export interface TopicSummary {
  slug: string;
  sort_order: number;
  title: string;
  summary: string;
}

/** Full topic including Markdown theory (rendered to HTML on the client). */
export interface TopicDetail extends TopicSummary {
  theory_md: string;
}
