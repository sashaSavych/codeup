import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { GamificationService, type LeaderboardRow } from '../../core/gamification/gamification.service';
import { SupabaseService } from '../../core/supabase/supabase.service';

@Component({
  selector: 'cu-home',
  standalone: true,
  imports: [RouterLink, ButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly gamification = inject(GamificationService);

  readonly user = this.supabase.user;

  readonly top5 = signal<LeaderboardRow[]>([]);
  readonly top5Loading = signal(false);
  readonly top5Error = signal('');

  async ngOnInit(): Promise<void> {
    const id = this.supabase.user()?.id;
    if (!id) {
      return;
    }
    this.top5Loading.set(true);
    this.top5Error.set('');
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
    } else {
      this.top5.set(rows);
    }
    this.top5Loading.set(false);
  }
}
