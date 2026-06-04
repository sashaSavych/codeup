import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import {
  computeOverallPracticeProgress,
  type OverallPracticeProgress,
} from '../../core/practice/practice-progress';
import { PracticeProgressRemoteService } from '../../core/practice/practice-progress-remote.service';
import { collectLocalPassedTaskIds } from '../../core/practice/practice-storage';
import { PracticeTasksService } from '../../core/practice/practice-tasks.service';
import { ProfileService } from '../../core/profile/profile.service';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { TopicsService } from '../../core/topics/topics.service';

@Component({
  selector: 'cu-certificate',
  standalone: true,
  imports: [RouterLink, ButtonModule, CardModule],
  templateUrl: './certificate.component.html',
  styleUrl: './certificate.component.scss',
})
export class CertificateComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService);
  private readonly profileService = inject(ProfileService);
  private readonly practiceTasks = inject(PracticeTasksService);
  private readonly topicsService = inject(TopicsService);
  private readonly practiceProgressRemote = inject(PracticeProgressRemoteService);

  readonly loading = signal(true);
  readonly displayName = signal('');
  readonly completionDate = signal('');
  readonly progress = signal<OverallPracticeProgress | null>(null);

  async ngOnInit(): Promise<void> {
    const id = this.supabase.user()?.id;
    if (!id) {
      await this.router.navigateByUrl('/login');
      return;
    }

    await this.profileService.refreshCachedProfile(id);
    const profile = this.profileService.cachedProfile();
    const fn = profile?.first_name?.trim() ?? '';
    const ln = profile?.last_name?.trim() ?? '';
    const name = `${fn} ${ln}`.trim() || 'Учень CodeUp';
    this.displayName.set(name);

    try {
      const classId = profile?.class_id ?? null;
      const [summaries, topics] = await Promise.all([
        this.practiceTasks.listTaskSummaries(),
        this.topicsService.listSummariesForUser(classId),
      ]);
      await this.practiceProgressRemote.syncLocalPassedToRemote(id);
      const remote = await this.practiceProgressRemote.listPassedTaskIdsForUser(id);
      const merged = new Set<string>([...remote, ...collectLocalPassedTaskIds(id)]);
      const prog = computeOverallPracticeProgress(merged, summaries, topics);
      this.progress.set(prog);

      if (prog.percent !== 100 || prog.total === 0) {
        await this.router.navigate(['/profile'], { queryParams: { tab: 'progress' } });
        return;
      }

      this.completionDate.set(
        new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }),
      );
    } catch (e) {
      console.error(e);
      await this.router.navigate(['/profile'], { queryParams: { tab: 'progress' } });
      return;
    } finally {
      this.loading.set(false);
    }
  }

  print(): void {
    window.print();
  }
}
