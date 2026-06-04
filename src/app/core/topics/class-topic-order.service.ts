import { Injectable } from '@angular/core';

import { SupabaseService } from '../supabase/supabase.service';

export interface ClassTopicOrderRow {
  topic_slug: string;
  sort_order: number;
}

@Injectable({ providedIn: 'root' })
export class ClassTopicOrderService {
  constructor(private readonly supabase: SupabaseService) {}

  async listForClass(classId: string): Promise<ClassTopicOrderRow[]> {
    const { data, error } = await this.supabase.client
      .from('class_topic_order')
      .select('topic_slug, sort_order')
      .eq('class_id', classId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error(error);
      throw new Error(error.message);
    }
    return (data ?? []) as ClassTopicOrderRow[];
  }

  async saveOrder(classId: string, orderedSlugs: string[]): Promise<{ error: Error | null }> {
    const { error } = await this.supabase.client.rpc('upsert_class_topic_order', {
      p_class_id: classId,
      p_slugs: orderedSlugs,
    });
    return { error: error ? new Error(error.message) : null };
  }
}
