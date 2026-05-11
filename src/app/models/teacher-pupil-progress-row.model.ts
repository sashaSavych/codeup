/** Row from RPC `teacher_list_pupils_progress`. */
export interface TeacherPupilProgressRow {
  pupil_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  class_display_name: string;
  completed: number;
  total_tasks: number;
}
