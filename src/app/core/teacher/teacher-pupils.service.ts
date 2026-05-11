import { Injectable } from '@angular/core';

import type { TeacherPupilProgressRow } from '../../models/teacher-pupil-progress-row.model';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({ providedIn: 'root' })
export class TeacherPupilsService {
  constructor(private readonly supabase: SupabaseService) {}

  async listPupilsWithProgress(): Promise<TeacherPupilProgressRow[]> {
    const { data, error } = await this.supabase.client.rpc('teacher_list_pupils_progress');
    if (error) {
      console.error(error);
      return [];
    }
    const rows = (data ?? []) as Record<string, unknown>[];
    return rows.map((r) => ({
      pupil_id: String(r['pupil_id']),
      email: String(r['email'] ?? ''),
      first_name: (r['first_name'] as string | null) ?? null,
      last_name: (r['last_name'] as string | null) ?? null,
      class_display_name: String(r['class_display_name'] ?? ''),
      completed: Number(r['completed'] ?? 0),
      total_tasks: Number(r['total_tasks'] ?? 0),
    }));
  }
}
