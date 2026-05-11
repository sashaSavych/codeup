import { Injectable } from '@angular/core';

import type { SchoolClass } from '../../models/school-class.model';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({ providedIn: 'root' })
export class ClassesService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(): Promise<SchoolClass[]> {
    const { data, error } = await this.supabase.client
      .from('classes')
      .select('id,name,sort_order,created_at')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error(error);
      return [];
    }
    return (data ?? []) as SchoolClass[];
  }

  async create(name: string): Promise<{ error: Error | null }> {
    const trimmed = name.trim();
    if (!trimmed) {
      return { error: new Error('Назва класу не може бути порожньою.') };
    }
    const { error } = await this.supabase.client.from('classes').insert({ name: trimmed, sort_order: 0 });
    return { error: error ? new Error(error.message) : null };
  }

  async delete(id: string): Promise<{ error: Error | null }> {
    const { error } = await this.supabase.client.from('classes').delete().eq('id', id);
    return { error: error ? new Error(error.message) : null };
  }
}
