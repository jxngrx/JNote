import type { ThemeColors, ThemeMode } from '@/lib/theme-types';

export function borderColor(mode: ThemeMode, opacity: number): string {
  const channel = mode === 'light' ? '0, 0, 0' : '255, 255, 255';
  return `rgba(${channel}, ${opacity})`;
}

export function shadowVars(mode: ThemeMode) {
  if (mode === 'light') {
    return {
      sm: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
      md: '0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
      lg: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
    };
  }

  return {
    sm: '0 1px 3px rgba(0, 0, 0, 0.18), 0 1px 2px rgba(0, 0, 0, 0.12)',
    md: '0 4px 16px rgba(0, 0, 0, 0.24), 0 1px 4px rgba(0, 0, 0, 0.12)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.36), 0 2px 8px rgba(0, 0, 0, 0.18)',
  };
}

function expandHex(hex: string): string {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length === 3) {
    return normalized
      .split('')
      .map((char) => char + char)
      .join('');
  }
  return normalized.slice(0, 6);
}

export function colorWithAlpha(color: string, alpha: number): string {
  const trimmed = color.trim();
  if (trimmed.startsWith('rgba(')) return trimmed;
  if (trimmed.startsWith('rgb(')) {
    return trimmed.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  }
  if (!trimmed.startsWith('#')) return trimmed;

  const hex = expandHex(trimmed);
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function uiAlphaTokens() {
  return {
    '--ui-alpha-1': 'color-mix(in srgb, var(--text-primary) 3%, transparent)',
    '--ui-alpha-2': 'color-mix(in srgb, var(--text-primary) 5%, transparent)',
    '--ui-alpha-3': 'color-mix(in srgb, var(--text-primary) 8%, transparent)',
    '--ui-alpha-4': 'color-mix(in srgb, var(--text-primary) 11%, transparent)',
    '--ui-alpha-5': 'color-mix(in srgb, var(--text-primary) 15%, transparent)',
    '--ui-alpha-6': 'color-mix(in srgb, var(--text-primary) 20%, transparent)',
    '--ui-scrim': 'color-mix(in srgb, var(--bg) 70%, transparent)',
    '--ui-scrim-heavy': 'color-mix(in srgb, var(--bg) 55%, transparent)',
    '--ui-floating': 'color-mix(in srgb, var(--surface) 90%, transparent)',
  };
}

export function themeToCssVars(
  colors: ThemeColors,
  mode: ThemeMode
): Record<string, string> {
  const shadows = shadowVars(mode);
  const mutedStrength = mode === 'light' ? '14%' : '18%';
  const onAccent = mode === 'light' ? '#ffffff' : colors.bg;

  return {
    '--theme-bg': colors.bg,
    '--theme-surface': colors.surface,
    '--theme-surface-2': colors.surface2,
    '--theme-text-primary': colors.textPrimary,
    '--theme-text-secondary': colors.textSecondary,
    '--theme-text-tertiary': colors.textTertiary,
    '--theme-accent': colors.accent,
    '--bg': colors.bg,
    '--surface': colors.surface,
    '--surface-2': colors.surface2,
    '--border': borderColor(mode, colors.borderOpacity),
    '--border-strong': borderColor(mode, colors.borderStrongOpacity),
    '--text-primary': colors.textPrimary,
    '--text-secondary': colors.textSecondary,
    '--text-tertiary': colors.textTertiary,
    '--accent': colors.accent,
    '--orange': colors.accent,
    '--orange-muted': `color-mix(in srgb, ${colors.accent} ${mutedStrength}, transparent)`,
    '--red': colors.red,
    '--green': colors.green,
    '--amber': colors.amber,
    '--blue': colors.blue,
    '--shadow-sm': shadows.sm,
    '--shadow-md': shadows.md,
    '--shadow-lg': shadows.lg,
    '--ui-on-accent': onAccent,
    '--note-inset':
      mode === 'light'
        ? 'color-mix(in srgb, var(--text-primary) 6%, transparent)'
        : 'color-mix(in srgb, white 10%, transparent)',
    '--note-border':
      mode === 'light'
        ? 'color-mix(in srgb, var(--text-primary) 5%, transparent)'
        : 'color-mix(in srgb, white 5%, transparent)',
    '--background': colors.bg,
    '--foreground': colors.textPrimary,
    '--card': colors.surface,
    '--card-foreground': colors.textPrimary,
    '--popover': colors.surface,
    '--popover-foreground': colors.textPrimary,
    '--primary': colors.textPrimary,
    '--primary-foreground': colors.bg,
    '--secondary': colors.surface2,
    '--secondary-foreground': colors.textPrimary,
    '--muted': colors.surface2,
    '--muted-foreground': colors.textSecondary,
    '--input': colors.surface2,
    '--ring': colors.accent,
    ...uiAlphaTokens(),
  };
}

export function wallpaperAdaptedVars(
  colors: ThemeColors,
  mode: ThemeMode
): Record<string, string> {
  const shadows = shadowVars(mode);
  const mutedStrength = mode === 'light' ? '14%' : '18%';
  const onAccent = mode === 'light' ? '#ffffff' : colors.bg;
  const glass =
    mode === 'light'
      ? {
          bg: 0.68,
          surface: 0.9,
          surface2: 0.8,
        }
      : {
          bg: 0.72,
          surface: 0.86,
          surface2: 0.76,
        };

  return {
    '--theme-bg': colors.bg,
    '--theme-surface': colors.surface,
    '--theme-surface-2': colors.surface2,
    '--theme-text-primary': colors.textPrimary,
    '--theme-text-secondary': colors.textSecondary,
    '--theme-text-tertiary': colors.textTertiary,
    '--theme-accent': colors.accent,
    '--bg': colorWithAlpha(colors.bg, glass.bg),
    '--surface': colorWithAlpha(colors.surface, glass.surface),
    '--surface-2': colorWithAlpha(colors.surface2, glass.surface2),
    '--border': borderColor(mode, colors.borderOpacity),
    '--border-strong': borderColor(mode, colors.borderStrongOpacity),
    '--text-primary': colors.textPrimary,
    '--text-secondary': colors.textSecondary,
    '--text-tertiary': colors.textTertiary,
    '--accent': colors.accent,
    '--orange': colors.accent,
    '--orange-muted': `color-mix(in srgb, ${colors.accent} ${mutedStrength}, transparent)`,
    '--red': colors.red,
    '--green': colors.green,
    '--amber': colors.amber,
    '--blue': colors.blue,
    '--shadow-sm': shadows.sm,
    '--shadow-md': shadows.md,
    '--shadow-lg': shadows.lg,
    '--ui-on-accent': onAccent,
    '--background': colorWithAlpha(colors.bg, glass.bg),
    '--foreground': colors.textPrimary,
    '--card': colorWithAlpha(colors.surface, glass.surface),
    '--card-foreground': colors.textPrimary,
    '--popover': colorWithAlpha(colors.surface, glass.surface),
    '--popover-foreground': colors.textPrimary,
    '--primary': colors.textPrimary,
    '--primary-foreground': colors.bg,
    '--secondary': colorWithAlpha(colors.surface2, glass.surface2),
    '--secondary-foreground': colors.textPrimary,
    '--muted': colorWithAlpha(colors.surface2, glass.surface2),
    '--muted-foreground': colors.textSecondary,
    '--input': colorWithAlpha(colors.surface2, glass.surface2),
    '--ring': colors.accent,
    ...uiAlphaTokens(),
  };
}

const THEME_CSS_KEYS = [
  '--theme-bg',
  '--theme-surface',
  '--theme-surface-2',
  '--theme-text-primary',
  '--theme-text-secondary',
  '--theme-text-tertiary',
  '--theme-accent',
  '--bg',
  '--surface',
  '--surface-2',
  '--border',
  '--border-strong',
  '--text-primary',
  '--text-secondary',
  '--text-tertiary',
  '--accent',
  '--orange',
  '--orange-muted',
  '--red',
  '--green',
  '--amber',
  '--blue',
  '--shadow-sm',
  '--shadow-md',
  '--shadow-lg',
  '--ui-on-accent',
  '--note-inset',
  '--note-border',
  '--ui-alpha-1',
  '--ui-alpha-2',
  '--ui-alpha-3',
  '--ui-alpha-4',
  '--ui-alpha-5',
  '--ui-alpha-6',
  '--ui-scrim',
  '--ui-scrim-heavy',
  '--ui-floating',
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--input',
  '--ring',
] as const;

export function applyThemeToDocument(
  colors: ThemeColors,
  mode: ThemeMode,
  presetId: string
) {
  const root = document.documentElement;
  const vars = themeToCssVars(colors, mode);

  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  root.dataset.themeMode = mode;
  root.dataset.themePreset = presetId;
  root.dataset.themeActive = 'true';
  root.classList.toggle('dark', mode === 'dark');
  root.style.colorScheme = mode;
}

export function applyWallpaperAdaptedTheme(colors: ThemeColors, mode: ThemeMode) {
  const root = document.documentElement;
  const vars = wallpaperAdaptedVars(colors, mode);

  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export function clearThemeFromDocument() {
  const root = document.documentElement;

  THEME_CSS_KEYS.forEach((key) => root.style.removeProperty(key));
  delete root.dataset.themeMode;
  delete root.dataset.themePreset;
  delete root.dataset.themeActive;
  root.classList.remove('dark');
  root.style.removeProperty('color-scheme');
}
