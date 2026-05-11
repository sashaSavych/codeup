/** Row from RPC admin_list_users_with_email. */
export interface AdminUserRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  is_blocked: boolean;
  class_id: string | null;
  class_list_name: string | null;
  class_free_name: string | null;
  teacher_role_requested: boolean;
  updated_at: string | null;
}
