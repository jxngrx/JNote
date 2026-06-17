export type AppFontCategory = 'sans' | 'serif';

export type AppPrimaryFontId =
  | 'dm-sans'
  | 'space-grotesk'
  | 'syne'
  | 'playfair'
  | 'cormorant'
  | 'instrument-serif'
  | 'libre-baskerville'
  | 'fraunces';

export type AppSecondaryFontId = 'dm-mono' | 'fira-code';

export type AppFontOption = {
  id: AppPrimaryFontId;
  label: string;
  cssVar: string;
  fallback: string;
  category: AppFontCategory;
  supportsItalic: boolean;
  description: string;
};

export type AppSecondaryFontOption = {
  id: AppSecondaryFontId;
  label: string;
  cssVar: string;
  fallback: string;
  description: string;
};

export const APP_FONT_CATEGORIES: { id: AppFontCategory; label: string }[] = [
  { id: 'sans', label: 'Sans' },
  { id: 'serif', label: 'Serif' },
];

export const APP_PRIMARY_FONTS: AppFontOption[] = [
  {
    id: 'dm-sans',
    label: 'DM Sans',
    cssVar: '--font-dm-sans',
    fallback: 'sans-serif',
    category: 'sans',
    supportsItalic: false,
    description: 'Clean product UI — default Noterx voice.',
  },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    cssVar: '--font-space-grotesk',
    fallback: 'sans-serif',
    category: 'sans',
    supportsItalic: false,
    description: 'Geometric sans with character — modern and sharp.',
  },
  {
    id: 'syne',
    label: 'Syne',
    cssVar: '--font-syne',
    fallback: 'sans-serif',
    category: 'sans',
    supportsItalic: false,
    description: 'Expressive display sans — bold editorial feel.',
  },
  {
    id: 'playfair',
    label: 'Playfair Display',
    cssVar: '--font-playfair',
    fallback: 'serif',
    category: 'serif',
    supportsItalic: true,
    description: 'High-contrast serif — refined and literary.',
  },
  {
    id: 'cormorant',
    label: 'Cormorant Garamond',
    cssVar: '--font-cormorant',
    fallback: 'serif',
    category: 'serif',
    supportsItalic: true,
    description: 'Elegant old-style serif — calm and airy.',
  },
  {
    id: 'instrument-serif',
    label: 'Instrument Serif',
    cssVar: '--font-instrument-serif',
    fallback: 'serif',
    category: 'serif',
    supportsItalic: true,
    description: 'Contemporary serif with subtle warmth.',
  },
  {
    id: 'libre-baskerville',
    label: 'Libre Baskerville',
    cssVar: '--font-libre-baskerville',
    fallback: 'serif',
    category: 'serif',
    supportsItalic: true,
    description: 'Classic book serif — readable and trustworthy.',
  },
  {
    id: 'fraunces',
    label: 'Fraunces',
    cssVar: '--font-fraunces',
    fallback: 'serif',
    category: 'serif',
    supportsItalic: true,
    description: 'Soft display serif — friendly and distinctive.',
  },
];

export const APP_SECONDARY_FONTS: AppSecondaryFontOption[] = [
  {
    id: 'dm-mono',
    label: 'DM Mono',
    cssVar: '--font-dm-mono',
    fallback: 'monospace',
    description: 'UI metadata, labels, and timestamps.',
  },
  {
    id: 'fira-code',
    label: 'Fira Code',
    cssVar: '--font-fira-code',
    fallback: 'monospace',
    description: 'Code-style secondary text and data.',
  },
];

export function getPrimaryFont(id: string): AppFontOption {
  return APP_PRIMARY_FONTS.find((f) => f.id === id) ?? APP_PRIMARY_FONTS[0];
}

export function getSecondaryFont(id: string): AppSecondaryFontOption {
  return APP_SECONDARY_FONTS.find((f) => f.id === id) ?? APP_SECONDARY_FONTS[0];
}

export function resolveFontFamily(
  cssVar: string,
  fallback: string,
  root: HTMLElement = document.documentElement
): string {
  const resolved = getComputedStyle(root).getPropertyValue(cssVar).trim();
  return resolved ? `${resolved}, ${fallback}` : `${fallback}`;
}

export function getPrimaryFontFamily(id: AppPrimaryFontId): string {
  const font = getPrimaryFont(id);
  if (typeof document === 'undefined') {
    return `var(${font.cssVar}), ${font.fallback}`;
  }
  return resolveFontFamily(font.cssVar, font.fallback);
}

export function getSecondaryFontFamily(id: AppSecondaryFontId): string {
  const font = getSecondaryFont(id);
  if (typeof document === 'undefined') {
    return `var(${font.cssVar}), ${font.fallback}`;
  }
  return resolveFontFamily(font.cssVar, font.fallback);
}

/** @deprecated Use APP_PRIMARY_FONTS */
export const APP_FONTS = APP_PRIMARY_FONTS;
/** @deprecated Use getPrimaryFont */
export const getAppFont = getPrimaryFont;
/** @deprecated Use getPrimaryFontFamily */
export const getAppFontFamily = getPrimaryFontFamily;
