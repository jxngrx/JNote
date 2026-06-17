'use client';

import { useEffect } from 'react';
import { useBackgroundSettingsStore } from '@/lib/background-settings-store';
import { gradientAverageTone } from '@/lib/background-gradient';
import { detectWallpaperTone } from '@/lib/wallpaper-luminance';
import {
  applyWallpaperContrastTokens,
  clearWallpaperContrastState,
} from '@/lib/wallpaper-contrast-tokens';
import { useThemeStore } from '@/lib/theme-store';
import { applyThemeToDocument } from '@/lib/theme-utils';

export default function WallpaperContrastSync() {
  const kind = useBackgroundSettingsStore((s) => s.kind);
  const presetId = useBackgroundSettingsStore((s) => s.presetId);
  const customImageUrl = useBackgroundSettingsStore((s) => s.customImageUrl);
  const gradientColors = useBackgroundSettingsStore((s) => s.gradientColors);
  const isActive = useBackgroundSettingsStore((s) => s.isActive);
  const getResolvedBackground = useBackgroundSettingsStore(
    (s) => s.getResolvedBackground
  );

  const colors = useThemeStore((s) => s.colors);
  const mode = useThemeStore((s) => s.mode);
  const themePresetId = useThemeStore((s) => s.presetId);

  useEffect(() => {
    const root = document.documentElement;
    const active = isActive();

    if (!active) {
      clearWallpaperContrastState();
      return;
    }

    const applyTone = (tone: 'light' | 'dark') => {
      root.setAttribute('data-wallpaper-active', 'true');
      root.dataset.wallpaperActive = 'true';
      root.setAttribute('data-wallpaper-tone', tone);
      root.dataset.wallpaperTone = tone;
      applyThemeToDocument(colors, mode, themePresetId);
      applyWallpaperContrastTokens(tone);
    };

    if (kind === 'gradient') {
      applyTone(gradientAverageTone(gradientColors));
      return;
    }

    applyTone('light');

    let cancelled = false;
    const image = getResolvedBackground();

    detectWallpaperTone(image).then((tone) => {
      if (cancelled) return;
      applyTone(tone);
    });

    return () => {
      cancelled = true;
    };
  }, [
    kind,
    presetId,
    customImageUrl,
    gradientColors,
    isActive,
    getResolvedBackground,
    colors,
    mode,
    themePresetId,
  ]);

  return null;
}
