export const PROGRESS_LEGEND_TITLE = 'Пояснення статусів прогресу';

/** Tooltip body (plain text with newlines for PrimeNG tooltip). */
export const PROGRESS_LEGEND_TOOLTIP = [
  'Виконано — вправа успішно перевірена (галочка в списку вправ або 100% теми).',
  'У процесі — тема розпочата, залишились невиконані вправи.',
  'Не розпочато — 0% практикуму по темі.',
].join('\n');

export const PROGRESS_STATUS_LABELS = {
  passed: 'Виконано',
  inProgress: 'У процесі',
  notStarted: 'Не розпочато',
} as const;
