import { Injectable, signal } from '@angular/core';

import type { ProfileRole, UserProfile } from '../../models/user-profile.model';
import { SupabaseService } from '../supabase/supabase.service';

function mapProfileRow(data: Record<string, unknown> | null): UserProfile | null {
  if (!data) {
    return null;
  }
  const role = (data['role'] as ProfileRole | undefined) ?? 'student';
  const allowed: ProfileRole[] = ['student', 'teacher', 'admin'];
  return {
    id: data['id'] as string,
    first_name: (data['first_name'] as string | null) ?? null,
    last_name: (data['last_name'] as string | null) ?? null,
    gender: (data['gender'] as string | null) ?? null,
    class_name: (data['class_name'] as string | null) ?? null,
    class_id: (data['class_id'] as string | null) ?? null,
    role: allowed.includes(role) ? role : 'student',
    is_blocked: data['is_blocked'] === true,
    teacher_role_requested: data['teacher_role_requested'] === true,
    competition_opt_in: data['competition_opt_in'] === true,
    leaderboard_nickname: (data['leaderboard_nickname'] as string | null) ?? null,
    updated_at: (data['updated_at'] as string | null) ?? null,
  };
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  /** Cached row for header / quick UI; refreshed on login and after profile save. */
  private readonly cachedProfileSignal = signal<UserProfile | null>(null);
  readonly cachedProfile = this.cachedProfileSignal.asReadonly();

  /**
   * True while {@link refreshCachedProfile} is in flight (supports overlapping calls).
   * Shell hides auth buttons until we know {@link is_blocked} so blocked users do not briefly see logged-in UI.
   */
  private readonly profileRefreshPendingSignal = signal(false);
  readonly profileRefreshPending = this.profileRefreshPendingSignal.asReadonly();

  private profileRefreshDepth = 0;

  constructor(private readonly supabase: SupabaseService) {}

  clearCachedProfile(): void {
    this.cachedProfileSignal.set(null);
    this.profileRefreshDepth = 0;
    this.profileRefreshPendingSignal.set(false);
  }

  /** Loads profile from DB into {@link cachedProfile}. */
  async refreshCachedProfile(userId: string): Promise<void> {
    this.profileRefreshDepth += 1;
    this.profileRefreshPendingSignal.set(true);
    try {
      const profile = await this.getByUserId(userId);
      this.cachedProfileSignal.set(profile);
    } finally {
      this.profileRefreshDepth -= 1;
      if (this.profileRefreshDepth === 0) {
        this.profileRefreshPendingSignal.set(false);
      }
    }
  }

  async getByUserId(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error(error);
      return null;
    }

    return mapProfileRow(data as Record<string, unknown>);
  }

  async upsert(profile: Pick<UserProfile, 'id'> & Partial<Omit<UserProfile, 'id'>>): Promise<{ error: Error | null }> {
    const row: Record<string, unknown> = {
      id: profile.id,
      updated_at: new Date().toISOString(),
    };
    if (profile.first_name !== undefined) {
      row['first_name'] = profile.first_name ?? null;
    }
    if (profile.last_name !== undefined) {
      row['last_name'] = profile.last_name ?? null;
    }
    if (profile.gender !== undefined) {
      row['gender'] = profile.gender ?? null;
    }
    if (profile.class_name !== undefined) {
      row['class_name'] = profile.class_name ?? null;
    }
    if (profile.class_id !== undefined) {
      row['class_id'] = profile.class_id ?? null;
    }
    if (profile.teacher_role_requested !== undefined) {
      row['teacher_role_requested'] = profile.teacher_role_requested;
    }
    if (profile.competition_opt_in !== undefined) {
      row['competition_opt_in'] = profile.competition_opt_in;
    }
    if (profile.leaderboard_nickname !== undefined) {
      row['leaderboard_nickname'] = profile.leaderboard_nickname;
    }

    const { error } = await this.supabase.client.from('profiles').upsert(row, { onConflict: 'id' });

    return { error: error ? new Error(error.message) : null };
  }
}
