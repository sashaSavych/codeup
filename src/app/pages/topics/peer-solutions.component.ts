import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

import { TaskSubmissionsService } from '../../core/practice/task-submissions.service';
import { PracticeTasksService } from '../../core/practice/practice-tasks.service';
import { TopicsService } from '../../core/topics/topics.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';

@Component({
  selector: 'cu-peer-solutions',
  standalone: true,
  imports: [RouterLink, ButtonModule, CardModule, MessageModule, BreadcrumbComponent],
  templateUrl: './peer-solutions.component.html',
})
export class PeerSolutionsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly taskSubmissions = inject(TaskSubmissionsService);
  private readonly practiceTasks = inject(PracticeTasksService);
  private readonly topicsService = inject(TopicsService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly snapshots = signal<string[]>([]);
  readonly peerCount = signal(0);
  readonly taskTitle = signal('');
  readonly topicTitle = signal('');
  readonly slug = signal('');
  readonly taskId = signal('');

  readonly breadcrumbs = signal<{ label: string; link?: string | unknown[] }[]>([]);

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    const taskId = this.route.snapshot.queryParamMap.get('taskId') ?? '';
    this.slug.set(slug);
    this.taskId.set(taskId);

    if (!slug || !taskId) {
      this.error.set('Невірне посилання.');
      this.loading.set(false);
      return;
    }

    try {
      const [topic, tasks] = await Promise.all([
        this.topicsService.getBySlug(slug),
        this.practiceTasks.getTasksForTopic(slug),
      ]);
      const task = tasks.find((t) => t.id === taskId);
      this.taskTitle.set(task?.title ?? taskId);
      this.topicTitle.set(topic?.title ?? slug);
      this.breadcrumbs.set([
        { label: 'Головна', link: '/' },
        { label: 'Теми', link: '/topics' },
        { label: topic?.title ?? slug, link: ['/topics', slug, 'practice'] },
        { label: 'Приклади рішень' },
      ]);

      const count = await this.taskSubmissions.peerCount(taskId);
      this.peerCount.set(count);
      if (count < 3) {
        this.snapshots.set([]);
        this.loading.set(false);
        return;
      }
      this.snapshots.set(await this.taskSubmissions.listPeerSolutions(taskId));
    } catch (e) {
      console.error(e);
      this.error.set(e instanceof Error ? e.message : 'Не вдалося завантажити приклади.');
    } finally {
      this.loading.set(false);
    }
  }
}
