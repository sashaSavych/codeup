import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { environment } from '../../../environments/environment';
import {
  canShowMyRank,
  findMyRank,
  leaderboardEmptyHint,
} from '../../core/gamification/leaderboard-helpers';
import { OnboardingService } from '../../core/onboarding/onboarding.service';
import { ResumePracticeService, type PracticeResume } from '../../core/practice/resume-practice.service';
import { GamificationService, type LeaderboardRow } from '../../core/gamification/gamification.service';
import { ProfileService } from '../../core/profile/profile.service';
import { SupabaseService } from '../../core/supabase/supabase.service';

@Component({
  selector: 'cu-home',
  standalone: true,
  imports: [RouterLink, ButtonModule, MessageModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly gamification = inject(GamificationService);
  private readonly resumePractice = inject(ResumePracticeService);
  private readonly onboarding = inject(OnboardingService);
  private readonly profileService = inject(ProfileService);
  private readonly route = inject(ActivatedRoute);

  readonly user = this.supabase.user;
  readonly showLeaderboardPreview = environment.showLeaderboardPreview;

  readonly top5 = signal<LeaderboardRow[]>([]);
  readonly top5Loading = signal(false);
  readonly top5Error = signal('');

  /** Rank when user is outside visible top-5 list. */
  readonly myRankOutsideTop5 = signal<number | null>(null);

  readonly flashMessage = signal('');
  readonly flashSeverity = signal<'success' | 'info'>('info');

  readonly resume = signal<PracticeResume | null>(null);
  readonly resumeLoading = signal(false);

  readonly myNickname = () => this.profileService.cachedProfile()?.leaderboard_nickname?.trim() ?? '';

  readonly top5EmptyHint = computed(() =>
    leaderboardEmptyHint(this.profileService.cachedProfile()),
  );

  readonly myRankInTop5 = computed(() => {
    const nick = this.myNickname();
    if (!nick) {
      return null;
    }
    return findMyRank(this.top5(), nick);
  });

  readonly showMyRankBanner = computed(() => {
    const profile = this.profileService.cachedProfile();
    if (!canShowMyRank(profile)) {
      return false;
    }
    return this.myRankInTop5() !== null || this.myRankOutsideTop5() !== null;
  });

  readonly displayedMyRank = computed(() => this.myRankInTop5() ?? this.myRankOutsideTop5());

  async ngOnInit(): Promise<void> {
    const welcome = this.route.snapshot.queryParamMap.get('welcome') === '1';
    const saved = this.route.snapshot.queryParamMap.get('saved') === '1';
    if (welcome) {
      this.flashMessage.set('Ласкаво просимо в CodeUp! Обери тему або продовж навчання нижче.');
      this.flashSeverity.set('info');
    } else if (saved) {
      this.flashMessage.set('Профіль збережено. Можеш продовжити навчання.');
      this.flashSeverity.set('success');
    }

    const id = this.supabase.user()?.id;
    if (!id) {
      return;
    }

    this.resumeLoading.set(true);
    try {
      const r = await this.resumePractice.getResume(id);
      this.resume.set(r);
    } catch (e) {
      console.error(e);
      this.resume.set(null);
    } finally {
      this.resumeLoading.set(false);
    }

    if (this.showLeaderboardPreview) {
      await this.loadTop5();
    }

    setTimeout(() => this.onboarding.startTour(), 400);
  }

  private async loadTop5(): Promise<void> {
    this.top5Loading.set(true);
    this.top5Error.set('');
    this.myRankOutsideTop5.set(null);
    const rec = await this.gamification.reconcile();
    if (rec.error) {
      this.top5Error.set(rec.error.message);
      this.top5Loading.set(false);
      return;
    }
    const { rows, error } = await this.gamification.leaderboard(5);
    if (error) {
      this.top5Error.set(error.message);
      this.top5.set([]);
      this.top5Loading.set(false);
      return;
    }
    this.top5.set(rows);

    const nick = this.myNickname();
    if (canShowMyRank(this.profileService.cachedProfile()) && nick && !findMyRank(rows, nick)) {
      const full = await this.gamification.leaderboard(100);
      if (!full.error) {
        this.myRankOutsideTop5.set(findMyRank(full.rows, nick));
      }
    }

    this.top5Loading.set(false);
  }

  isMyRow(row: LeaderboardRow): boolean {
    const nick = this.myNickname();
    return !!nick && row.nickname === nick;
  }
}
