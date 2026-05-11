import { Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

import { computeOverallPracticeProgress, type OverallPracticeProgress } from '../../core/practice/practice-progress';
import { PracticeProgressRemoteService } from '../../core/practice/practice-progress-remote.service';
import { PracticeTasksService } from '../../core/practice/practice-tasks.service';
import { TeacherPupilsService } from '../../core/teacher/teacher-pupils.service';
import { TopicsService } from '../../core/topics/topics.service';
import type { TeacherPupilProgressRow } from '../../models/teacher-pupil-progress-row.model';

@Component({
  selector: 'cu-teacher-pupils-panel',
  standalone: true,
  imports: [ButtonModule, CardModule, MessageModule],
  templateUrl: './teacher-pupils-panel.component.html',
  styleUrl: './teacher-pupils-panel.component.scss',
})
export class TeacherPupilsPanelComponent implements OnInit {
  private readonly teacherPupils = inject(TeacherPupilsService);
  private readonly practiceTasks = inject(PracticeTasksService);
  private readonly topicsService = inject(TopicsService);
  private readonly practiceRemote = inject(PracticeProgressRemoteService);

  readonly rows = signal<TeacherPupilProgressRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly expandedId = signal<string | null>(null);
  readonly expandedProgress = signal<OverallPracticeProgress | null>(null);
  readonly expandedLoading = signal(false);

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.rows.set(await this.teacherPupils.listPupilsWithProgress());
    } catch (e) {
      console.error(e);
      this.error.set(e instanceof Error ? e.message : 'Не вдалося завантажити список учнів.');
      this.rows.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  displayName(row: TeacherPupilProgressRow): string {
    const fn = row.first_name?.trim() ?? '';
    const ln = row.last_name?.trim() ?? '';
    const n = `${fn} ${ln}`.trim();
    return n || '—';
  }

  percent(row: TeacherPupilProgressRow): number {
    const t = row.total_tasks;
    return t ? Math.round((row.completed / t) * 100) : 0;
  }

  async toggleExpand(row: TeacherPupilProgressRow): Promise<void> {
    if (this.expandedId() === row.pupil_id) {
      this.expandedId.set(null);
      this.expandedProgress.set(null);
      return;
    }
    this.expandedId.set(row.pupil_id);
    this.expandedProgress.set(null);
    this.expandedLoading.set(true);
    try {
      const [summaries, topics, ids] = await Promise.all([
        this.practiceTasks.listTaskSummaries(),
        this.topicsService.listSummaries(),
        this.practiceRemote.listPassedTaskIdsForUser(row.pupil_id),
      ]);
      this.expandedProgress.set(computeOverallPracticeProgress(new Set(ids), summaries, topics));
    } catch (e) {
      console.error(e);
      this.expandedProgress.set(null);
    } finally {
      this.expandedLoading.set(false);
    }
  }
}
