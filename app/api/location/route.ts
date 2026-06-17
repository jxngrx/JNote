import { NextResponse } from 'next/server';
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from '@/lib/api-rate-limit';
import { getShortTimezoneName } from '@/lib/country-timezones';
import type { UserLocation } from '@/lib/user-location';

const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

type IpWhoResponse = {
  success?: boolean;
  city?: string;
  timezone?: {
    id?: string;
  };
};

function isPrivateIp(ip: string) {
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return true;
  }

  if (ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return true;
  }

  const parts = ip.split('.').map(Number);
  if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`location:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rate.ok) {
    return rateLimitResponse(rate.retryAfterSec);
  }

  const forwarded = request.headers.get('x-forwarded-for');
  const clientIp =
    forwarded?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    undefined;

  if (!clientIp || isPrivateIp(clientIp)) {
    return NextResponse.json({ source: 'unavailable' });
  }

  try {
    const response = await fetch(`https://ipwho.is/${clientIp}`, {
      next: { revalidate: 60 * 60 * 24 },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json({ source: 'unavailable' });
    }

    const data = (await response.json()) as IpWhoResponse;

    if (!data.success || !data.timezone?.id) {
      return NextResponse.json({ source: 'unavailable' });
    }

    const location: UserLocation = {
      city:
        data.city?.trim() ||
        getShortTimezoneName(data.timezone.id),
      timezone: data.timezone.id,
      source: 'ip',
    };

    return NextResponse.json(location);
  } catch {
    return NextResponse.json({ source: 'unavailable' });
  }
}
