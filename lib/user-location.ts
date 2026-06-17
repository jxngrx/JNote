import { getShortTimezoneName } from '@/lib/country-timezones';

export type UserLocationSource = 'browser' | 'ip';

export interface UserLocation {
  city: string;
  timezone: string;
  source: UserLocationSource;
}

export function getBrowserLocation(): UserLocation {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';

  return {
    city: getShortTimezoneName(timezone),
    timezone,
    source: 'browser',
  };
}
