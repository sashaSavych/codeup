import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { marked } from 'marked';
import { from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';

import type { CodeTask } from '../../core/practice/code-task.model';
import { stripSuccessCriteriaFromDescription } from '../../core/practice/parse-success-criteria';
import { collectLocalPassedTaskIds, setPracticeTaskPassed } from '../../core/practice/practice-storage';
import { GamificationService } from '../../core/gamification/gamification.service';
import { PracticeProgressRemoteService } from '../../core/practice/practice-progress-remote.service';
import { PracticeTasksService } from '../../core/practice/practice-tasks.service';
import { TaskSubmissionsService } from '../../core/practice/task-submissions.service';
import { ProfileService } from '../../core/profile/profile.service';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { TopicsService } from '../../core/topics/topics.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { CodeEditorComponent } from '../../shared/code-editor/code-editor.component';

const AUTO_NEXT_KEY = 'cu_auto_next_task';

marked.setOptions({ gfm: true, breaks: true });

@Component({
  selector: 'cu-topic-practice',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    CheckboxModule,
    MessageModule,
    CodeEditorComponent,
    BreadcrumbComponent,
  ],
  templateUrl: './topic-practice.component.html',
  styleUrl: './topic-practice.component.scss',
})
export class TopicPracticeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly topicsService = inject(TopicsService);
  private readonly practiceTasks = inject(PracticeTasksService);
  private readonly practiceProgressRemote = inject(PracticeProgressRemoteService);
  private readonly gamification = inject(GamificationService);
  private readonly supabase = inject(SupabaseService);
  private readonly profileService = inject(ProfileService);
  private readonly taskSubmissions = inject(TaskSubmissionsService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly editorRef = viewChild(CodeEditorComponent);

  readonly topicSlug = toSignal(this.route.paramMap.pipe(map((p) => p.get('slug') ?? '')));

  readonly topicResult = toSignal(
    this.route.paramMap.pipe(
      map((p) => p.get('slug') ?? ''),
      switchMap((slug) => from(this.topicsService.getBySlug(slug))),
    ),
  );

  readonly queryTaskId = toSignal(this.route.queryParamMap.pipe(map((p) => p.get('taskId'))));

  readonly tasksForTopic = toSignal<CodeTask[] | null>(
    this.route.paramMap.pipe(
      map((p) => p.get('slug') ?? ''),
      switchMap((slug) =>
        slug ? from(this.practiceTasks.getTasksForTopic(slug)) : from(Promise.resolve([] as CodeTask[])),
      ),
    ),
    { initialValue: null },
  );

  readonly selectedTaskId = signal<string | null>(null);

  readonly selectedTask = computed(() => {
    const list = this.tasksForTopic();
    const id = this.selectedTaskId();
    if (list === null || !list.length) {
      return null;
    }
    if (!id) {
      return list[0];
    }
    return list.find((x) => x.id === id) ?? list[0];
  });

  readonly verifyState = signal<{ ok: boolean; text: string } | null>(null);
  readonly verifying = signal(false);
  readonly showNextTaskButton = signal(false);
  readonly topicCompleted = signal(false);

  readonly peerSharingEnabled = signal(false);
  readonly shareOptIn = signal(false);
  readonly peerCount = signal(0);

  readonly passedTaskIds = signal<ReadonlySet<string>>(new Set());

  readonly breadcrumbs = computed(() => {
    const t = this.topicResult();
    const title = t?.title ?? 'Практикум';
    return [
      { label: 'Головна', link: '/' },
      { label: 'Теми', link: '/topics' },
      { label: title },
    ];
  });

  constructor() {
    effect(() => {
      const list = this.tasksForTopic();
      const id = this.selectedTaskId();
      const qid = this.queryTaskId();
      if (list === null) {
        return;
      }
      if (!list.length) {
        this.selectedTaskId.set(null);
        return;
      }
      if (qid && list.some((x) => x.id === qid)) {
        this.selectedTaskId.set(qid);
        return;
      }
      if (!id || !list.some((x) => x.id === id)) {
        this.selectedTaskId.set(list[0].id);
      }
    });

    effect(() => {
      this.selectedTaskId();
      this.verifyState.set(null);
      this.showNextTaskButton.set(false);
      this.topicCompleted.set(false);
      void this.refreshPeerMeta();
    });

    effect(() => {
      const uid = this.supabase.user()?.id;
      const list = this.tasksForTopic();
      if (!uid || list === null) {
        this.passedTaskIds.set(new Set());
        return;
      }
      void this.refreshPassedTaskIds(uid);
    });
  }

  private async refreshPassedTaskIds(uid: string): Promise<void> {
    try {
      const remote = await this.practiceProgressRemote.listPassedTaskIdsForUser(uid);
      const merged = new Set<string>([...remote, ...collectLocalPassedTaskIds(uid)]);
      this.passedTaskIds.set(merged);
    } catch (e) {
      console.error(e);
      this.passedTaskIds.set(new Set(collectLocalPassedTaskIds(uid)));
    }
  }

  selectTask(task: CodeTask): void {
    this.selectedTaskId.set(task.id);
  }

  private async refreshPeerMeta(): Promise<void> {
    const task = this.selectedTask();
    const classId = this.profileService.cachedProfile()?.class_id;
    const enabled = await this.taskSubmissions.isPeerSharingEnabledForClass(classId);
    this.peerSharingEnabled.set(enabled);
    if (!task || !enabled) {
      this.peerCount.set(0);
      return;
    }
    const uid = this.supabase.user()?.id;
    if (uid) {
      this.shareOptIn.set(await this.taskSubmissions.getOwnShareOptIn(uid, task.id));
    }
    this.peerCount.set(await this.taskSubmissions.peerCount(task.id));
  }

  onShareOptInChange(checked: boolean): void {
    this.shareOptIn.set(checked);
  }

  taskDescriptionHtml(task: CodeTask): SafeHtml {
    const body = stripSuccessCriteriaFromDescription(task.description);
    const raw = marked.parse(body, { async: false }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  }

  isTaskPassed(taskId: string): boolean {
    return this.passedTaskIds().has(taskId);
  }

  getNextTask(afterTaskId: string): CodeTask | null {
    const list = this.tasksForTopic();
    if (!list?.length) {
      return null;
    }
    const idx = list.findIndex((t) => t.id === afterTaskId);
    if (idx < 0 || idx >= list.length - 1) {
      return null;
    }
    return list[idx + 1];
  }

  goToNextTask(): void {
    const current = this.selectedTask();
    if (!current) {
      return;
    }
    const next = this.getNextTask(current.id);
    if (next) {
      this.selectedTaskId.set(next.id);
      this.showNextTaskButton.set(false);
      this.verifyState.set(null);
      return;
    }
    const slug = this.topicSlug();
    if (slug) {
      void this.router.navigate(['/topics', slug]);
    }
  }

  private async markTaskPassed(taskId: string): Promise<void> {
    const uid = this.supabase.user()?.id;
    if (!uid) {
      return;
    }
    setPracticeTaskPassed(uid, taskId);
    this.passedTaskIds.update((s) => new Set([...s, taskId]));
    const { error } = await this.practiceProgressRemote.upsertPass(uid, taskId);
    if (error) {
      console.warn('practice_task_passes', error.message);
      return;
    }
    const rec = await this.gamification.reconcile();
    if (rec.error) {
      console.warn('gamification_reconcile', rec.error.message);
    }
  }

  private maybeAutoAdvance(taskId: string): void {
    const next = this.getNextTask(taskId);
    if (!next) {
      this.topicCompleted.set(true);
      this.showNextTaskButton.set(false);
      return;
    }
    this.showNextTaskButton.set(true);
    if (localStorage.getItem(AUTO_NEXT_KEY) === '1') {
      setTimeout(() => this.goToNextTask(), 1500);
    }
  }

  async runVerify(): Promise<void> {
    const task = this.selectedTask();
    const editor = this.editorRef();
    if (!task) {
      return;
    }
    if (!editor?.editorReady()) {
      this.verifyState.set({
        ok: false,
        text: 'Редактор ще завантажується. Зачекай секунду й натисни «Перевірити» знову.',
      });
      return;
    }
    const code = editor.getValue();
    this.verifying.set(true);
    this.verifyState.set(null);
    this.showNextTaskButton.set(false);
    this.topicCompleted.set(false);
    try {
      const result = await Promise.resolve(task.verify(code));
      editor.applyVerificationResult(result);
      if (result.ok) {
        await this.markTaskPassed(task.id);
        const uid = this.supabase.user()?.id;
        if (uid && this.peerSharingEnabled()) {
          const { error: subErr } = await this.taskSubmissions.upsertOnPass(uid, task.id, code, this.shareOptIn());
          if (subErr) {
            console.warn('task_submissions', subErr.message);
          }
          void this.refreshPeerMeta();
        }
        this.verifyState.set({ ok: true, text: 'Успішно! Завдання виконано.' });
        this.maybeAutoAdvance(task.id);
      } else {
        const text = result.message?.trim() ? result.message : 'Перевірка не пройдена.';
        this.verifyState.set({ ok: false, text });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Помилка перевірки.';
      editor.applyVerificationResult({
        ok: false,
        message: msg,
        markerLine: 1,
        markerColumn: 1,
      });
      this.verifyState.set({ ok: false, text: msg });
    } finally {
      this.verifying.set(false);
    }
  }
}
