import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';

import { SupabaseService } from '../../core/supabase/supabase.service';

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
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submitting = false;
  errorMessage = '';

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const { email, password } = this.form.getRawValue();
    const { error } = await this.supabase.signInWithPassword(email, password);

    this.submitting = false;

    if (error) {
      this.errorMessage = error.message;
      return;
    }

    await this.router.navigateByUrl('/profile');
  }
}
