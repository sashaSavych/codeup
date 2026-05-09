import { Injectable } from '@angular/core';

import { SupabaseService } from '../supabase/supabase.service';

import type { TopicDetail, TopicSummary } from './topic.model';

@Injectable({ providedIn: 'root' })
export class TopicsService {
  constructor(private readonly supabase: SupabaseService) {}

  async listSummaries(): Promise<TopicSummary[]> {
    const { data, error } = await this.supabase.client
      .from('topics')
      .select('slug, sort_order, title, summary')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error(error);
      throw new Error(error.message);
    }

    return (data ?? []) as TopicSummary[];
  }

  async getBySlug(slug: string): Promise<TopicDetail | null> {
    const { data, error } = await this.supabase.client
      .from('topics')
      .select('slug, sort_order, title, summary, theory_md')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error(error);
      throw new Error(error.message);
    }

    return data as TopicDetail | null;
  }
}
