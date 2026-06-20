import type { WallpaperTone } from '@/lib/wallpaper-luminance';
import type { ThemeColors, ThemeMode } from '@/lib/theme-types';
import {
  applyThemeToDocument,
  applyWallpaperAdaptedTheme,
} from '@/lib/theme-utils';
import { useThemeStore } from '@/lib/theme-store';

export function applyWallpaperContrastTokens(
  colors: ThemeColors,
  mode: ThemeMode
) {
  applyWallpaperAdaptedTheme(colors, mode);
}

export function restoreThemeTokens() {
  const { colors, mode, presetId } = useThemeStore.getState();
  applyThemeToDocument(colors, mode, presetId);
}

export function clearWallpaperContrastState() {
  const root = document.documentElement;
  root.removeAttribute('data-wallpaper-active');
  root.removeAttribute('data-wallpaper-tone');
  delete root.dataset.wallpaperActive;
  delete root.dataset.wallpaperTone;
  restoreThemeTokens();
}

/** Wallpaper luminance tone — used only for readability CSS, not palette replacement. */
export type { WallpaperTone };
