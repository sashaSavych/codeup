import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import { SupabaseService } from '../supabase/supabase.service';

export const authGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  await supabase.initialSessionPromise;
  if (!supabase.session()) {
    return router.createUrlTree(['/login']);
  }

  return true;
};
