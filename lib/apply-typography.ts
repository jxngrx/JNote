import {
  getPrimaryFont,
  getPrimaryFontFamily,
  getSecondaryFontFamily,
} from '@/lib/app-fonts';
import type {
  PersistedTypographyState,
  TypographySettings,
} from '@/lib/typography-settings-store';
import { normalizeTypographyState } from '@/lib/typography-settings-store';

export function applyTypographyToDocument(settings: TypographySettings) {
  if (typeof document === 'undefined') return;

  const normalized = normalizeTypographyState(settings);
  const primaryFont = getPrimaryFont(normalized.primaryFontFamily);
  const style =
    normalized.fontStyle === 'italic' && primaryFont.supportsItalic
      ? normalized.fontStyle
      : 'normal';

  const primaryFamily = getPrimaryFontFamily(normalized.primaryFontFamily);
  const secondaryFamily = getSecondaryFontFamily(
    normalized.secondaryFontFamily
  );

  const root = document.documentElement;
  const { body } = document;

  root.style.setProperty('--font-primary', primaryFamily);
  root.style.setProperty('--font-secondary', secondaryFamily);
  root.style.setProperty('--font', primaryFamily);
  root.style.setProperty('--font-mono', secondaryFamily);
  root.style.setProperty('--app-font-weight', String(normalized.fontWeight));
  root.style.setProperty('--app-font-style', style);
  root.dataset.appFontPrimary = normalized.primaryFontFamily;
  root.dataset.appFontSecondary = normalized.secondaryFontFamily;
  root.dataset.typographyActive = 'true';

  if (body) {
    body.style.fontFamily = primaryFamily;
    body.style.fontWeight = String(normalized.fontWeight);
    body.style.fontStyle = style;
  }
}

export function typographySettingsFromPersisted(
  state: PersistedTypographyState
): TypographySettings {
  return normalizeTypographyState(state);
}
