import { computed, Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';

/**
 * Skip Navigator LockManager (cross-tab locks). Uses in-process execution only.
 * Avoids NavigatorLockAcquireTimeoutError with Zone.js / concurrent guards / HMR;
 * two tabs can race on refresh — fine for a typical single-tab learning app.
 */
async function authLockInProcess<R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>,
): Promise<R> {
  return fn();
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient;

  private readonly sessionSignal = signal<Session | null>(null);
  readonly session = this.sessionSignal.asReadonly();
  readonly user = computed(() => this.sessionSignal()?.user ?? null);

  /**
   * Resolves after the first auth callback (includes INITIAL_SESSION).
   * Use in route guards instead of `getSession()` to avoid extra lock contention.
   */
  readonly initialSessionPromise: Promise<void>;

  private resolveInitialSession!: () => void;

  constructor() {
    this.initialSessionPromise = new Promise<void>((resolve) => {
      this.resolveInitialSession = resolve;
    });

    const url = environment.supabaseUrl?.trim() ?? '';
    const key = environment.supabasePublishableKey?.trim() ?? '';
    if (!url || !key) {
      console.warn(
        '[CodeUp] Supabase URL or publishable key is missing. Auth and API calls are disabled until environment is configured.',
      );
    }

    // createClient throws on empty url/key — use placeholders so the app still boots (e.g. GitHub Pages if CI env failed).
    const safeUrl = url || 'https://placeholder.invalid';
    const safeKey = key || 'sb_publishable_not_configured';

    this.client = createClient(safeUrl, safeKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        lock: authLockInProcess,
        lockAcquireTimeout: 20000,
      },
    });

    let initialEmitted = false;
    this.client.auth.onAuthStateChange((_event, session) => {
      this.sessionSignal.set(session);
      if (!initialEmitted) {
        initialEmitted = true;
        this.resolveInitialSession();
      }
    });
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
