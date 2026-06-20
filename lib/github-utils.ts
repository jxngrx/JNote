export const GITHUB_USERNAME_RE =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

export function normalizeGithubUsername(raw: string): string | null {
  const trimmed = raw.trim().replace(/^@/, '');
  if (!trimmed || !GITHUB_USERNAME_RE.test(trimmed)) return null;
  return trimmed;
}

export type GithubContributionDay = {
  date: string;
  count: number;
  level: number;
};

export type GithubProfilePayload = {
  username: string;
  name: string;
  avatarUrl: string;
  profileUrl: string;
  totalContributions: number;
  contributions: GithubContributionDay[];
};

export function contributionLevelColor(level: number): string {
  if (level <= 0) return 'var(--github-contrib-0)';
  if (level === 1) return 'var(--github-contrib-1)';
  if (level === 2) return 'var(--github-contrib-2)';
  if (level === 3) return 'var(--github-contrib-3)';
  return 'var(--github-contrib-4)';
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function contributionsToWeeks(
  contributions: GithubContributionDay[]
): GithubContributionDay[][] {
  if (contributions.length === 0) return [];

  const sorted = [...contributions].sort((a, b) => a.date.localeCompare(b.date));
  const first = new Date(`${sorted[0].date}T12:00:00`);
  const last = new Date(`${sorted[sorted.length - 1].date}T12:00:00`);

  const start = new Date(first);
  start.setDate(start.getDate() - start.getDay());

  const dayMap = new Map(sorted.map((day) => [day.date, day]));
  const weeks: GithubContributionDay[][] = [];
  const cursor = new Date(start);

  while (cursor <= last || weeks.length < 53) {
    const week: GithubContributionDay[] = [];
    for (let day = 0; day < 7; day += 1) {
      const key = toLocalDateKey(cursor);
      week.push(dayMap.get(key) ?? { date: key, count: 0, level: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (weeks.length >= 53) break;
  }

  return weeks.slice(-53);
}

export function formatContributionDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
