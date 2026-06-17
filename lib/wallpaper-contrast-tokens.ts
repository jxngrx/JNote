import type { WallpaperTone } from '@/lib/wallpaper-luminance';
import { applyThemeToDocument } from '@/lib/theme-utils';
import { useThemeStore } from '@/lib/theme-store';

const WALLPAPER_TOKEN_KEYS = [
  '--text-primary',
  '--text-secondary',
  '--text-tertiary',
  '--surface',
  '--surface-2',
  '--border',
  '--border-strong',
  '--shadow-sm',
  '--shadow-md',
  '--shadow-lg',
] as const;

const WALLPAPER_TOKENS: Record<WallpaperTone, Record<(typeof WALLPAPER_TOKEN_KEYS)[number], string>> = {
  light: {
    '--text-primary': '#121110',
    '--text-secondary': '#3f3d3a',
    '--text-tertiary': '#5e5b57',
    '--surface': 'rgba(255, 255, 255, 0.9)',
    '--surface-2': 'rgba(255, 255, 255, 0.78)',
    '--border': 'rgba(0, 0, 0, 0.09)',
    '--border-strong': 'rgba(0, 0, 0, 0.16)',
    '--shadow-sm': '0 1px 4px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.05)',
    '--shadow-md': '0 6px 20px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.06)',
    '--shadow-lg': '0 12px 36px rgba(0, 0, 0, 0.14), 0 4px 10px rgba(0, 0, 0, 0.08)',
  },
  dark: {
    '--text-primary': '#f3f0ea',
    '--text-secondary': '#c8c5bf',
    '--text-tertiary': '#8f8c87',
    '--surface': 'rgba(18, 18, 16, 0.84)',
    '--surface-2': 'rgba(26, 26, 24, 0.74)',
    '--border': 'rgba(255, 255, 255, 0.1)',
    '--border-strong': 'rgba(255, 255, 255, 0.16)',
    '--shadow-sm': '0 1px 4px rgba(0, 0, 0, 0.28), 0 1px 2px rgba(0, 0, 0, 0.18)',
    '--shadow-md': '0 6px 20px rgba(0, 0, 0, 0.34), 0 2px 6px rgba(0, 0, 0, 0.2)',
    '--shadow-lg': '0 12px 36px rgba(0, 0, 0, 0.42), 0 4px 10px rgba(0, 0, 0, 0.24)',
  },
};

export function applyWallpaperContrastTokens(tone: WallpaperTone) {
  const root = document.documentElement;
  const tokens = WALLPAPER_TOKENS[tone];
  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
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
