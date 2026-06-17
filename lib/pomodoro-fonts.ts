export type PomodoroFontId =
  | 'dm-sans'
  | 'dm-mono'
  | 'playfair'
  | 'cormorant'
  | 'instrument-serif'
  | 'space-grotesk'
  | 'syne'
  | 'libre-baskerville'
  | 'fraunces';

export type PomodoroFontOption = {
  id: PomodoroFontId;
  label: string;
  cssVar: string;
  fallback: string;
  category: 'sans' | 'serif' | 'display' | 'mono';
};

export const POMODORO_FONTS: PomodoroFontOption[] = [
  {
    id: 'dm-sans',
    label: 'DM Sans',
    cssVar: 'var(--font-dm-sans)',
    fallback: 'sans-serif',
    category: 'sans',
  },
  {
    id: 'dm-mono',
    label: 'DM Mono',
    cssVar: 'var(--font-dm-mono)',
    fallback: 'monospace',
    category: 'mono',
  },
  {
    id: 'playfair',
    label: 'Playfair Display',
    cssVar: 'var(--font-playfair)',
    fallback: 'serif',
    category: 'serif',
  },
  {
    id: 'cormorant',
    label: 'Cormorant Garamond',
    cssVar: 'var(--font-cormorant)',
    fallback: 'serif',
    category: 'serif',
  },
  {
    id: 'instrument-serif',
    label: 'Instrument Serif',
    cssVar: 'var(--font-instrument-serif)',
    fallback: 'serif',
    category: 'serif',
  },
  {
    id: 'libre-baskerville',
    label: 'Libre Baskerville',
    cssVar: 'var(--font-libre-baskerville)',
    fallback: 'serif',
    category: 'serif',
  },
  {
    id: 'fraunces',
    label: 'Fraunces',
    cssVar: 'var(--font-fraunces)',
    fallback: 'serif',
    category: 'display',
  },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    cssVar: 'var(--font-space-grotesk)',
    fallback: 'sans-serif',
    category: 'sans',
  },
  {
    id: 'syne',
    label: 'Syne',
    cssVar: 'var(--font-syne)',
    fallback: 'sans-serif',
    category: 'display',
  },
];

export function getPomodoroFontFamily(id: PomodoroFontId): string {
  const font = POMODORO_FONTS.find((f) => f.id === id) ?? POMODORO_FONTS[0];
  return `${font.cssVar}, ${font.fallback}`;
}
