'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/theme-store';
import { applyThemeToDocument } from '@/lib/theme-utils';
import { applyWallpaperContrastTokens } from '@/lib/wallpaper-contrast-tokens';

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const colors = useThemeStore((s) => s.colors);
  const mode = useThemeStore((s) => s.mode);
  const presetId = useThemeStore((s) => s.presetId);

  useEffect(() => {
    const root = document.documentElement;
    const wallpaperActive = root.dataset.wallpaperActive === 'true';

    if (wallpaperActive) {
      applyWallpaperContrastTokens(colors, mode);
      return;
    }

    applyThemeToDocument(colors, mode, presetId);
  }, [colors, mode, presetId]);

  return children;
}
