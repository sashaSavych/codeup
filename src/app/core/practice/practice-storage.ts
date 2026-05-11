/** Sync with topic practice completion (`topic-practice.component`). */
export function practicePassStorageKey(userId: string, taskId: string): string {
  return `codeup_practice_${userId}_${taskId}`;
}

export function isPracticeTaskPassed(userId: string, taskId: string): boolean {
  return globalThis.localStorage?.getItem(practicePassStorageKey(userId, taskId)) === '1';
}

export function setPracticeTaskPassed(userId: string, taskId: string): void {
  globalThis.localStorage?.setItem(practicePassStorageKey(userId, taskId), '1');
}

/** Task ids marked passed locally for this user (browser storage). */
export function collectLocalPassedTaskIds(userId: string): string[] {
  const prefix = `codeup_practice_${userId}_`;
  const ids: string[] = [];
  const ls = globalThis.localStorage;
  if (!ls) {
    return ids;
  }
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i);
    if (!k?.startsWith(prefix)) {
      continue;
    }
    if (ls.getItem(k) === '1') {
      ids.push(k.slice(prefix.length));
    }
  }
  return ids;
}
