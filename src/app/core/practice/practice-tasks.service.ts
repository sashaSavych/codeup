import { Injectable } from '@angular/core';

import type { CodeTask } from './code-task.model';
import { PRACTICE_TASKS } from './practice-tasks.data';

@Injectable({ providedIn: 'root' })
export class PracticeTasksService {
  getTasksForTopic(topicSlug: string): CodeTask[] {
    return PRACTICE_TASKS.filter((t) => t.topicSlug === topicSlug).sort((a, b) => a.order - b.order);
  }
}
