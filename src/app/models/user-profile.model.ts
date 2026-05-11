export type ProfileRole = 'student' | 'teacher' | 'admin';

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  class_name: string | null;
  class_id: string | null;
  role: ProfileRole;
  is_blocked: boolean;
  /** User asked to become a teacher; administrator must approve (sets `role` to teacher). */
  teacher_role_requested: boolean;
  /** Participate in class leaderboard (requires class + nickname rules in UI). */
  competition_opt_in: boolean;
  /** Public display name on leaderboard; set once while opted in (DB trigger). */
  leaderboard_nickname: string | null;
  updated_at?: string | null;
}
