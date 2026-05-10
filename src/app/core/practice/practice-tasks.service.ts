import { Injectable } from '@angular/core';

import { SupabaseService } from '../supabase/supabase.service';

import type { CodeTask } from './code-task.model';
import { verifyAsyncGiveOk, verifyWithHarness } from './task-verify';

interface PracticeTaskRow {
  id: string;
  topic_slug: string;
  sort_order: number;
  title: string;
  description: string;
  starter_code: string;
  harness: string;
  verify_kind: 'harness' | 'async_give_ok';
}

@Injectable({ providedIn: 'root' })
export class PracticeTasksService {
  constructor(private readonly supabase: SupabaseService) {}

  async getTasksForTopic(topicSlug: string): Promise<CodeTask[]> {
    const { data, error } = await this.supabase.client
      .from('practice_tasks')
      .select(
        'id, topic_slug, sort_order, title, description, starter_code, harness, verify_kind',
      )
      .eq('topic_slug', topicSlug)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error(error);
      throw new Error(error.message);
    }

    return (data as PracticeTaskRow[] | null)?.map((row) => this.rowToTask(row)) ?? [];
  }

  private rowToTask(row: PracticeTaskRow): CodeTask {
    const base = {
      id: row.id,
      topicSlug: row.topic_slug,
      order: row.sort_order,
      title: row.title,
      description: row.description,
      starterCode: row.starter_code,
    };
    if (row.verify_kind === 'async_give_ok') {
      return { ...base, verify: verifyAsyncGiveOk };
    }
    return {
      ...base,
      verify: (code: string) => verifyWithHarness(code, row.harness),
    };
  }
}
