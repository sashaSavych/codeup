import { Injectable } from '@angular/core';

import { SupabaseService } from '../supabase/supabase.service';

@Injectable({ providedIn: 'root' })
export class TaskSubmissionsService {
  constructor(private readonly supabase: SupabaseService) {}

  async upsertOnPass(userId: string, taskId: string, code: string, shareOptIn: boolean): Promise<{ error: Error | null }> {
    const { error } = await this.supabase.client.from('task_submissions').upsert(
      {
        user_id: userId,
        task_id: taskId,
        code_snapshot: code,
        share_opt_in: shareOptIn,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,task_id' },
    );
    return { error: error ? new Error(error.message) : null };
  }

  async getOwnShareOptIn(userId: string, taskId: string): Promise<boolean> {
    const { data, error } = await this.supabase.client
      .from('task_submissions')
      .select('share_opt_in')
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .maybeSingle();
    if (error || !data) {
      return false;
    }
    return data.share_opt_in === true;
  }

  async peerCount(taskId: string): Promise<number> {
    const { data, error } = await this.supabase.client.rpc('peer_solutions_count', {
      p_task_id: taskId,
    });
    if (error) {
      console.error(error);
      return 0;
    }
    return typeof data === 'number' ? data : 0;
  }

  async listPeerSolutions(taskId: string): Promise<string[]> {
    const { data, error } = await this.supabase.client.rpc('list_peer_solutions', {
      p_task_id: taskId,
    });
    if (error) {
      console.error(error);
      return [];
    }
    const rows = (data ?? []) as { code_snapshot: string }[];
    return rows.map((r) => r.code_snapshot);
  }

  async isPeerSharingEnabledForClass(classId: string | null | undefined): Promise<boolean> {
    if (!classId) {
      return false;
    }
    const { data, error } = await this.supabase.client
      .from('classes')
      .select('peer_solutions_enabled')
      .eq('id', classId)
      .maybeSingle();
    if (error || !data) {
      return false;
    }
    return data.peer_solutions_enabled === true;
  }
}
