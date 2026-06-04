import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';

import { ProfileService } from '../../core/profile/profile.service';
import { SupabaseService } from '../../core/supabase/supabase.service';

@Component({
  selector: 'cu-sign-up',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
  ],
  templateUrl: './sign-up.component.html',
})
export class SignUpComponent {
  private readonly fb = inject(FormBuilder);
  private readonly supabase = inject(SupabaseService);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    participant_kind: this.fb.nonNullable.control<'pupil' | 'teacher_intent'>('pupil'),
  });

  submitting = false;
  errorMessage = '';
  infoMessage = '';

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.infoMessage = '';

    const { email, password, participant_kind } = this.form.getRawValue();
    const { data, error } = await this.supabase.signUp(email, password);

    this.submitting = false;

    if (error) {
      this.errorMessage = error.message;
      return;
    }

    if (data.session) {
      if (participant_kind === 'teacher_intent') {
        const { error: pErr } = await this.profileService.upsert({
          id: data.session.user.id,
          teacher_role_requested: true,
        });
        if (pErr) {
          console.error(pErr);
        }
      }
      await this.router.navigate(['/profile'], { queryParams: { tab: 'profile', welcome: '1' } });
      return;
    }

    const teacherNote =
      participant_kind === 'teacher_intent'
        ? ' Ви обрали заявку на роль вчителя — після підтвердження пошти увійдіть; адміністратор побачить заявку в списку користувачів (можна також уточнити це в профілі).'
        : '';
    this.infoMessage =
      'Обліковий запис створено. Якщо увімкнено підтвердження email, перевірте поштову скриньку. Після підтвердження увійдіть через «Увійти».' +
      teacherNote;
  }
}
