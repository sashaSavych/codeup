import { Injectable } from '@angular/core';

import { SupabaseService } from '../supabase/supabase.service';
import type { UserProfile } from '../../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private readonly supabase: SupabaseService) {}

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

    return data as UserProfile | null;
  }

  async upsert(profile: Pick<UserProfile, 'id'> & Partial<Omit<UserProfile, 'id'>>): Promise<{ error: Error | null }> {
    const row = {
      id: profile.id,
      first_name: profile.first_name ?? null,
      last_name: profile.last_name ?? null,
      gender: profile.gender ?? null,
      class_name: profile.class_name ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.supabase.client.from('profiles').upsert(row, { onConflict: 'id' });

    return { error: error ? new Error(error.message) : null };
  }
}
