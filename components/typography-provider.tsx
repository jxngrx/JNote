'use client';

import { useEffect, useLayoutEffect } from 'react';
import { applyTypographyToDocument } from '@/lib/apply-typography';
import { useTypographySettingsStore } from '@/lib/typography-settings-store';

function syncTypographyFromStore() {
  const state = useTypographySettingsStore.getState();
  applyTypographyToDocument(state);
}

export default function TypographyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const primaryFontFamily = useTypographySettingsStore(
    (s) => s.primaryFontFamily
  );
  const secondaryFontFamily = useTypographySettingsStore(
    (s) => s.secondaryFontFamily
  );
  const fontStyle = useTypographySettingsStore((s) => s.fontStyle);
  const fontWeight = useTypographySettingsStore((s) => s.fontWeight);

  useLayoutEffect(() => {
    syncTypographyFromStore();
  }, [primaryFontFamily, secondaryFontFamily, fontStyle, fontWeight]);

  useEffect(() => {
    syncTypographyFromStore();

    const unsubHydrate =
      useTypographySettingsStore.persist.onFinishHydration(syncTypographyFromStore);

    return () => {
      unsubHydrate?.();
    };
  }, []);

  return children;
}
