import { Component, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import { ProfileService } from './core/profile/profile.service';
import { SupabaseService } from './core/supabase/supabase.service';

@Component({
  selector: 'cu-root',
  imports: [RouterOutlet, RouterLink, ButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly title = 'CodeUp';

  private readonly supabase = inject(SupabaseService);
  readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);

  readonly user = this.supabase.user;

  constructor() {
    effect(() => {
      const u = this.supabase.user();
      if (!u) {
        this.profileService.clearCachedProfile();
        return;
      }
      void this.profileService.refreshCachedProfile(u.id);
    });
  }

  async logout(): Promise<void> {
    await this.supabase.signOut();
    this.profileService.clearCachedProfile();
    await this.router.navigateByUrl('/');
  }
}
