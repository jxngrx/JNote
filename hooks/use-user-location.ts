'use client';

import { useEffect, useState } from 'react';
import { getBrowserLocation, type UserLocation } from '@/lib/user-location';

type LocationApiResponse = UserLocation | { source: 'unavailable' };

function isResolvedLocation(
  value: LocationApiResponse
): value is UserLocation {
  return 'timezone' in value && typeof value.timezone === 'string';
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation>(() => getBrowserLocation());
  const [isResolving, setIsResolving] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function resolveLocation() {
      try {
        const response = await fetch('/api/location');

        if (!response.ok || cancelled) {
          return;
        }

        const data = (await response.json()) as LocationApiResponse;

        if (!cancelled && isResolvedLocation(data)) {
          setLocation(data);
        }
      } finally {
        if (!cancelled) {
          setIsResolving(false);
        }
      }
    }

    resolveLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  return { location, isResolving };
}
