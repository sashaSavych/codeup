import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TabsModule } from 'primeng/tabs';

import { computeOverallPracticeProgress, type OverallPracticeProgress } from '../../core/practice/practice-progress';
import { PracticeTasksService } from '../../core/practice/practice-tasks.service';
import { ProfileService } from '../../core/profile/profile.service';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { TopicsService } from '../../core/topics/topics.service';

/** Raw form fields; equality with the saved snapshot uses trimmed text fields. */
type ProfileFormSnapshot = {
  first_name: string;
  last_name: string;
  gender: string;
  class_name: string;
};

@Component({
  selector: 'cu-profile',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, CardModule, InputTextModule, MessageModule, TabsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly supabase = inject(SupabaseService);
  private readonly profileService = inject(ProfileService);
  private readonly practiceTasks = inject(PracticeTasksService);
  private readonly topicsService = inject(TopicsService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.supabase.user;

  readonly form = this.fb.nonNullable.group({
    first_name: [''],
    last_name: [''],
    gender: [''],
    class_name: [''],
  });

  readonly genderOptions = [
    { label: 'Жіноча', value: 'female' },
    { label: 'Чоловіча', value: 'male' },
    { label: 'Інше / не вказано', value: 'other' },
  ];

  /** Last values persisted in the DB; used for dirty detection and Cancel. */
  private savedSnapshot: ProfileFormSnapshot = {
    first_name: '',
    last_name: '',
    gender: '',
    class_name: '',
  };

  readonly hasUnsavedChanges = signal(false);

  readonly practiceProgress = signal<OverallPracticeProgress | null>(null);
  readonly practiceProgressLoading = signal(true);
  readonly practiceProgressError = signal('');

  /** Active tab key for `p-tabs` (Прогрес is first in the tab list). */
  activeTab: 'profile' | 'progress' = 'progress';

  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  async ngOnInit(): Promise<void> {
    const id = this.supabase.user()?.id;
    if (!id) {
      await this.router.navigateByUrl('/login');
      return;
    }

    const existing = await this.profileService.getByUserId(id);
    this.savedSnapshot = {
      first_name: existing?.first_name ?? '',
      last_name: existing?.last_name ?? '',
      gender: existing?.gender ?? '',
      class_name: existing?.class_name ?? '',
    };
    this.form.patchValue(this.savedSnapshot);

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.syncDirtyFlag());
    this.syncDirtyFlag();

    this.loading = false;

    void this.loadPracticeProgress(id);
  }

  private async loadPracticeProgress(userId: string): Promise<void> {
    this.practiceProgressLoading.set(true);
    this.practiceProgressError.set('');
    try {
      const [summaries, topics] = await Promise.all([
        this.practiceTasks.listTaskSummaries(),
        this.topicsService.listSummaries(),
      ]);
      this.practiceProgress.set(computeOverallPracticeProgress(userId, summaries, topics));
    } catch (e) {
      console.error(e);
      this.practiceProgressError.set(
        e instanceof Error ? e.message : 'Не вдалося завантажити прогрес практикуму.',
      );
      this.practiceProgress.set(null);
    } finally {
      this.practiceProgressLoading.set(false);
    }
  }

  cancel(): void {
    this.form.patchValue(this.savedSnapshot);
    this.errorMessage = '';
    this.successMessage = '';
    this.syncDirtyFlag();
  }

  async save(): Promise<void> {
    const id = this.supabase.user()?.id;
    if (!id || !this.hasUnsavedChanges()) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const v = this.form.getRawValue();
    const { error } = await this.profileService.upsert({
      id,
      first_name: v.first_name.trim() || null,
      last_name: v.last_name.trim() || null,
      gender: v.gender || null,
      class_name: v.class_name.trim() || null,
    });

    this.saving = false;

    if (error) {
      this.errorMessage = error.message;
      return;
    }

    await this.profileService.refreshCachedProfile(id);
    const saved = this.form.getRawValue();
    this.savedSnapshot = {
      first_name: saved.first_name.trim(),
      last_name: saved.last_name.trim(),
      gender: saved.gender || '',
      class_name: saved.class_name.trim(),
    };
    this.form.patchValue(this.savedSnapshot);
    this.syncDirtyFlag();
    this.successMessage = 'Профіль збережено.';
  }

  private syncDirtyFlag(): void {
    this.hasUnsavedChanges.set(!this.normalizedEqual(this.form.getRawValue(), this.savedSnapshot));
  }

  goToTopicPractice(slug: string): void {
    void this.router.navigate(['/topics', slug, 'practice']);
  }

  goToTopicsList(): void {
    void this.router.navigate(['/topics']);
  }

  private normalizedEqual(a: ProfileFormSnapshot, b: ProfileFormSnapshot): boolean {
    const n = (v: ProfileFormSnapshot) => ({
      first_name: v.first_name.trim(),
      last_name: v.last_name.trim(),
      gender: v.gender || '',
      class_name: v.class_name.trim(),
    });
    const x = n(a);
    const y = n(b);
    return (
      x.first_name === y.first_name &&
      x.last_name === y.last_name &&
      x.gender === y.gender &&
      x.class_name === y.class_name
    );
  }
}
