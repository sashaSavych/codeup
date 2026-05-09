import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';

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
  private readonly router = inject(Router);

  readonly user = this.supabase.user;

  async logout(): Promise<void> {
    await this.supabase.signOut();
    await this.router.navigateByUrl('/');
  }
}
