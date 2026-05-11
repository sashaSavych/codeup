import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import { ProfileService } from '../profile/profile.service';
import { SupabaseService } from '../supabase/supabase.service';

export const adminGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const profileService = inject(ProfileService);
  const router = inject(Router);

  await supabase.initialSessionPromise;
  const uid = supabase.session()?.user?.id;
  if (!uid) {
    return router.createUrlTree(['/login']);
  }

  const profile = await profileService.getByUserId(uid);
  if (profile?.role !== 'admin') {
    return router.createUrlTree(['/']);
  }

  return true;
};
