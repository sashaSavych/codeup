import { Injectable } from '@angular/core';

import { SupabaseService } from '../supabase/supabase.service';

export interface LeaderboardRow {
  rank: number;
  nickname: string;
  competition_score: number;
  streak_days: number;
}

export interface GamificationStatus {
  competition_score: number;
  streak_days: number;
  freeze_balance: number;
  last_competition_activity_date: string | null;
  competition_opt_in: boolean;
}

@Injectable({ providedIn: 'root' })
export class GamificationService {
  constructor(private readonly supabase: SupabaseService) {}

  async reconcile(): Promise<{ error: Error | null }> {
    const { error } = await this.supabase.client.rpc('gamification_reconcile');
    return { error: error ? new Error(error.message) : null };
  }

  async leaderboard(limit: number): Promise<{ rows: LeaderboardRow[]; error: Error | null }> {
    const lim = Math.min(100, Math.max(1, Math.floor(limit)));
    const { data, error } = await this.supabase.client.rpc('gamification_leaderboard', { p_limit: lim });
    if (error) {
      return { rows: [], error: new Error(error.message) };
    }
    const raw = (data ?? []) as Record<string, unknown>[];
    const rows: LeaderboardRow[] = raw.map((r) => ({
      rank: Number(r['rank']),
      nickname: String(r['nickname'] ?? ''),
      competition_score: Number(r['competition_score'] ?? 0),
      streak_days: Number(r['streak_days'] ?? 0),
    }));
    return { rows, error: null };
  }

  async status(): Promise<{ status: GamificationStatus | null; error: Error | null }> {
    const { data, error } = await this.supabase.client.rpc('gamification_status');
    if (error) {
      return { status: null, error: new Error(error.message) };
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row !== 'object') {
      return { status: null, error: null };
    }
    const o = row as Record<string, unknown>;
    return {
      status: {
        competition_score: Number(o['competition_score'] ?? 0),
        streak_days: Number(o['streak_days'] ?? 0),
        freeze_balance: Number(o['freeze_balance'] ?? 0),
        last_competition_activity_date: (o['last_competition_activity_date'] as string | null) ?? null,
        competition_opt_in: o['competition_opt_in'] === true,
      },
      error: null,
    };
  }
}
