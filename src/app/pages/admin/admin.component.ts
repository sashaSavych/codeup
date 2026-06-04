import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TabsModule } from 'primeng/tabs';

import { AdminService } from '../../core/admin/admin.service';
import { ClassesService } from '../../core/classes/classes.service';
import { profileRoleLabelUk } from '../../core/profile/profile-role-label';
import { ProfileService } from '../../core/profile/profile.service';
import { SupabaseService } from '../../core/supabase/supabase.service';
import type { AdminUserRow } from '../../models/admin-user-row.model';
import type { SchoolClass } from '../../models/school-class.model';

@Component({
  selector: 'cu-admin',
  standalone: true,
  imports: [FormsModule, ButtonModule, CardModule, CheckboxModule, InputTextModule, MessageModule, TabsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private readonly classesService = inject(ClassesService);
  private readonly adminService = inject(AdminService);
  private readonly profileService = inject(ProfileService);
  private readonly supabase = inject(SupabaseService);

  activeTab: 'classes' | 'teachers' | 'users' = 'classes';

  readonly classes = signal<SchoolClass[]>([]);
  readonly users = signal<AdminUserRow[]>([]);
  readonly blockedOnly = signal(false);

  readonly filteredUsers = computed(() => {
    const list = this.users();
    if (!this.blockedOnly()) {
      return list;
    }
    return list.filter((u) => u.is_blocked);
  });

  /** Заявки на роль вчителя (учень + прапорець заявки). */
  readonly pendingTeacherRows = computed(() =>
    this.users().filter((u) => u.teacher_role_requested && u.role === 'student'),
  );

  readonly currentAdminId = computed(() => this.profileService.cachedProfile()?.id ?? this.supabase.user()?.id ?? null);

  newClassName = '';

  classesLoading = true;
  usersLoading = true;
  classesError = '';
  usersError = '';
  actionError = '';
  actionBusy = false;

  async ngOnInit(): Promise<void> {
    await Promise.all([this.reloadClasses(), this.reloadUsers()]);
  }

  async reloadClasses(): Promise<void> {
    this.classesLoading = true;
    this.classesError = '';
    try {
      this.classes.set(await this.classesService.list());
    } catch (e) {
      console.error(e);
      this.classesError = e instanceof Error ? e.message : 'Не вдалося завантажити класи.';
    } finally {
      this.classesLoading = false;
    }
  }

  async reloadUsers(): Promise<void> {
    this.usersLoading = true;
    this.usersError = '';
    try {
      this.users.set(await this.adminService.listUsers());
    } catch (e) {
      console.error(e);
      this.usersError = e instanceof Error ? e.message : 'Не вдалося завантажити користувачів.';
    } finally {
      this.usersLoading = false;
    }
  }

  async addClass(): Promise<void> {
    this.actionError = '';
    this.actionBusy = true;
    const { error } = await this.classesService.create(this.newClassName);
    this.actionBusy = false;
    if (error) {
      this.actionError = error.message;
      return;
    }
    this.newClassName = '';
    await this.reloadClasses();
  }

  async togglePeerSharing(c: SchoolClass, enabled: boolean): Promise<void> {
    this.actionError = '';
    this.actionBusy = true;
    const { error } = await this.classesService.setPeerSolutionsEnabled(c.id, enabled);
    this.actionBusy = false;
    if (error) {
      this.actionError = error.message;
      return;
    }
    await this.reloadClasses();
  }

  async removeClass(c: SchoolClass): Promise<void> {
    this.actionError = '';
    this.actionBusy = true;
    const { error } = await this.classesService.delete(c.id);
    this.actionBusy = false;
    if (error) {
      this.actionError = error.message;
      return;
    }
    await this.reloadClasses();
  }

  roleLabelUk(role: string): string {
    return profileRoleLabelUk(role);
  }

  async approveTeacher(row: AdminUserRow): Promise<void> {
    this.actionError = '';
    this.actionBusy = true;
    const { error } = await this.adminService.approveTeacherRole(row.id);
    this.actionBusy = false;
    if (error) {
      this.actionError = error.message;
      return;
    }
    await this.reloadUsers();
    const self = this.profileService.cachedProfile();
    if (self?.id === row.id) {
      await this.profileService.refreshCachedProfile(row.id);
    }
  }

  async rejectTeacherRequest(row: AdminUserRow): Promise<void> {
    this.actionError = '';
    this.actionBusy = true;
    const { error } = await this.adminService.rejectTeacherRoleRequest(row.id);
    this.actionBusy = false;
    if (error) {
      this.actionError = error.message;
      return;
    }
    await this.reloadUsers();
    const self = this.profileService.cachedProfile();
    if (self?.id === row.id) {
      await this.profileService.refreshCachedProfile(row.id);
    }
  }

  async setBlocked(row: AdminUserRow, blocked: boolean): Promise<void> {
    if (this.isSelf(row)) {
      this.actionError = 'Неможливо заблокувати або розблокувати власний обліковий запис.';
      return;
    }
    this.actionError = '';
    this.actionBusy = true;
    const { error } = await this.adminService.setUserBlocked(row.id, blocked);
    this.actionBusy = false;
    if (error) {
      this.actionError = error.message;
      return;
    }
    await this.reloadUsers();
    const self = this.profileService.cachedProfile();
    if (self?.id === row.id) {
      await this.profileService.refreshCachedProfile(row.id);
    }
  }

  displayName(row: AdminUserRow): string {
    const fn = row.first_name?.trim() ?? '';
    const ln = row.last_name?.trim() ?? '';
    const n = `${fn} ${ln}`.trim();
    return n || '—';
  }

  displayClass(row: AdminUserRow): string {
    return row.class_list_name || row.class_free_name || '—';
  }

  isSelf(row: AdminUserRow): boolean {
    const id = this.currentAdminId();
    return id !== null && row.id === id;
  }
}
