import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import { SupabaseService } from '../../core/supabase/supabase.service';

@Component({
  selector: 'cu-home',
  standalone: true,
  imports: [RouterLink, ButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly supabase = inject(SupabaseService);

  readonly user = this.supabase.user;
}
