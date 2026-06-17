export type ThemeMode = 'dark' | 'light';

export type ThemeColorKey =
  | 'bg'
  | 'surface'
  | 'surface2'
  | 'textPrimary'
  | 'textSecondary'
  | 'textTertiary'
  | 'accent'
  | 'red'
  | 'green'
  | 'amber'
  | 'blue';

export type ThemeColors = {
  bg: string;
  surface: string;
  surface2: string;
  borderOpacity: number;
  borderStrongOpacity: number;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  red: string;
  green: string;
  amber: string;
  blue: string;
};

export type ThemePreset = {
  id: string;
  name: string;
  mode: ThemeMode;
  colors: ThemeColors;
};

export type ThemePresetId = string;

export const THEME_COLOR_LABELS: Record<ThemeColorKey, string> = {
  bg: 'Background',
  surface: 'Surface',
  surface2: 'Surface elevated',
  textPrimary: 'Text primary',
  textSecondary: 'Text secondary',
  textTertiary: 'Text tertiary',
  accent: 'Accent',
  red: 'Danger',
  green: 'Success',
  amber: 'Warning',
  blue: 'Info',
};

export const THEME_COLOR_GROUPS: { title: string; keys: ThemeColorKey[] }[] = [
  {
    title: 'Surfaces',
    keys: ['bg', 'surface', 'surface2'],
  },
  {
    title: 'Typography',
    keys: ['textPrimary', 'textSecondary', 'textTertiary'],
  },
  {
    title: 'Brand & semantic',
    keys: ['accent', 'red', 'green', 'amber', 'blue'],
  },
];
