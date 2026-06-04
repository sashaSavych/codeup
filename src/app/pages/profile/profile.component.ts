import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';

import { ClassesService } from '../../core/classes/classes.service';
import { GamificationService, type GamificationStatus } from '../../core/gamification/gamification.service';
import { computeOverallPracticeProgress, type OverallPracticeProgress } from '../../core/practice/practice-progress';
import { PracticeProgressRemoteService } from '../../core/practice/practice-progress-remote.service';
import { collectLocalPassedTaskIds } from '../../core/practice/practice-storage';
import { PracticeTasksService } from '../../core/practice/practice-tasks.service';
import { ProfileService } from '../../core/profile/profile.service';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { TopicsService } from '../../core/topics/topics.service';
import type { SchoolClass } from '../../models/school-class.model';
import type { UserProfile } from '../../models/user-profile.model';
import { PROGRESS_LEGEND_TOOLTIP } from '../../shared/copy/progress-labels';
import { GamificationRulesPanelComponent } from '../../shared/gamification-rules-panel/gamification-rules-panel.component';
import { TeacherPupilsPanelComponent } from './teacher-pupils-panel.component';

/** Raw form fields; equality with the saved snapshot uses trimmed text fields. */
type ProfileFormSnapshot = {
  first_name: string;
  last_name: string;
  gender: string;
  class_id: string;
  teacher_role_requested: boolean;
  competition_opt_in: boolean;
  leaderboard_nickname: string;
};

