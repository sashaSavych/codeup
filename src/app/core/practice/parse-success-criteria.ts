const CRITERIA_HEADING = /^##\s*Критерії\s+успіху\s*$/im;

/** Extract bullet items after a «Критерії успіху» markdown heading. */
export function parseSuccessCriteria(description: string): string[] {
  if (!description?.trim()) {
    return [];
  }
  const match = description.match(CRITERIA_HEADING);
  if (!match || match.index === undefined) {
    return [];
  }
  const after = description.slice(match.index + match[0].length);
  const lines = after.split('\n');
  const items: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (items.length > 0) {
        break;
      }
      continue;
    }
    if (/^##\s+/.test(trimmed)) {
      break;
    }
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      items.push(bullet[1].trim());
      continue;
    }
    if (items.length > 0) {
      break;
    }
  }
  return items;
}

/** Remove criteria section from description shown as task body (avoids duplicate with checklist UI). */
export function stripSuccessCriteriaFromDescription(description: string): string {
  const match = description.match(CRITERIA_HEADING);
  if (!match || match.index === undefined) {
    return description;
  }
  return description.slice(0, match.index).trimEnd();
}
