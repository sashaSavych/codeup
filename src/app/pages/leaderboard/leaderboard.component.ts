import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

import { GamificationService, type LeaderboardRow } from '../../core/gamification/gamification.service';
import { ProfileService } from '../../core/profile/profile.service';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { GamificationRulesPanelComponent } from '../../shared/gamification-rules-panel/gamification-rules-panel.component';

@Component({
  selector: 'cu-leaderboard',
  standalone: true,
  imports: [RouterLink, ButtonModule, CardModule, MessageModule, BreadcrumbComponent, GamificationRulesPanelComponent],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss',
})
export class LeaderboardComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly gamification = inject(GamificationService);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);

  readonly breadcrumbs = [
    { label: 'Головна', link: '/' },
    { label: 'Рейтинг' },
  ];

  readonly rows = signal<LeaderboardRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly user = this.supabase.user;

  async ngOnInit(): Promise<void> {
    const id = this.supabase.user()?.id;
    if (!id) {
      await this.router.navigateByUrl('/login');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const rec = await this.gamification.reconcile();
    if (rec.error) {
      this.error.set(rec.error.message);
      this.loading.set(false);
      return;
    }
    const { rows, error } = await this.gamification.leaderboard(100);
    if (error) {
      this.error.set(error.message);
      this.rows.set([]);
    } else {
      this.rows.set(rows);
    }
    this.loading.set(false);
  }

  isMyRow(row: LeaderboardRow): boolean {
    const nick = this.profileService.cachedProfile()?.leaderboard_nickname?.trim() ?? '';
    return !!nick && row.nickname === nick;
  }
}
