'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/theme-store';
import { applyThemeToDocument } from '@/lib/theme-utils';
import { applyWallpaperContrastTokens } from '@/lib/wallpaper-contrast-tokens';
import type { WallpaperTone } from '@/lib/wallpaper-luminance';

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const colors = useThemeStore((s) => s.colors);
  const mode = useThemeStore((s) => s.mode);
  const presetId = useThemeStore((s) => s.presetId);

  useEffect(() => {
    applyThemeToDocument(colors, mode, presetId);

    const root = document.documentElement;
    if (root.dataset.wallpaperActive === 'true') {
      const tone = root.dataset.wallpaperTone as WallpaperTone | undefined;
      if (tone === 'light' || tone === 'dark') {
        applyWallpaperContrastTokens(tone);
      }
    }
  }, [colors, mode, presetId]);

  return children;
}