@Component({
  selector: 'cu-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    InputTextModule,
    MessageModule,
    TabsModule,
    TeacherPupilsPanelComponent,
    GamificationRulesPanelComponent,
    TooltipModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly supabase = inject(SupabaseService);
  private readonly profileService = inject(ProfileService);
  private readonly practiceTasks = inject(PracticeTasksService);
  private readonly topicsService = inject(TopicsService);
  private readonly classesService = inject(ClassesService);
  private readonly practiceProgressRemote = inject(PracticeProgressRemoteService);
  private readonly gamification = inject(GamificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.supabase.user;

  readonly isAdmin = computed(() => this.profileService.cachedProfile()?.role === 'admin');

  /** Учні: лише для підтверджених вчителів (не для адміністратора без ролі вчителя). */
  readonly canSeePupils = computed(() => this.profileService.cachedProfile()?.role === 'teacher');

  readonly isPupilRole = computed(() => this.profileService.cachedProfile()?.role === 'student');

  readonly progressLegendTooltip = PROGRESS_LEGEND_TOOLTIP;

  /** Довідник класів (з адмінки); порожньо, якщо ще не налаштовано. */
  classesList: SchoolClass[] = [];

  readonly form = this.fb.nonNullable.group({
    first_name: [''],
    last_name: [''],
    gender: [''],
    class_id: [''],
    teacher_role_requested: [false],
    competition_opt_in: [false],
    leaderboard_nickname: [''],
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
    class_id: '',
    teacher_role_requested: false,
    competition_opt_in: false,
    leaderboard_nickname: '',
  };

  readonly hasUnsavedChanges = signal(false);

  readonly practiceProgress = signal<OverallPracticeProgress | null>(null);
  readonly practiceProgressLoading = signal(true);
  readonly practiceProgressError = signal('');

  readonly gamificationStatus = signal<GamificationStatus | null>(null);
  readonly gamificationLoading = signal(false);
  readonly gamificationError = signal('');

  /** Active tab key for `p-tabs` (Прогрес is first in the tab list). */
  activeTab: 'profile' | 'progress' | 'pupils' = 'progress';

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

    const [existing, classes] = await Promise.all([this.profileService.getByUserId(id), this.classesService.list()]);
    await this.profileService.refreshCachedProfile(id);

    const isAdminUser = existing?.role === 'admin';
    let tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'admin') {
      tab = 'profile';
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { tab: 'profile' },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
    if (isAdminUser && tab === 'progress') {
      tab = 'profile';
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { tab: 'profile' },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
    const canPupils = existing?.role === 'teacher';
    if (tab === 'pupils' && !canPupils) {
      tab = isAdminUser ? 'profile' : 'progress';
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { tab },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
    if (tab === 'profile' || tab === 'progress' || tab === 'pupils') {
      if (isAdminUser && tab === 'progress') {
        this.activeTab = 'profile';
      } else {
        this.activeTab = tab;
      }
    } else {
      this.activeTab = isAdminUser ? 'profile' : 'progress';
    }

    if (this.route.snapshot.queryParamMap.get('welcome') === '1') {
      this.successMessage = 'Ласкаво просимо! Заповни профіль і перейди до тем.';
    }

    this.classesList = classes;
    this.savedSnapshot = {
      first_name: existing?.first_name ?? '',
      last_name: existing?.last_name ?? '',
      gender: existing?.gender ?? '',
      class_id: existing?.class_id ?? '',
      teacher_role_requested: existing?.teacher_role_requested === true,
      competition_opt_in: existing?.competition_opt_in === true,
      leaderboard_nickname: existing?.leaderboard_nickname?.trim() ?? '',
    };
    this.form.patchValue(this.savedSnapshot);

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.syncDirtyFlag());
    this.syncDirtyFlag();

    this.loading = false;

    if (!isAdminUser) {
      void this.loadPracticeProgress(id);
      if (existing?.role === 'student') {
        void this.loadGamification();
      }
    } else {
      this.practiceProgressLoading.set(false);
    }
  }

  private async loadGamification(): Promise<void> {
    this.gamificationLoading.set(true);
    this.gamificationError.set('');
    try {
      await this.gamification.reconcile();
      const { status, error } = await this.gamification.status();
      if (error) {
        this.gamificationError.set(error.message);
        this.gamificationStatus.set(null);
        return;
      }
      this.gamificationStatus.set(status);
    } catch (e) {
      console.error(e);
      this.gamificationError.set(
        e instanceof Error ? e.message : 'Не вдалося завантажити дані змагання.',
      );
      this.gamificationStatus.set(null);
    } finally {
      this.gamificationLoading.set(false);
    }
  }

  private async loadPracticeProgress(userId: string): Promise<void> {
    this.practiceProgressLoading.set(true);
    this.practiceProgressError.set('');
    try {
      const [summaries, topics] = await Promise.all([
        this.practiceTasks.listTaskSummaries(),
        this.topicsService.listSummaries(),
      ]);
      await this.practiceProgressRemote.syncLocalPassedToRemote(userId);
      const remote = await this.practiceProgressRemote.listPassedTaskIdsForUser(userId);
      const merged = new Set<string>([...remote, ...collectLocalPassedTaskIds(userId)]);
      this.practiceProgress.set(computeOverallPracticeProgress(merged, summaries, topics));
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
    const classId = v.class_id?.trim() || null;
    const picked = classId ? this.classesList.find((c) => c.id === classId) : undefined;
    const role = this.profileService.cachedProfile()?.role;
    if (role === 'student' && v.competition_opt_in && !classId) {
      this.saving = false;
      this.errorMessage = 'Щоб брати участь у змаганні, оберіть клас у профілі.';
      return;
    }
    if (role === 'student' && v.competition_opt_in && !this.savedSnapshot.leaderboard_nickname && !v.leaderboard_nickname.trim()) {
      this.saving = false;
      this.errorMessage = 'Введіть псевдонім для таблиці лідерів (його не можна буде змінити самостійно).';
      return;
    }
    const upsertPayload: Pick<UserProfile, 'id'> &
      Partial<
        Pick<
          UserProfile,
          | 'first_name'
          | 'last_name'
          | 'gender'
          | 'class_id'
          | 'class_name'
          | 'teacher_role_requested'
          | 'competition_opt_in'
          | 'leaderboard_nickname'
        >
      > = {
      id,
      first_name: v.first_name.trim() || null,
      last_name: v.last_name.trim() || null,
      gender: v.gender || null,
      class_id: classId,
      class_name: picked?.name ?? null,
    };
    if (role === 'student') {
      upsertPayload.teacher_role_requested = v.teacher_role_requested;
      upsertPayload.competition_opt_in = v.competition_opt_in;
      if (!this.savedSnapshot.leaderboard_nickname) {
        upsertPayload.leaderboard_nickname = v.leaderboard_nickname.trim() || null;
      }
    }
    const { error } = await this.profileService.upsert(upsertPayload);

    this.saving = false;

    if (error) {
      this.errorMessage = error.message;
      return;
    }

    await this.profileService.refreshCachedProfile(id);
    const saved = this.form.getRawValue();
    const refreshed = this.profileService.cachedProfile();
    this.savedSnapshot = {
      first_name: saved.first_name.trim(),
      last_name: saved.last_name.trim(),
      gender: saved.gender || '',
      class_id: saved.class_id?.trim() ?? '',
      teacher_role_requested: role === 'student' ? saved.teacher_role_requested : this.savedSnapshot.teacher_role_requested,
      competition_opt_in: role === 'student' ? !!refreshed?.competition_opt_in : this.savedSnapshot.competition_opt_in,
      leaderboard_nickname: role === 'student' ? refreshed?.leaderboard_nickname?.trim() ?? '' : this.savedSnapshot.leaderboard_nickname,
    };
    this.form.patchValue(this.savedSnapshot);
    this.syncDirtyFlag();
    if (role === 'student') {
      const snap = this.savedSnapshot;
      if (snap.competition_opt_in && snap.class_id.trim() && snap.leaderboard_nickname.trim()) {
        const rec = await this.gamification.reconcile();
        if (rec.error) {
          console.warn('gamification_reconcile', rec.error.message);
        }
      }
      void this.loadGamification();
    }

    if (this.isProfileReadyForNavigation(role)) {
      await this.router.navigate(['/topics'], { queryParams: { saved: '1' } });
      return;
    }

    this.successMessage =
      role === 'student'
        ? 'Профіль збережено. Додай ім’я та клас, щоб перейти до тем.'
        : 'Профіль збережено. Додай ім’я, щоб перейти до тем.';
  }

  /** Enough data to leave profile after save. */
  private isProfileReadyForNavigation(role: string | undefined): boolean {
    const snap = this.savedSnapshot;
    if (!snap.first_name.trim().length) {
      return false;
    }
    if (role === 'student') {
      return !!snap.class_id.trim().length;
    }
    return true;
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

  goToLeaderboard(): void {
    void this.router.navigate(['/leaderboard']);
  }

  readonly nicknameLocked = computed(
    () => !!this.profileService.cachedProfile()?.leaderboard_nickname?.trim(),
  );

  onTabChange(value: string | number | undefined): void {
    if (value === undefined || value === null) {
      return;
    }
    const v = String(value);
    if (v !== 'progress' && v !== 'profile' && v !== 'pupils') {
      return;
    }
    if (v === 'progress' && this.isAdmin()) {
      return;
    }
    if (v === 'pupils' && !this.canSeePupils()) {
      return;
    }
    this.activeTab = v as 'progress' | 'profile' | 'pupils';
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: v },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private normalizedEqual(a: ProfileFormSnapshot, b: ProfileFormSnapshot): boolean {
    const n = (v: ProfileFormSnapshot) => ({
      first_name: v.first_name.trim(),
      last_name: v.last_name.trim(),
      gender: v.gender || '',
      class_id: v.class_id.trim(),
      teacher_role_requested: v.teacher_role_requested,
      competition_opt_in: v.competition_opt_in,
      leaderboard_nickname: v.leaderboard_nickname.trim(),
    });
    const x = n(a);
    const y = n(b);
    return (
      x.first_name === y.first_name &&
      x.last_name === y.last_name &&
      x.gender === y.gender &&
      x.class_id === y.class_id &&
      x.teacher_role_requested === y.teacher_role_requested &&
      x.competition_opt_in === y.competition_opt_in &&
      x.leaderboard_nickname === y.leaderboard_nickname
    );
  }
}
