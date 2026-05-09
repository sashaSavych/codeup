import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

import { ProfileService } from '../../core/profile/profile.service';
import { SupabaseService } from '../../core/supabase/supabase.service';

@Component({
  selector: 'cu-profile',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, CardModule, InputTextModule, MessageModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly supabase = inject(SupabaseService);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);

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
    if (existing) {
      this.form.patchValue({
        first_name: existing.first_name ?? '',
        last_name: existing.last_name ?? '',
        gender: existing.gender ?? '',
        class_name: existing.class_name ?? '',
      });
    }

    this.loading = false;
  }

  async save(): Promise<void> {
    const id = this.supabase.user()?.id;
    if (!id) {
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
    this.successMessage = 'Профіль збережено.';
  }
}
