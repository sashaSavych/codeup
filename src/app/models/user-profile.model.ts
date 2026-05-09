export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  class_name: string | null;
  updated_at?: string | null;
}
