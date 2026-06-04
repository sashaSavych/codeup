import { Injectable } from '@angular/core';

import { SupabaseService } from '../supabase/supabase.service';

import { ClassTopicOrderService } from './class-topic-order.service';
import { mergeTopicsWithClassOrder } from './merge-topic-order';
import type { TopicDetail, TopicSummary } from './topic.model';

@Injectable({ providedIn: 'root' })
export class TopicsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly classTopicOrder: ClassTopicOrderService,
  ) {}

  async listSummaries(): Promise<TopicSummary[]> {
    return this.fetchGlobalSummaries();
  }

  /** Global catalog merged with per-class order when `classId` is set. */
  async listSummariesForUser(classId: string | null | undefined): Promise<TopicSummary[]> {
    const global = await this.fetchGlobalSummaries();
    if (!classId?.trim()) {
      return global;
    }
    try {
      const overrides = await this.classTopicOrder.listForClass(classId);
      return mergeTopicsWithClassOrder(global, overrides);
    } catch (e) {
      console.warn('class_topic_order', e);
      return global;
    }
  }

  private async fetchGlobalSummaries(): Promise<TopicSummary[]> {
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
