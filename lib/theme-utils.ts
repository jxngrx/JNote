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

export function themeToCssVars(
  colors: ThemeColors,
  mode: ThemeMode
): Record<string, string> {
  const shadows = shadowVars(mode);
  const mutedStrength = mode === 'light' ? '14%' : '18%';

  return {
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
  };
}

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
}

export function clearThemeFromDocument() {
  const root = document.documentElement;
  const keys = [
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
  ];

  keys.forEach((key) => root.style.removeProperty(key));
  delete root.dataset.themeMode;
  delete root.dataset.themePreset;
  delete root.dataset.themeActive;
}
