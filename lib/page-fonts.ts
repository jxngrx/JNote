export type PageFontGroup = 'sans' | 'serif' | 'writer' | 'mono';

export type PageFontId =
  | 'default'
  | 'dm-sans'
  | 'source-serif'
  | 'libre-baskerville'
  | 'playfair'
  | 'caveat'
  | 'patrick-hand'
  | 'dancing-script'
  | 'indie-flower'
  | 'kalam'
  | 'fira-code'
  | 'jetbrains-mono'
  | 'dm-mono';

export type PageFontDefinition = {
  id: PageFontId;
  label: string;
  css: string;
  google?: string;
  group: PageFontGroup;
};

export const PAGE_FONT_GROUPS: { id: PageFontGroup; label: string }[] = [
  { id: 'sans', label: 'Sans' },
  { id: 'serif', label: 'Serif' },
  { id: 'writer', label: 'Writer' },
  { id: 'mono', label: 'Code' },
];

export const PAGE_FONTS: PageFontDefinition[] = [
  { id: 'default', label: 'Default', css: 'var(--font)', group: 'sans' },
  { id: 'dm-sans', label: 'DM Sans', css: 'var(--font-dm-sans)', group: 'sans' },
  { id: 'source-serif', label: 'Source Serif', css: "'Source Serif 4', serif", google: 'Source+Serif+4', group: 'serif' },
  { id: 'libre-baskerville', label: 'Libre Baskerville', css: 'var(--font-libre-baskerville)', group: 'serif' },
  { id: 'playfair', label: 'Playfair Display', css: 'var(--font-playfair)', group: 'serif' },
  { id: 'caveat', label: 'Caveat', css: "'Caveat', cursive", google: 'Caveat', group: 'writer' },
  { id: 'patrick-hand', label: 'Patrick Hand', css: "'Patrick Hand', cursive", google: 'Patrick+Hand', group: 'writer' },
  { id: 'dancing-script', label: 'Dancing Script', css: "'Dancing Script', cursive", google: 'Dancing+Script', group: 'writer' },
  { id: 'indie-flower', label: 'Indie Flower', css: "'Indie Flower', cursive", google: 'Indie+Flower', group: 'writer' },
  { id: 'kalam', label: 'Kalam', css: "'Kalam', cursive", google: 'Kalam', group: 'writer' },
  { id: 'fira-code', label: 'Fira Code', css: 'var(--font-fira-code)', google: 'Fira+Code', group: 'mono' },
  { id: 'jetbrains-mono', label: 'JetBrains Mono', css: "'JetBrains Mono', monospace", google: 'JetBrains+Mono', group: 'mono' },
  { id: 'dm-mono', label: 'DM Mono', css: 'var(--font-dm-mono)', group: 'mono' },
];

export function getPageFont(id: string): PageFontDefinition {
  return PAGE_FONTS.find((f) => f.id === id) ?? PAGE_FONTS[0];
}

export function getPageFontCss(id: string) {
  return getPageFont(id).css;
}

const loadedGoogle = new Set<string>();

export function ensurePageFontLoaded(id: string) {
  if (typeof document === 'undefined') return;
  const font = getPageFont(id);
  if (!font.google || loadedGoogle.has(font.google)) return;
  loadedGoogle.add(font.google);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.google}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

/** Legacy page.fontFamily values */
export function normalizePageFontId(value?: string | null): PageFontId {
  if (!value) return 'default';
  if (value === 'serif') return 'libre-baskerville';
  if (value === 'mono') return 'fira-code';
  if (PAGE_FONTS.some((f) => f.id === value)) return value as PageFontId;
  return 'default';
}
