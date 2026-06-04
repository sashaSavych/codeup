import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';

import {
  computeOverallPracticeProgress,
  type OverallPracticeProgress,
  type TopicPracticeProgress,
} from '../../core/practice/practice-progress';
import { PracticeProgressRemoteService } from '../../core/practice/practice-progress-remote.service';
import { collectLocalPassedTaskIds } from '../../core/practice/practice-storage';
import { PracticeTasksService } from '../../core/practice/practice-tasks.service';
import { SupabaseService } from '../../core/supabase/supabase.service';
import type { TopicSummary } from '../../core/topics/topic.model';
import { TopicsService } from '../../core/topics/topics.service';
import { PROGRESS_LEGEND_TOOLTIP } from '../../shared/copy/progress-labels';

@Component({
  selector: 'cu-topics',
  standalone: true,
  imports: [RouterLink, ButtonModule, CardModule, MessageModule, TooltipModule],
  templateUrl: './topics.component.html',
  styleUrl: './topics.component.scss',
})
export class TopicsComponent {
  private readonly topicsService = inject(TopicsService);
  private readonly supabase = inject(SupabaseService);
  private readonly practiceTasks = inject(PracticeTasksService);
  private readonly practiceProgressRemote = inject(PracticeProgressRemoteService);

  readonly user = this.supabase.user;
  readonly progressLegendTooltip = PROGRESS_LEGEND_TOOLTIP;
  readonly topics = signal<TopicSummary[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  /** Merged remote + local passes; null if guest, not loaded yet, or load failed. */
  readonly practiceOverall = signal<OverallPracticeProgress | null>(null);
  readonly practiceLoading = signal(false);
  readonly practiceError = signal<string | null>(null);

  /** topic_slug → row for template lookups. */
  readonly practiceBySlug = computed(() => {
    const o = this.practiceOverall();
    const map: Record<string, TopicPracticeProgress> = {};
    if (o) {
      for (const row of o.topics) {
        map[row.topicSlug] = row;
      }
    }
    return map;
  });

  constructor() {
    void this.loadTopics();
    effect(() => {
      const uid = this.supabase.user()?.id;
      const topicRows = this.topics();
      if (topicRows.length === 0) {
        return;
      }
      if (uid) {
        void this.refreshPracticeProgress(uid, topicRows);
      } else {
        this.practiceOverall.set(null);
        this.practiceError.set(null);
      }
    });
  }

  private async loadTopics(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const rows = await this.topicsService.listSummaries();
      this.topics.set(rows);
    } catch (e) {
      this.errorMessage.set(e instanceof Error ? e.message : 'Не вдалося завантажити теми.');
    } finally {
      this.loading.set(false);
    }
  }

  private async refreshPracticeProgress(userId: string, topicRows: TopicSummary[]): Promise<void> {
    this.practiceLoading.set(true);
    this.practiceError.set(null);
    try {
      const summaries = await this.practiceTasks.listTaskSummaries();
      await this.practiceProgressRemote.syncLocalPassedToRemote(userId);
      const remote = await this.practiceProgressRemote.listPassedTaskIdsForUser(userId);
      const merged = new Set<string>([...remote, ...collectLocalPassedTaskIds(userId)]);
      this.practiceOverall.set(computeOverallPracticeProgress(merged, summaries, topicRows));
    } catch (e) {
      console.error(e);
      this.practiceOverall.set(null);
      this.practiceError.set(
        e instanceof Error ? e.message : 'Не вдалося завантажити прогрес вправ. Спробуйте оновити сторінку.',
      );
    } finally {
      this.practiceLoading.set(false);
    }
  }
}
