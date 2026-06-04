import type { LeaderboardRow } from './gamification.service';
import type { UserProfile } from '../../models/user-profile.model';

export function findMyRank(rows: LeaderboardRow[], nickname: string): number | null {
  const nick = nickname.trim();
  if (!nick) {
    return null;
  }
  const row = rows.find((r) => r.nickname === nick);
  return row?.rank ?? null;
}

/** Ukrainian hint when leaderboard/top5 list is empty for the current user. */
export function leaderboardEmptyHint(profile: UserProfile | null | undefined): string {
  if (!profile) {
    return 'Увійдіть і налаштуйте профіль, щоб бачити рейтинг класу.';
  }
  if (!profile.class_id) {
    return 'Оберіть клас у профілі — тоді з’явиться рейтинг учнів вашого класу.';
  }
  if (!profile.competition_opt_in) {
    return 'Увімкніть участь у змаганні в профілі, щоб потрапити в таблицю лідерів.';
  }
  const nick = profile.leaderboard_nickname?.trim();
  if (!nick) {
    return 'Вкажіть псевдонім для таблиці лідерів у профілі (його видно лише в межах класу).';
  }
  return 'Почни виконувати вправи в практикумі — бали нараховуються після першої успішної перевірки. Якщо ти вже в змаганні, онови сторінку через кілька секунд.';
}

export function canShowMyRank(profile: UserProfile | null | undefined): boolean {
  return !!(
    profile?.competition_opt_in &&
    profile.class_id &&
    profile.leaderboard_nickname?.trim()
  );
}
