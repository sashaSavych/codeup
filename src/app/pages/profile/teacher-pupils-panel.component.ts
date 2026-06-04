import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

import { ClassesService } from '../../core/classes/classes.service';
import { computeOverallPracticeProgress, type OverallPracticeProgress } from '../../core/practice/practice-progress';
import { PracticeProgressRemoteService } from '../../core/practice/practice-progress-remote.service';
import { PracticeTasksService } from '../../core/practice/practice-tasks.service';
import { ClassTopicOrderService } from '../../core/topics/class-topic-order.service';
import { mergeTopicsWithClassOrder } from '../../core/topics/merge-topic-order';
import { TopicsService } from '../../core/topics/topics.service';
import { TeacherPupilsService } from '../../core/teacher/teacher-pupils.service';
import type { SchoolClass } from '../../models/school-class.model';
import type { TeacherPupilProgressRow } from '../../models/teacher-pupil-progress-row.model';
import type { TopicSummary } from '../../core/topics/topic.model';

@Component({
  selector: 'cu-teacher-pupils-panel',
  standalone: true,
  imports: [FormsModule, DragDropModule, ButtonModule, CardModule, MessageModule],
  templateUrl: './teacher-pupils-panel.component.html',
  styleUrl: './teacher-pupils-panel.component.scss',
})
export class TeacherPupilsPanelComponent implements OnInit {
  private readonly teacherPupils = inject(TeacherPupilsService);
  private readonly practiceTasks = inject(PracticeTasksService);
  private readonly topicsService = inject(TopicsService);
  private readonly practiceRemote = inject(PracticeProgressRemoteService);
  private readonly classesService = inject(ClassesService);
  private readonly classTopicOrder = inject(ClassTopicOrderService);

  readonly rows = signal<TeacherPupilProgressRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly expandedId = signal<string | null>(null);
  readonly expandedProgress = signal<OverallPracticeProgress | null>(null);
  readonly expandedLoading = signal(false);

  readonly classes = signal<SchoolClass[]>([]);
  readonly orderClassId = signal('');
  readonly topicOrderList = signal<TopicSummary[]>([]);
  readonly orderLoading = signal(false);
  readonly orderSaving = signal(false);
  readonly orderMessage = signal('');
  readonly orderError = signal('');

  async ngOnInit(): Promise<void> {
    this.classes.set(await this.classesService.list());
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

  async onOrderClassChange(classId: string): Promise<void> {
    this.orderClassId.set(classId);
    this.orderMessage.set('');
    this.orderError.set('');
    if (!classId) {
      this.topicOrderList.set([]);
      return;
    }
    this.orderLoading.set(true);
    try {
      const global = await this.topicsService.listSummaries();
      const overrides = await this.classTopicOrder.listForClass(classId);
      this.topicOrderList.set(mergeTopicsWithClassOrder(global, overrides));
    } catch (e) {
      console.error(e);
      this.orderError.set(e instanceof Error ? e.message : 'Не вдалося завантажити теми.');
      this.topicOrderList.set([]);
    } finally {
      this.orderLoading.set(false);
    }
  }

  dropTopic(event: CdkDragDrop<TopicSummary[]>): void {
    const list = [...this.topicOrderList()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.topicOrderList.set(list);
  }

  async saveTopicOrder(): Promise<void> {
    const classId = this.orderClassId();
    if (!classId) {
      return;
    }
    this.orderSaving.set(true);
    this.orderMessage.set('');
    this.orderError.set('');
    const slugs = this.topicOrderList().map((t) => t.slug);
    const { error } = await this.classTopicOrder.saveOrder(classId, slugs);
    this.orderSaving.set(false);
    if (error) {
      this.orderError.set(error.message);
      return;
    }
    this.orderMessage.set('Порядок тем для класу збережено.');
  }
}
