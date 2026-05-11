/** Ukrainian labels for `profiles.role` (avoid English «student» in UI). */
export function profileRoleLabelUk(role: string): string {
  switch (role) {
    case 'student':
      return 'Учень';
    case 'teacher':
      return 'Вчитель';
    case 'admin':
      return 'Адміністратор';
    default:
      return role;
  }
}
