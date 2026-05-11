import { Injectable } from '@angular/core';

import type { AdminUserRow } from '../../models/admin-user-row.model';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private readonly supabase: SupabaseService) {}

  async listUsers(): Promise<AdminUserRow[]> {
    const { data, error } = await this.supabase.client.rpc('admin_list_users_with_email');
    if (error) {
      console.error(error);
      return [];
    }
    return (data ?? []) as AdminUserRow[];
  }

  async setUserBlocked(userId: string, is_blocked: boolean): Promise<{ error: Error | null }> {
    const { error } = await this.supabase.client.from('profiles').update({ is_blocked }).eq('id', userId);
    return { error: error ? new Error(error.message) : null };
  }
}
