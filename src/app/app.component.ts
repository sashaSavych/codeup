import { Component, computed, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import { ChatAiService } from './core/chat-ai/chat-ai.service';
import { ProfileService } from './core/profile/profile.service';
import { SupabaseService } from './core/supabase/supabase.service';
import { ChatAiComponent } from './shared/chat-ai/chat-ai.component';

@Component({
  selector: 'cu-root',
  imports: [RouterOutlet, RouterLink, ButtonModule, ChatAiComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly title = 'CodeUp';

  private readonly supabase = inject(SupabaseService);
  readonly profileService = inject(ProfileService);
  readonly chatAi = inject(ChatAiService);
  private readonly router = inject(Router);

  readonly user = this.supabase.user;

  readonly isAdmin = computed(() => this.profileService.cachedProfile()?.role === 'admin');

  /** Header auth actions only after profile load rules out `is_blocked`. */
  readonly showSignedInNav = computed(() => {
    if (!this.supabase.user()) {
      return false;
    }
    if (this.profileService.profileRefreshPending()) {
      return false;
    }
    return this.profileService.cachedProfile()?.is_blocked !== true;
  });

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
