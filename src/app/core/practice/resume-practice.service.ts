import { Injectable } from '@angular/core';

import { TopicsService } from '../topics/topics.service';
import { PracticeProgressRemoteService } from './practice-progress-remote.service';
import { collectLocalPassedTaskIds } from './practice-storage';
import { PracticeTasksService } from './practice-tasks.service';

export interface PracticeResume {
  topicSlug: string;
  topicTitle: string;
  taskId: string;
  taskTitle: string;
}

@Injectable({ providedIn: 'root' })
export class ResumePracticeService {
  constructor(
    private readonly practiceTasks: PracticeTasksService,
    private readonly topicsService: TopicsService,
    private readonly practiceProgressRemote: PracticeProgressRemoteService,
  ) {}

  /** First incomplete task in global topic order. */
  async getResume(userId: string): Promise<PracticeResume | null> {
    const [summaries, topics] = await Promise.all([
      this.practiceTasks.listTaskSummaries(),
      this.topicsService.listSummaries(),
    ]);
    if (!summaries.length || !topics.length) {
      return null;
    }

    await this.practiceProgressRemote.syncLocalPassedToRemote(userId);
    const remote = await this.practiceProgressRemote.listPassedTaskIdsForUser(userId);
    const passed = new Set<string>([...remote, ...collectLocalPassedTaskIds(userId)]);

    const topicOrder = new Map(topics.map((t) => [t.slug, t.sort_order]));
    const topicTitle = new Map(topics.map((t) => [t.slug, t.title]));

    const ordered = [...summaries].sort((a, b) => {
      const ta = topicOrder.get(a.topic_slug) ?? 0;
      const tb = topicOrder.get(b.topic_slug) ?? 0;
      if (ta !== tb) {
        return ta - tb;
      }
      return a.sort_order - b.sort_order;
    });

    const next = ordered.find((s) => !passed.has(s.id));
    if (!next) {
      return null;
    }

    return {
      topicSlug: next.topic_slug,
      topicTitle: topicTitle.get(next.topic_slug) ?? next.topic_slug,
      taskId: next.id,
      taskTitle: next.title,
    };
  }
}
