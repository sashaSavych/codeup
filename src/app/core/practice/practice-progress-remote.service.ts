import { Injectable } from '@angular/core';

import { SupabaseService } from '../supabase/supabase.service';

import { collectLocalPassedTaskIds } from './practice-storage';

@Injectable({ providedIn: 'root' })
export class PracticeProgressRemoteService {
  constructor(private readonly supabase: SupabaseService) {}

  async listPassedTaskIdsForUser(userId: string): Promise<string[]> {
    const { data, error } = await this.supabase.client
      .from('practice_task_passes')
      .select('task_id')
      .eq('user_id', userId);

    if (error) {
      console.error(error);
      return [];
    }
    return (data ?? []).map((r: { task_id: string }) => r.task_id);
  }

  async upsertPass(userId: string, taskId: string): Promise<{ error: Error | null }> {
    const { error } = await this.supabase.client.from('practice_task_passes').upsert(
      { user_id: userId, task_id: taskId, passed_at: new Date().toISOString() },
      { onConflict: 'user_id,task_id' },
    );
    return { error: error ? new Error(error.message) : null };
  }

  /** Copies locally stored passes to the server so teachers see them after the учень logs in once. */
  async syncLocalPassedToRemote(userId: string): Promise<void> {
    const remote = new Set(await this.listPassedTaskIdsForUser(userId));
    for (const taskId of collectLocalPassedTaskIds(userId)) {
      if (remote.has(taskId)) {
        continue;
      }
      const { error } = await this.upsertPass(userId, taskId);
      if (error) {
        console.warn('practice_task_passes sync', taskId, error.message);
      } else {
        remote.add(taskId);
      }
    }
  }
}
