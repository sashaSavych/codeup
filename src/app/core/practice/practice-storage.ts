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
