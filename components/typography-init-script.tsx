import { TYPOGRAPHY_STORAGE_KEY } from '@/lib/typography-settings-store';

/** Apply persisted typography before first paint to avoid font flash. */
export default function TypographyInitScript() {
  const script = `
(function () {
  try {
    var raw = localStorage.getItem(${JSON.stringify(TYPOGRAPHY_STORAGE_KEY)});
    if (!raw) return;
    var parsed = JSON.parse(raw);
    var state = parsed && parsed.state ? parsed.state : parsed;
    if (!state) return;

    var primaryMap = {
      'dm-sans': { css: 'var(--font-dm-sans), sans-serif', italic: false },
      'space-grotesk': { css: 'var(--font-space-grotesk), sans-serif', italic: false },
      'syne': { css: 'var(--font-syne), sans-serif', italic: false },
      'playfair': { css: 'var(--font-playfair), serif', italic: true },
      'cormorant': { css: 'var(--font-cormorant), serif', italic: true },
      'instrument-serif': { css: 'var(--font-instrument-serif), serif', italic: true },
      'libre-baskerville': { css: 'var(--font-libre-baskerville), serif', italic: true },
      'fraunces': { css: 'var(--font-fraunces), serif', italic: true }
    };
    var secondaryMap = {
      'dm-mono': 'var(--font-dm-mono), monospace',
      'fira-code': 'var(--font-fira-code), monospace'
    };

    var primaryId = state.primaryFontFamily || state.fontFamily || 'dm-sans';
    if (primaryId === 'fira-code') primaryId = 'dm-sans';
    var secondaryId = state.secondaryFontFamily || (state.fontFamily === 'fira-code' ? 'fira-code' : 'dm-mono');

    var primary = primaryMap[primaryId] || primaryMap['dm-sans'];
    var secondary = secondaryMap[secondaryId] || secondaryMap['dm-mono'];
    var style = state.fontStyle === 'italic' && primary.italic ? 'italic' : 'normal';
    var weight = state.fontWeight;
    if (weight !== 300 && weight !== 400 && weight !== 500 && weight !== 600) weight = 400;

    var root = document.documentElement;
    root.style.setProperty('--font-primary', primary.css);
    root.style.setProperty('--font-secondary', secondary);
    root.style.setProperty('--font', primary.css);
    root.style.setProperty('--font-mono', secondary);
    root.style.setProperty('--app-font-weight', String(weight));
    root.style.setProperty('--app-font-style', style);
    root.dataset.appFontPrimary = primaryId;
    root.dataset.appFontSecondary = secondaryId;
    root.dataset.typographyActive = 'true';
  } catch (e) {}
})();
`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
