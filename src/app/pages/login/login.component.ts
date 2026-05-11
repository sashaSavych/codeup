import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';

import { ProfileService } from '../../core/profile/profile.service';
import { SupabaseService } from '../../core/supabase/supabase.service';

const BLOCKED_USER_LOGIN_MESSAGE =
  'Користувач був заблокований. Зверніться до адміністратора.';

@Component({
  selector: 'cu-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
  ],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly supabase = inject(SupabaseService);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submitting = false;
  errorMessage = '';
  blockedNotice = '';

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('blocked') === '1') {
      this.blockedNotice = BLOCKED_USER_LOGIN_MESSAGE;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.blockedNotice = '';

    const { email, password } = this.form.getRawValue();
    const { error } = await this.supabase.signInWithPassword(email, password);

    if (error) {
      this.submitting = false;
      this.errorMessage = error.message;
      return;
    }

    const uid = this.supabase.session()?.user?.id;
    if (uid) {
      const profile = await this.profileService.getByUserId(uid);
      if (profile?.is_blocked) {
        await this.supabase.signOut();
        this.profileService.clearCachedProfile();
        this.blockedNotice = BLOCKED_USER_LOGIN_MESSAGE;
        this.submitting = false;
        void this.router.navigate(['/login'], { replaceUrl: true });
        return;
      }
    }

    this.submitting = false;
    await this.router.navigateByUrl('/profile');
  }
}
