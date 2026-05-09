import { computed, Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient;

  private readonly sessionSignal = signal<Session | null>(null);
  readonly session = this.sessionSignal.asReadonly();
  readonly user = computed(() => this.sessionSignal()?.user ?? null);

  constructor() {
    this.client = createClient(environment.supabaseUrl, environment.supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    void this.hydrateSession();
    this.client.auth.onAuthStateChange((_event, session) => {
      this.sessionSignal.set(session);
    });
  }

  private async hydrateSession(): Promise<void> {
    const { data } = await this.client.auth.getSession();
    this.sessionSignal.set(data.session);
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  /**
   * Same return shape as Supabase Auth — check `data.session` after signup (may be null if email confirmation is on).
   */
  signUp(email: string, password: string) {
    return this.client.auth.signUp({ email, password });
  }

  signInWithPassword(email: string, password: string) {
    return this.client.auth.signInWithPassword({ email, password });
  }
}
