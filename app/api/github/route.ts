import { NextResponse } from 'next/server';
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from '@/lib/api-rate-limit';
import {
  GITHUB_USERNAME_RE,
  type GithubContributionDay,
  type GithubProfilePayload,
} from '@/lib/github-utils';

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

type GithubUserResponse = {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
};

type ContributionsApiResponse = {
  contributions?: GithubContributionDay[];
  total?: {
    lastYear?: number;
    [year: string]: number | undefined;
  };
};

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`github:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rate.ok) {
    return rateLimitResponse(rate.retryAfterSec);
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username')?.trim() ?? '';

  if (!username || !GITHUB_USERNAME_RE.test(username)) {
    return NextResponse.json({ error: 'Invalid GitHub username.' }, { status: 400 });
  }

  try {
    const [profileRes, contribRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'JNote-GitHubWidget/1.0',
        },
        next: { revalidate: 3600 },
      }),
      fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 3600 },
      }),
    ]);

    if (profileRes.status === 404) {
      return NextResponse.json({ error: 'GitHub user not found.' }, { status: 404 });
    }

    if (!profileRes.ok) {
      return NextResponse.json({ error: 'Could not load GitHub profile.' }, { status: 502 });
    }

    const profile = (await profileRes.json()) as GithubUserResponse;

    let contributions: GithubContributionDay[] = [];
    let totalContributions = 0;

    if (contribRes.ok) {
      const contribData = (await contribRes.json()) as ContributionsApiResponse;
      contributions = Array.isArray(contribData.contributions)
        ? contribData.contributions
        : [];
      totalContributions =
        contribData.total?.lastYear ??
        contributions.reduce((sum, day) => sum + day.count, 0);
    }

    const payload: GithubProfilePayload = {
      username: profile.login,
      name: profile.name?.trim() || profile.login,
      avatarUrl: profile.avatar_url,
      profileUrl: profile.html_url,
      totalContributions,
      contributions,
    };

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: 'GitHub request failed.' }, { status: 502 });
  }
}
